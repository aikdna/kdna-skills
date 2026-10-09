#!/usr/bin/env node
'use strict';
// Source-only reference launcher. Run by a trusted operator outside the model's
// shell. Flags record that operator's permission; self-launch does not grant it.
// The operator protects this code, the installation and output parents against
// concurrent writes. Local pipes do not authenticate a person or a model Host.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const tty = require('node:tty');
const { spawn, spawnSync } = require('node:child_process');
const WRAPPER = path.join(__dirname, 'studio-protected-host.cjs');
const WRAPPER_SHA256 = '69544a0b7bcc3ac4a3a3c2e033914fc815bc2c37aacc088812e2466b66046096';
const ASSET_MAX = 25 * 1024 * 1024;
const JSON_MAX = 1024 * 1024;
const SECRET_MAX = 65536;
const OUTPUT_MAX = 64 * 1024 * 1024;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const digest = bytes => 'sha256:' + hash(bytes);
function fail(code) { throw Object.assign(new Error(code), { launcherCode: code }); }
function exists(file) { try { fs.lstatSync(file); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } }
function same(a, b) { return a.dev === b.dev && a.ino === b.ino; }
function capture(file, max) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd);
    if (!before.isFile() || before.nlink !== 1 || before.size > max) fail('LAUNCHER_FILE_INVALID');
    const bytes = Buffer.alloc(before.size + 1);
    let at = 0;
    while (at < bytes.length) {
      const n = fs.readSync(fd, bytes, at, bytes.length - at, null);
      if (!n) break;
      at += n;
    }
    const after = fs.fstatSync(fd);
    if (at !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) fail('LAUNCHER_FILE_CHANGED');
    return { bytes: bytes.subarray(0, at), stat: after };
  } finally { fs.closeSync(fd); }
}
function canonical(file, directory = false) {
  if (!path.isAbsolute(file) || path.normalize(file) !== file || fs.realpathSync(file) !== file) fail('LAUNCHER_PATH_NOT_CANONICAL');
  const s = fs.lstatSync(file);
  if (s.isSymbolicLink() || (directory ? !s.isDirectory() : !s.isFile())) fail('LAUNCHER_PATH_INVALID');
  return file;
}
function newTarget(file) {
  if (!path.isAbsolute(file) || path.normalize(file) !== file || path.basename(file) === '.' || path.basename(file) === path.sep) fail('LAUNCHER_PATH_NOT_CANONICAL');
  const parent = canonical(path.dirname(file), true);
  if (path.join(parent, path.basename(file)) !== file || exists(file)) fail('LAUNCHER_DESTINATION_EXISTS');
  // This is a trusted-operator surface, not a shared drop directory.
  const stat = fs.lstatSync(parent);
  if ((stat.mode & 0o022) !== 0 || (typeof process.getuid === 'function' && stat.uid !== process.getuid())) fail('LAUNCHER_OUTPUT_PARENT_UNTRUSTED');
  return file;
}
function argumentsFor(argv) {
  if (argv.length === 1 && argv[0] === '--help') return { help: true };
  const command = argv[0];
  if (!['read', 'source', 'revise'].includes(command)) fail('LAUNCHER_COMMAND_INVALID');
  const opts = { command, credential: 'none' };
  const flags = new Map([['--allow-read', 'allowRead'], ['--allow-source', 'allowSource']]);
  const values = new Map([['--installation', 'installation'], ['--asset', 'asset'], ['--credential', 'credential'], ['--credential-fd', 'credentialFd'], ['--judgment', 'judgment'], ['--budget', 'budget'], ['--out', 'out'], ['--edit', 'edit'], ['--reason', 'reason'], ['--recovery-out', 'recoveryOut']]);
  const seen = new Set();
  for (let i = 1; i < argv.length; i++) {
    const key = argv[i];
    if (seen.has(key)) fail('LAUNCHER_OPTION_DUPLICATE');
    seen.add(key);
    if (flags.has(key)) opts[flags.get(key)] = true;
    else {
      if (!values.has(key) || !argv[i + 1] || argv[i + 1].startsWith('--')) fail('LAUNCHER_OPTION_INVALID');
      opts[values.get(key)] = argv[++i];
    }
  }
  if (!opts.installation || !opts.asset) fail('LAUNCHER_PATH_REQUIRED');
  if (!['none', 'password', 'recovery'].includes(opts.credential)) fail('LAUNCHER_CREDENTIAL_KIND_INVALID');
  for (const key of ['credentialFd', 'judgment', 'budget']) if (opts[key] !== undefined) {
    if (!/^(0|[1-9][0-9]*)$/u.test(opts[key]) || !Number.isSafeInteger(Number(opts[key]))) fail('LAUNCHER_NUMBER_INVALID');
    opts[key] = Number(opts[key]);
  }
  if (opts.credentialFd !== undefined && (opts.credentialFd < 3 || opts.credential === 'none')) fail('LAUNCHER_CREDENTIAL_FD_INVALID');
  if (opts.judgment !== undefined && opts.judgment < 1) fail('LAUNCHER_SELECTION_INVALID');
  if (opts.budget !== undefined && opts.budget > 1048576) fail('LAUNCHER_BUDGET_INVALID');
  if (command === 'read') {
    if (!opts.allowRead || opts.allowSource || ['out', 'edit', 'reason', 'recoveryOut'].some(k => opts[k] !== undefined)) fail('LAUNCHER_PERMISSION_REQUIRED');
  } else {
    if (!opts.allowSource || opts.allowRead || opts.judgment !== undefined || opts.budget !== undefined) fail('LAUNCHER_PERMISSION_REQUIRED');
    if (command === 'source' && ['out', 'edit', 'reason', 'recoveryOut'].some(k => opts[k] !== undefined)) fail('LAUNCHER_OPTION_INVALID');
    if (command === 'revise') {
      if (!opts.out || !opts.edit || !opts.reason) fail('LAUNCHER_REVISION_INPUT_REQUIRED');
      if (opts.credential === 'recovery') fail('LAUNCHER_REVISION_PASSWORD_REQUIRED');
      if ((opts.credential === 'password') !== Boolean(opts.recoveryOut)) fail('LAUNCHER_RECOVERY_DESTINATION_REQUIRED');
      if (opts.recoveryOut === opts.out) fail('LAUNCHER_DESTINATION_COLLISION');
    }
  }
  return opts;
}
function prepareBinding(opts, now = Date.now(), nonce = crypto.randomUUID()) {
  canonical(opts.installation, true);
  canonical(opts.asset);
  const asset = capture(opts.asset, ASSET_MAX);
  const binding = {
    installation_root: opts.installation, asset: opts.asset,
    expected_A: digest(asset.bytes), purpose: opts.command,
    binding_id: 'operator:' + nonce, expires_at_ms: now + 60000,
    allow_read: opts.allowRead === true, allow_source: opts.allowSource === true,
  };
  if (opts.command === 'revise') {
    newTarget(opts.out);
    canonical(opts.edit); canonical(opts.reason);
    binding.output = opts.out;
    binding.edit_sha256 = hash(capture(opts.edit, JSON_MAX).bytes);
    binding.reason_sha256 = hash(capture(opts.reason, JSON_MAX).bytes);
    if (opts.recoveryOut) newTarget(opts.recoveryOut);
  }
  return Object.freeze(binding);
}
function pipe(fd) {
  const stat = fs.fstatSync(fd);
  if (!stat.isFIFO() && !stat.isSocket()) fail('LAUNCHER_CREDENTIAL_FD_NOT_PIPE');
}
function readCredentialPipe(fd) {
  pipe(fd);
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0, settled = false;
    const stream = fs.createReadStream(null, { fd, autoClose: true, highWaterMark: 4096 });
    const finish = error => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (error) { stream.destroy(); chunks.forEach(b => b.fill(0)); reject(error); }
      else { const bytes = Buffer.concat(chunks); chunks.forEach(b => b.fill(0)); resolve(bytes); }
    };
    const timer = setTimeout(() => finish(Object.assign(new Error('LAUNCHER_CREDENTIAL_TIMEOUT'), { launcherCode: 'LAUNCHER_CREDENTIAL_TIMEOUT' })), 60000);
    stream.on('data', bytes => {
      if (settled) { bytes.fill(0); return; }
      size += bytes.length;
      if (size > SECRET_MAX) { bytes.fill(0); finish(Object.assign(new Error('LAUNCHER_CREDENTIAL_LIMIT'), { launcherCode: 'LAUNCHER_CREDENTIAL_LIMIT' })); }
      else { chunks.push(Buffer.from(bytes)); bytes.fill(0); }
    });
    stream.on('error', () => finish(Object.assign(new Error('LAUNCHER_CREDENTIAL_READ_FAILED'), { launcherCode: 'LAUNCHER_CREDENTIAL_READ_FAILED' })));
    stream.on('end', () => finish());
  });
}
async function readTTYCredential(kind) {
  let fd, input, saved, stty; const chunks = []; let size = 0;
  try {
    fd = fs.openSync('/dev/tty', fs.constants.O_RDWR | fs.constants.O_NOCTTY);
    if (!tty.isatty(fd)) fail('LAUNCHER_CONTROLLING_TTY_REQUIRED');
    stty = ['/bin/stty', '/usr/bin/stty'].find(p => exists(p));
    if (!stty) fail('LAUNCHER_TTY_CONTROL_UNAVAILABLE');
    const state = spawnSync(stty, ['-g'], { stdio: [fd, 'pipe', 'ignore'], maxBuffer: 4096 });
    saved = state.stdout?.toString('ascii').trim();
    // BSD/macOS uses gfmt1:name=hex fields; GNU uses colon-separated hex.
    // The exact state is a single argv entry to stty, never shell text.
    if (state.status !== 0 || !saved || !/^(?:[0-9a-f]+(?::[0-9a-f]+)*|gfmt1:[a-z0-9]+=[0-9a-f]+(?::[a-z0-9]+=[0-9a-f]+)*)$/iu.test(saved)) fail('LAUNCHER_TTY_CONTROL_UNAVAILABLE');
    input = new tty.ReadStream(fd);
    input.setRawMode(true);
    fs.writeSync(fd, kind === 'recovery' ? 'Recovery credential: ' : 'Password: ');
    return await new Promise((resolve, reject) => {
      let settled = false;
      const finish = error => {
        if (settled) return;
        settled = true;
        input.pause();
        for (const signal of ['SIGTERM', 'SIGHUP', 'SIGINT']) process.removeListener(signal, interrupted);
        if (error) reject(error);
        else resolve(Buffer.concat(chunks));
      };
      const interrupted = () => finish(Object.assign(new Error('LAUNCHER_CREDENTIAL_CANCELLED'), { launcherCode: 'LAUNCHER_CREDENTIAL_CANCELLED' }));
      for (const signal of ['SIGTERM', 'SIGHUP', 'SIGINT']) process.once(signal, interrupted);
      input.on('error', interrupted);
      input.on('data', bytes => {
        try {
          for (const byte of bytes) {
            if (byte === 3 || byte === 4) { interrupted(); return; }
            if (byte === 13 || byte === 10) { finish(); return; }
            if (byte === 8 || byte === 127) {
              // Erase one UTF-8 code point without displaying it or a mask.
              while (chunks.length) {
                const removed = chunks.pop(), value = removed[0];
                removed.fill(0); size--;
                if ((value & 0xc0) !== 0x80) break;
              }
              continue;
            }
            size++;
            if (size > SECRET_MAX) { finish(Object.assign(new Error('LAUNCHER_CREDENTIAL_LIMIT'), { launcherCode: 'LAUNCHER_CREDENTIAL_LIMIT' })); return; }
            chunks.push(Buffer.from([byte]));
          }
        } finally { bytes.fill(0); }
      });
      input.resume();
    });
  } catch (e) {
    if (e.launcherCode) throw e;
    fail('LAUNCHER_CONTROLLING_TTY_REQUIRED');
  } finally {
    chunks.forEach(b => b.fill(0));
    if (fd !== undefined) {
      const restored = saved && stty ? spawnSync(stty, [saved], { stdio: [fd, 'ignore', 'ignore'] }).status === 0 : true;
      try { fs.writeSync(fd, '\n'); } catch {}
      if (input) input.destroy();
      else try { fs.closeSync(fd); } catch {}
      if (!restored) fail('LAUNCHER_TTY_RESTORE_FAILED');
    }
  }
}
function trimCredential(bytes) {
  let length = bytes.length;
  if (length && bytes[length - 1] === 10) { length--; if (length && bytes[length - 1] === 13) length--; }
  if (!length || length > SECRET_MAX) { bytes.fill(0); fail('LAUNCHER_CREDENTIAL_EMPTY'); }
  const result = Buffer.from(bytes.subarray(0, length)); bytes.fill(0); return result;
}
function createRecoverySink(file, io = fs) {
  newTarget(file);
  const fd = io.openSync(file, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY | fs.constants.O_NOFOLLOW, 0o600);
  const identity = io.fstatSync(fd);
  let opened = true, size = 0, failure = false; const contentHash = crypto.createHash('sha256'), writtenHash = crypto.createHash('sha256');
  try { io.fchmodSync(fd, 0o600); } catch { failure = true; }
  function accept(bytes) {
    try {
      size += bytes.length;
      if (size > SECRET_MAX) failure = true;
      if (!failure) {
        contentHash.update(bytes);
        let at = 0;
        while (at < bytes.length) { const n = io.writeSync(fd, bytes, at, bytes.length - at); if (n <= 0) throw new Error(); writtenHash.update(bytes.subarray(at, at + n)); at += n; }
      }
    } catch { failure = true; }
    finally { bytes.fill(0); }
  }
  function finish() {
    try {
      if (!size || failure) return false;
      io.fsyncSync(fd); io.closeSync(fd); opened = false;
      const actual = capture(file, SECRET_MAX);
      try { return same(actual.stat, identity) && (actual.stat.mode & 0o777) === 0o600 && actual.bytes.length === size && hash(actual.bytes) === contentHash.digest('hex'); }
      finally { actual.bytes.fill(0); }
    } catch { return false; }
    finally { if (opened) { try { io.closeSync(fd); } catch {} opened = false; } }
  }
  function removeOwn() {
    if (opened) { try { io.closeSync(fd); } catch {} opened = false; }
    try {
      const actual = capture(file, SECRET_MAX);
      try { if (!same(actual.stat, identity) || (actual.stat.mode & 0o777) !== 0o600 || hash(actual.bytes) !== writtenHash.copy().digest('hex')) return false; }
      finally { actual.bytes.fill(0); }
      fs.unlinkSync(file); return true;
    }
    catch (e) { return e.code === 'ENOENT'; }
  }
  return { accept, finish, removeOwn };
}
function verifyRevision(out, binding, bytes, protectedOutput) {
  let result;
  try { result = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { fail('LAUNCHER_OUTPUT_UNVERIFIED'); }
  if (result.status !== 'revision_saved' || result.kind !== 'local-source-revision' || result.source_A !== binding.expected_A ||
      result.creation_accepted !== 'not_evaluated' || result.identity !== 'not_verified' || result.action_authorization !== 'not_evaluated' ||
      result.protection !== (protectedOutput ? 'password' : 'none') || !/^sha256:[0-9a-f]{64}$/u.test(result.output_A)) fail('LAUNCHER_OUTPUT_UNVERIFIED');
  canonical(out, true);
  const dir = fs.lstatSync(out);
  if ((dir.mode & 0o777) !== 0o500 || JSON.stringify(fs.readdirSync(out).sort()) !== JSON.stringify(['asset.kdna', 'revision-receipt.json'])) fail('LAUNCHER_OUTPUT_UNVERIFIED');
  const files = ['asset.kdna', 'revision-receipt.json'].map(name => {
    const item = capture(path.join(out, name), name === 'asset.kdna' ? ASSET_MAX : JSON_MAX);
    if ((item.stat.mode & 0o777) !== 0o400) fail('LAUNCHER_OUTPUT_UNVERIFIED');
    return { name, stat: item.stat, bytes: item.bytes, sha256: hash(item.bytes) };
  });
  if (digest(files[0].bytes) !== result.output_A) fail('LAUNCHER_OUTPUT_UNVERIFIED');
  const { status, ...receipt } = result;
  if (!files[1].bytes.equals(Buffer.from(JSON.stringify(receipt) + '\n'))) fail('LAUNCHER_OUTPUT_UNVERIFIED');
  return { dir, files };
}
function rollbackRevision(out, snapshot) {
  // Recheck the complete owned result before unlinking; changed/extra objects stay.
  try {
    const current = fs.lstatSync(out);
    if (!same(current, snapshot.dir) || (current.mode & 0o777) !== 0o500 || current.mtimeMs !== snapshot.dir.mtimeMs || current.ctimeMs !== snapshot.dir.ctimeMs || JSON.stringify(fs.readdirSync(out).sort()) !== JSON.stringify(snapshot.files.map(f => f.name).sort())) return false;
    for (const item of snapshot.files) {
      const actual = capture(path.join(out, item.name), item.bytes.length);
      if (!same(actual.stat, item.stat) || actual.stat.mtimeMs !== item.stat.mtimeMs || actual.stat.ctimeMs !== item.stat.ctimeMs || hash(actual.bytes) !== item.sha256 || (actual.stat.mode & 0o777) !== 0o400) return false;
    }
    fs.chmodSync(out, 0o700);
    for (const item of snapshot.files) {
      const stat = fs.lstatSync(path.join(out, item.name));
      if (!same(stat, item.stat)) return false;
      fs.unlinkSync(path.join(out, item.name));
    }
    if (!same(fs.lstatSync(out), snapshot.dir) || fs.readdirSync(out).length) return false;
    fs.rmdirSync(out); return true;
  } catch { return false; }
}
function childArguments(opts) {
  const args = [opts.command, '--asset', opts.asset, '--host-fd', '3'];
  if (opts.credential !== 'none') args.push('--password-fd', '4', '--slot', opts.credential === 'recovery' ? '1' : '0');
  if (opts.command === 'read') {
    if (opts.judgment !== undefined) args.push('--judgment', String(opts.judgment));
    if (opts.budget !== undefined) args.push('--budget', String(opts.budget));
  }
  if (opts.command === 'revise') {
    args.push('--out', opts.out, '--edit', opts.edit, '--reason', opts.reason);
    if (opts.credential === 'password') args.push('--recovery-fd', '5');
  }
  return args;
}
async function runOperation(opts, credential) {
  if (hash(capture(WRAPPER, JSON_MAX).bytes) !== WRAPPER_SHA256) fail('LAUNCHER_WRAPPER_BINDING_MISMATCH');
  const binding = prepareBinding(opts);
  const recovery = opts.recoveryOut ? createRecoverySink(opts.recoveryOut) : null;
  const chunks = []; let outputSize = 0, stdoutOverflow = false, safeError = '';
  let child, code;
  try {
    child = spawn(process.execPath, [WRAPPER, ...childArguments(opts)], {
      stdio: ['ignore', 'pipe', 'pipe', 'pipe', credential ? 'pipe' : 'ignore', recovery ? 'pipe' : 'ignore'],
      env: { PATH: path.dirname(process.execPath), LANG: 'C', LC_ALL: 'C' },
    });
    const deadline = setTimeout(() => { child.kill('SIGTERM'); setTimeout(() => child.kill('SIGKILL'), 1000).unref(); }, 61000);
    child.stdout.on('data', bytes => { outputSize += bytes.length; if (outputSize > OUTPUT_MAX) { stdoutOverflow = true; child.kill('SIGTERM'); } else chunks.push(Buffer.from(bytes)); });
    child.stderr.on('data', bytes => { const text = bytes.toString('ascii'); if (/^HOST_[A-Z_]+\n$/u.test(text)) safeError = text.trim(); });
    for (const i of [3, 4]) if (child.stdio[i]) child.stdio[i].on('error', () => {});
    if (recovery) child.stdio[5].on('data', recovery.accept);
    const closed = new Promise((resolve, reject) => {
      child.once('error', () => reject(Object.assign(new Error('LAUNCHER_CHILD_FAILED'), { launcherCode: 'LAUNCHER_CHILD_FAILED' })));
      child.once('close', (exitCode, signal) => resolve(signal ? -1 : exitCode));
    });
    child.stdio[3].end(Buffer.from(JSON.stringify(binding)));
    if (credential) child.stdio[4].end(credential, () => credential.fill(0));
    try { code = await closed; } finally { clearTimeout(deadline); }
    const bytes = Buffer.concat(chunks);
    const persisted = recovery ? recovery.finish() : true;
    if (stdoutOverflow || code !== 0) {
      recovery?.removeOwn();
      fail(safeError || 'LAUNCHER_OPERATION_FAILED');
    }
    let snapshot = null;
    if (opts.command === 'revise') {
      try { snapshot = verifyRevision(opts.out, binding, bytes, Boolean(recovery)); }
      catch {
        recovery?.removeOwn();
        fail('LAUNCHER_OUTPUT_UNVERIFIED_NOT_REMOVED');
      }
    }
    if (!persisted) {
      const removed = snapshot && rollbackRevision(opts.out, snapshot);
      const sinkRemoved = recovery.removeOwn();
      fail(removed && sinkRemoved ? 'LAUNCHER_RECOVERY_PERSISTENCE_FAILED_ROLLED_BACK' : 'LAUNCHER_RECOVERY_PERSISTENCE_FAILED_ROLLBACK_INCOMPLETE');
    }
    return bytes;
  } catch (e) {
    if (code === undefined) recovery?.removeOwn();
    throw e;
  } finally { credential?.fill(0); }
}
async function main(argv) {
  const opts = argumentsFor(argv);
  if (opts.help) {
    process.stdout.write('Trusted-operator Studio launcher (source only; Unix reference, verified on macOS)\nread|source|revise --installation ABSOLUTE_STUDIO_CLI --asset ABSOLUTE_ASSET\nread requires --allow-read; source/revise require --allow-source.\nread optionally accepts --judgment N --budget N.\nOptional --credential password|recovery prompts on the controlling TTY with hidden input and Backspace/Delete; an embedding can add --credential-fd N (preopened pipe).\nrevise requires --edit ABSOLUTE_JSON --reason ABSOLUTE_JSON --out NEW_ABSOLUTE_DIRECTORY.\nPassword revision requires --recovery-out NEW_ABSOLUTE_FILE; recovery-slot revision is not supported.\nRun outside the model-controlled shell; flags do not authenticate their caller.\n');
    return;
  }
  if (process.platform === 'win32') fail('LAUNCHER_PLATFORM_UNSUPPORTED');
  // Refuse stale/unsafe output targets before requesting any credential.
  prepareBinding(opts);
  let credential = null;
  try {
    if (opts.credential !== 'none') credential = trimCredential(opts.credentialFd === undefined ? await readTTYCredential(opts.credential) : await readCredentialPipe(opts.credentialFd));
    const bytes = await runOperation(opts, credential);
    await new Promise((resolve, reject) => process.stdout.write(bytes, e => e ? reject(e) : resolve()));
  } finally { credential?.fill(0); }
}
if (require.main === module) main(process.argv.slice(2)).catch(e => {
  process.stderr.write((e.launcherCode || 'LAUNCHER_OPERATION_FAILED') + '\n');
  process.exitCode = 2;
});
module.exports = { argumentsFor, prepareBinding, childArguments, readCredentialPipe, readTTYCredential, trimCredential, createRecoverySink, verifyRevision, rollbackRevision, runOperation };
