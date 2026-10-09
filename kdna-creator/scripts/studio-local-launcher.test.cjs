'use strict';
// These tests cover launcher grammar, actual local TTY/pipe privacy and owned
// filesystem transactions. They do not claim SDK behavior or Host adoption.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const api = require('./studio-local-launcher.cjs');
const moduleFile = path.join(__dirname, 'studio-local-launcher.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const digest = bytes => 'sha256:' + hash(bytes);
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'studio-operator-launcher-')));
  fs.chmodSync(root, 0o700);
  t.after(() => {
    function writable(dir) {
      for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name), s = fs.lstatSync(p);
        if (s.isDirectory() && !s.isSymbolicLink()) { fs.chmodSync(p, 0o700); writable(p); }
      }
    }
    writable(root); fs.rmSync(root, { recursive: true });
  });
  const installation = path.join(root, 'installation'); fs.mkdirSync(installation);
  const asset = path.join(root, 'original.kdna'), edit = path.join(root, 'edits.json'), reason = path.join(root, 'reason.json');
  fs.writeFileSync(asset, 'fixture-original-bytes'); fs.writeFileSync(edit, '{}'); fs.writeFileSync(reason, '{}');
  return { root, installation, asset, edit, reason, out: path.join(root, 'successor'), recoveryOut: path.join(root, 'recovery') };
}
function parsed(f, command = 'read', extra = []) {
  return api.argumentsFor([command, '--installation', f.installation, '--asset', f.asset, command === 'read' ? '--allow-read' : '--allow-source', ...extra]);
}
function revisionOptions(f, extra = []) {
  return parsed(f, 'revise', ['--edit', f.edit, '--reason', f.reason, '--out', f.out, ...extra]);
}
function bundle(f, binding, protectedOutput = true) {
  const bytes = Buffer.from('synthetic-saved-revision');
  const receipt = { kind: 'local-source-revision', source_A: binding.expected_A, output_A: digest(bytes), reason: 'synthetic transaction test', creation_accepted: 'not_evaluated', identity: 'not_verified', action_authorization: 'not_evaluated', protection: protectedOutput ? 'password' : 'none' };
  fs.mkdirSync(f.out, { mode: 0o700 });
  fs.writeFileSync(path.join(f.out, 'asset.kdna'), bytes, { mode: 0o400 });
  fs.writeFileSync(path.join(f.out, 'revision-receipt.json'), JSON.stringify(receipt) + '\n', { mode: 0o400 });
  fs.chmodSync(f.out, 0o500);
  return Buffer.from(JSON.stringify({ status: 'revision_saved', ...receipt }) + '\n');
}
function child(file, args = [], stdio = ['pipe', 'pipe', 'pipe']) {
  const p = spawn(file, args, { stdio });
  const chunks = [], errors = [];
  p.stdout.on('data', b => chunks.push(Buffer.from(b)));
  p.stderr.on('data', b => errors.push(Buffer.from(b)));
  const done = new Promise((resolve, reject) => {
    p.once('error', reject);
    p.once('close', code => resolve({ code, stdout: Buffer.concat(chunks), stderr: Buffer.concat(errors) }));
  });
  return { p, done };
}
test('explicit permissions, closed grammar and credential channels are required', t => {
  const f = fixture(t);
  assert.throws(() => api.argumentsFor(['read', '--installation', f.installation, '--asset', f.asset]), /LAUNCHER_PERMISSION_REQUIRED/);
  for (const extra of [['--host-fd', '3'], ['--installation-root', f.installation], ['--password', 'not-a-credential-channel'], ['--allow-source'], ['--allow-read'], ['--credential-fd', '0'], ['--budget', '1048577'], ['--judgment', '0']]) {
    assert.throws(() => parsed(f, 'read', extra), /LAUNCHER_/);
  }
  assert.throws(() => revisionOptions(f, ['--credential', 'recovery']), /LAUNCHER_REVISION_PASSWORD_REQUIRED/);
  assert.throws(() => revisionOptions(f, ['--credential', 'password']), /LAUNCHER_RECOVERY_DESTINATION_REQUIRED/);
  assert.throws(() => revisionOptions(f, ['--recovery-out', f.recoveryOut]), /LAUNCHER_RECOVERY_DESTINATION_REQUIRED/);
  assert.equal(parsed(f).allowRead, true);
});
test('fresh closed bindings independently capture actual asset/edit/reason bytes', t => {
  const f = fixture(t), opts = revisionOptions(f);
  const before = api.prepareBinding(opts), after = api.prepareBinding(opts);
  assert.deepEqual(Object.keys(before).sort(), ['installation_root', 'asset', 'expected_A', 'purpose', 'binding_id', 'expires_at_ms', 'allow_read', 'allow_source', 'output', 'edit_sha256', 'reason_sha256'].sort());
  assert.equal(before.expected_A, digest(fs.readFileSync(f.asset)));
  assert.equal(before.edit_sha256, hash(fs.readFileSync(f.edit)));
  assert.equal(before.reason_sha256, hash(fs.readFileSync(f.reason)));
  assert.equal(before.allow_read, false); assert.equal(before.allow_source, true);
  assert.notEqual(before.binding_id, after.binding_id);
  assert.ok(before.expires_at_ms > Date.now() && before.expires_at_ms <= Date.now() + 60000);
  fs.writeFileSync(f.edit, '{"changed":true}');
  assert.notEqual(api.prepareBinding(opts).edit_sha256, before.edit_sha256);
});
test('canonical explicit paths, operator-owned output parents and exclusive destinations', t => {
  const f = fixture(t);
  fs.symlinkSync(f.asset, path.join(f.root, 'alias.kdna'));
  assert.throws(() => api.prepareBinding({ ...parsed(f), asset: path.join(f.root, 'alias.kdna') }), /LAUNCHER_PATH_NOT_CANONICAL/);
  fs.mkdirSync(f.out);
  assert.throws(() => api.prepareBinding(revisionOptions(f)), /LAUNCHER_DESTINATION_EXISTS/);
  fs.rmdirSync(f.out); fs.chmodSync(f.root, 0o777);
  assert.throws(() => api.prepareBinding(revisionOptions(f)), /LAUNCHER_OUTPUT_PARENT_UNTRUSTED/);
  fs.chmodSync(f.root, 0o700);
});
test('child argv carries only scope paths and descriptor numbers, never credentials', t => {
  const f = fixture(t), opts = revisionOptions(f, ['--credential', 'password', '--recovery-out', f.recoveryOut]);
  const args = api.childArguments(opts);
  assert.ok(args.includes('--host-fd') && args.includes('--password-fd') && args.includes('--recovery-fd'));
  assert.equal(args.includes('--installation'), false);
  assert.equal(args.includes('--allow-source'), false);
  assert.deepEqual(args.slice(-2), ['--recovery-fd', '5']);
  assert.deepEqual(api.childArguments(parsed(f, 'read', ['--credential', 'recovery'])).slice(-2), ['--slot', '1']);
});
test('preopened credentials use real pipes without argv/environment/output disclosure', async t => {
  const f = fixture(t), helper = path.join(f.root, 'pipe-helper.cjs');
  fs.writeFileSync(helper, "const a=require(process.argv[2]); Promise.all([a.readCredentialPipe(3),a.readCredentialPipe(4)]).then(([x,y])=>{const ok=x.equals(y);x.fill(0);y.fill(0);process.stdout.write(ok?'OK':'FAIL');},()=>process.exit(2));");
  const proc = child(process.execPath, [helper, moduleFile], ['ignore', 'pipe', 'pipe', 'pipe', 'pipe']);
  const value = crypto.randomBytes(40).toString('hex'), bytes = Buffer.from(value);
  proc.p.stdio[3].end(Buffer.from(bytes)); proc.p.stdio[4].end(Buffer.from(bytes));
  const result = await proc.done;
  assert.equal(result.code, 0); assert.equal(result.stdout.toString(), 'OK'); assert.equal(result.stderr.length, 0);
  assert.equal(proc.p.spawnargs.some(a => a.includes(value)), false);
  assert.equal(result.stdout.includes(bytes), false); assert.equal(result.stderr.includes(bytes), false);
  bytes.fill(0);
});
async function ttyObservation(t, mode = 'success') {
  const f = fixture(t), helper = path.join(f.root, 'tty-helper.cjs'), controller = path.join(f.root, 'tty-controller.py');
  fs.writeFileSync(helper, "const a=require(process.argv[2]); (async()=>{let result='FAIL';try{const x=await a.readTTYCredential('password'),y=await a.readCredentialPipe(Number(process.argv[3]));result=x.equals(y)?'OK':'FAIL';x.fill(0);y.fill(0);}catch(e){if(e.launcherCode==='LAUNCHER_CREDENTIAL_CANCELLED')result='CANCELLED';}process.stdout.write(result);const hold=await a.readCredentialPipe(Number(process.argv[4]));hold.fill(0);})().catch(()=>process.exit(2));");
  fs.writeFileSync(controller, [
    'import os,pty,termios,fcntl,subprocess,sys,select,time,json,signal',
    'secret=sys.stdin.buffer.read()',
    'master,slave=pty.openpty(); before=termios.tcgetattr(slave)',
    'r,w=os.pipe(); os.write(w,secret); os.close(w); hr,hw=os.pipe()',
    'def setup():',
    ' os.setsid(); fcntl.ioctl(0,termios.TIOCSCTTY,0)',
    'p=subprocess.Popen([sys.argv[1],sys.argv[2],sys.argv[3],str(r),str(hr)],stdin=slave,stdout=slave,stderr=slave,pass_fds=(r,hr),preexec_fn=setup)',
    'os.close(r); os.close(hr); data=b""; sent=False; restored=False; released=False; limit=time.monotonic()+15',
    'while time.monotonic()<limit:',
    ' ready,_,_=select.select([master],[],[],0.1)',
    ' if ready:',
    '  try: part=os.read(master,4096)',
    '  except OSError: break',
    '  data+=part',
    '  if not sent and b"Password: " in data:',
    '   typed=secret+b"\\x03" if sys.argv[4]=="cancel" else secret+b"\\x04" if sys.argv[4]=="eof" else secret if sys.argv[4]=="signal" else secret+"界".encode()+b"\\x7f"+b"x\\x08\\r"',
    '   os.write(master,typed); sent=True',
    '   if sys.argv[4]=="signal": time.sleep(0.1); os.kill(p.pid,signal.SIGTERM)',
    '  if not released and any(marker in data for marker in (b"OK",b"FAIL",b"CANCELLED")):',
    '   restored=before==termios.tcgetattr(slave); os.close(hw); released=True',
    ' if p.poll() is not None: break',
    'if p.poll() is None: p.kill()',
    'code=p.wait()',
    'if not released: os.close(hw)',
    'marker=b"OK" if sys.argv[4]=="success" else b"CANCELLED"',
    'print(json.dumps({"hidden":secret not in data,"restored":restored,"ok":marker in data,"code":code,"sent":sent}))',
    'os.close(master); os.close(slave)',
  ].join('\n'));
  const value = Buffer.from(crypto.randomBytes(32).toString('hex'));
  const proc = child('python3', [controller, process.execPath, helper, moduleFile, mode]);
  proc.p.stdin.end(Buffer.from(value));
  const result = await proc.done;
  assert.equal(result.code, 0, JSON.stringify({ errorClasses: [...result.stderr.toString().matchAll(/\b([A-Z][A-Za-z]*(?:Error|Exception))\b/gu)].map(m => m[1]), errno: result.stderr.toString().match(/\[Errno ([0-9]+)\]/u)?.[1] || null })); assert.equal(result.stderr.length, 0);
  const observed = JSON.parse(result.stdout.toString());
  assert.deepEqual(observed, { hidden: true, restored: true, ok: true, code: 0, sent: true });
  assert.equal(result.stdout.includes(value), false); value.fill(0);
}
test('actual controlling TTY hides input, erases UTF-8 and restores terminal attributes', { skip: process.platform === 'win32' }, async t => {
  await ttyObservation(t);
});
test('actual controlling TTY cancellation restores echo without disclosing input', { skip: process.platform === 'win32' }, async t => {
  for (const mode of ['cancel', 'eof', 'signal']) await ttyObservation(t, mode);
});
test('recovery sink writes exclusive mode0600, fsyncs and verifies exact received bytes', t => {
  const f = fixture(t), sink = api.createRecoverySink(f.recoveryOut);
  const value = crypto.randomBytes(64), expected = Buffer.from(value);
  sink.accept(value);
  assert.ok(value.every(b => b === 0)); assert.equal(sink.finish(), true);
  assert.equal(fs.statSync(f.recoveryOut).mode & 0o777, 0o600);
  assert.equal(fs.readFileSync(f.recoveryOut).equals(expected), true);
  assert.throws(() => api.createRecoverySink(f.recoveryOut), /LAUNCHER_DESTINATION_EXISTS/);
  assert.equal(sink.removeOwn(), true); expected.fill(0);
});
test('actual partial sink write followed by ENOSPC is detected and own partial file removed', t => {
  const f = fixture(t); let calls = 0;
  const io = Object.create(fs);
  io.writeSync = (fd, bytes, at, length) => {
    calls++; if (calls > 1) throw Object.assign(new Error('synthetic disk full'), { code: 'ENOSPC' });
    return fs.writeSync(fd, bytes, at, Math.min(3, length));
  };
  const sink = api.createRecoverySink(f.recoveryOut, io), bytes = crypto.randomBytes(40);
  sink.accept(bytes); assert.equal(sink.finish(), false);
  assert.equal(fs.statSync(f.recoveryOut).size, 3);
  assert.equal(sink.removeOwn(), true); assert.equal(fs.existsSync(f.recoveryOut), false);
});
test('sink cleanup refuses another writer replacement or changed content', t => {
  const f = fixture(t), sink = api.createRecoverySink(f.recoveryOut);
  sink.accept(crypto.randomBytes(40)); assert.equal(sink.finish(), true);
  fs.writeFileSync(f.recoveryOut, 'another writer', { mode: 0o600 });
  assert.equal(sink.removeOwn(), false);
  assert.equal(fs.readFileSync(f.recoveryOut).toString(), 'another writer');
});
test('verified saved receipt binds the complete two-file result and its source/output digests', t => {
  const f = fixture(t), binding = api.prepareBinding(revisionOptions(f)), output = bundle(f, binding);
  const snapshot = api.verifyRevision(f.out, binding, output, true);
  assert.equal(snapshot.files.length, 2);
  const wrong = JSON.parse(output); wrong.source_A = 'sha256:' + '0'.repeat(64);
  assert.throws(() => api.verifyRevision(f.out, binding, Buffer.from(JSON.stringify(wrong)), true), /LAUNCHER_OUTPUT_UNVERIFIED/);
  assert.equal(api.rollbackRevision(f.out, snapshot), true); assert.equal(fs.existsSync(f.out), false);
  assert.equal(fs.readFileSync(f.asset).toString(), 'fixture-original-bytes');
});
test('rollback refuses changed, replacement or extra output owned by another writer', t => {
  const f = fixture(t), binding = api.prepareBinding(revisionOptions(f)), output = bundle(f, binding);
  const snapshot = api.verifyRevision(f.out, binding, output, true);
  fs.chmodSync(f.out, 0o700); fs.writeFileSync(path.join(f.out, 'another-writer.txt'), 'retain');
  assert.equal(api.rollbackRevision(f.out, snapshot), false);
  assert.equal(fs.existsSync(path.join(f.out, 'another-writer.txt')), true);
  assert.equal(fs.existsSync(path.join(f.out, 'asset.kdna')), true);
});
test('receiver fsync failure after accepted pipe bytes rolls back only verified successor', t => {
  const f = fixture(t), binding = api.prepareBinding(revisionOptions(f));
  const io = Object.create(fs); io.fsyncSync = () => { throw Object.assign(new Error('synthetic persistence failure'), { code: 'EIO' }); };
  const sink = api.createRecoverySink(f.recoveryOut, io);
  sink.accept(crypto.randomBytes(40)); // The transport has delivered; receiver durability still fails.
  const officialOutput = bundle(f, binding), snapshot = api.verifyRevision(f.out, binding, officialOutput, true);
  assert.equal(sink.finish(), false);
  assert.equal(api.rollbackRevision(f.out, snapshot), true);
  assert.equal(sink.removeOwn(), true);
  assert.equal(fs.existsSync(f.out), false); assert.equal(fs.existsSync(f.recoveryOut), false);
  assert.equal(fs.readFileSync(f.asset).toString(), 'fixture-original-bytes');
});
