#!/usr/bin/env node
'use strict';
// Source-only trusted local Host for the frozen Studio container0.5 / Read0.6.4 graph.
// A separately trusted launcher owns binding construction and permissions. The
// descriptor is transport, not proof of authority against an arbitrary launcher.
// Binding and credentials arrive on separately owned, pre-opened descriptors.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const MAX = 25 * 1024 * 1024, JSON_MAX = 1024 * 1024, SECRET_MAX = 65536;
const CLI_FILES = Object.freeze({
  'package.json': {sha256:'edf97b772de8582961c0f385a695e55cad406c5a2caef12d5acbc3c2da4c3c51',mode:0o644},
  'bin/kdna-studio.js': {sha256:'ccce7e14e0a2ef6adf158cd1d66c6f774210dc18fe9069c582fec752abecbe18',mode:0o755},
  'src/terminal-workspace.js': {sha256:'8a78531a742f416238b8403d5ba6e9d819678a14fe90eda396d029f31ff4607c',mode:0o644},
  'src/component-operations.js': {sha256:'fc5e468d7b2f8a8ed760008429fa6283417007d359ac5fabd1719d0d8e49cbfb',mode:0o644},
  'src/public-bindings.json': {sha256:'b2fc98fb668e485f6b50e88442f7f40ed8e3aca4a5b9b8ef7147dc452e8ec6bf',mode:0o644},
});
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const digest = bytes => 'sha256:' + hash(bytes);
function fail(code) { throw Object.assign(new Error(code), { safeHostCode: code }); }
function closed(value, keys, required = keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k)) || required.some(k => !Object.hasOwn(value,k))) fail('HOST_INPUT_INVALID');
}
function capture(file, max = MAX) {
  const fd = fs.openSync(file,fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const stat = fs.fstatSync(fd); if (!stat.isFile() || stat.size > max) fail('HOST_FILE_INVALID');
    const bytes = Buffer.alloc(stat.size + 1); let size = 0;
    while (size < bytes.length) { const count=fs.readSync(fd,bytes,size,bytes.length-size,null); if (!count) break; size+=count; }
    if (size !== stat.size) fail('HOST_FILE_CHANGED');
    return bytes.subarray(0,size);
  } finally { fs.closeSync(fd); }
}
function decode(bytes) { try { return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes); } catch { fail('HOST_UTF8_INVALID'); } }
function json(bytes) { try { return JSON.parse(decode(bytes)); } catch { fail('HOST_JSON_INVALID'); } }
function pipe(fd) { const s=fs.fstatSync(fd); if (!s.isFIFO() && !s.isSocket()) fail('HOST_FD_NOT_PIPE'); }
function readPipe(fd,max) {
  pipe(fd); const b=Buffer.alloc(max+1); let size=0;
  try { while(size<b.length) { const n=fs.readSync(fd,b,size,b.length-size,null); if (!n) break; size+=n; } if (size>max) fail('HOST_FD_LIMIT'); return Buffer.from(b.subarray(0,size)); }
  finally { b.fill(0); fs.closeSync(fd); }
}
function secret(fd) {
  if (fd===undefined) return null;
  const raw=readPipe(fd,SECRET_MAX);
  try { const value=decode(raw).replace(/\r?\n$/u,''); if (!value) fail('HOST_CREDENTIAL_EMPTY'); return Buffer.from(value,'utf8'); }
  finally { raw.fill(0); }
}
function write(fd,bytes) { let at=0; while(at<bytes.length) { const n=fs.writeSync(fd,bytes,at,bytes.length-at); if(n<=0) fail('HOST_DELIVERY_FAILED'); at+=n; } return true; }
const emit = value => write(1,Buffer.from(JSON.stringify(value)+'\n'));
function argumentsFor(argv) {
  const command=argv[0]; if (!['read','source','revise'].includes(command)) fail('HOST_COMMAND_UNSUPPORTED');
  const result={command};
  for(let i=1;i<argv.length;i+=2) {
    const k=argv[i],v=argv[i+1];
    if (!['--host-fd','--password-fd','--recovery-fd','--slot','--asset','--out','--edit','--reason','--judgment','--budget'].includes(k) || Object.hasOwn(result,k) || !v || v.startsWith('--')) fail('HOST_OPTION_INVALID');
    result[k]=v;
  }
  if (!result['--host-fd'] || !result['--asset']) fail('HOST_BINDING_REQUIRED');
  const fds=[];
  for(const k of ['--host-fd','--password-fd','--recovery-fd']) if (Object.hasOwn(result,k)) {
    if (!/^[3-9]\d*$|^[1-9]\d+$/u.test(result[k]) || !Number.isSafeInteger(Number(result[k]))) fail('HOST_FD_INVALID');
    result[k]=Number(result[k]); if(fds.includes(result[k])) fail('HOST_FD_COLLISION'); fds.push(result[k]);
  }
  if(result['--slot']!==undefined && !['0','1'].includes(result['--slot'])) fail('HOST_SLOT_INVALID');
  if(command==='revise' && (!result['--out'] || !result['--edit'] || !result['--reason'])) fail('HOST_REVISION_INPUT_REQUIRED');
  if(command!=='revise' && ['--out','--edit','--reason','--recovery-fd'].some(k=>Object.hasOwn(result,k))) fail('HOST_OPTION_INVALID');
  if(command!=='read' && ['--judgment','--budget'].some(k=>Object.hasOwn(result,k))) fail('HOST_OPTION_INVALID');
  if(result['--judgment'] && (!/^[1-9]\d*$/u.test(result['--judgment']) || !Number.isSafeInteger(Number(result['--judgment'])))) fail('HOST_SELECTION_INVALID');
  return result;
}
function loadRuntime(root) {
  if(!path.isAbsolute(root) || fs.realpathSync(root)!==root || !fs.lstatSync(root).isDirectory()) fail('HOST_INSTALLATION_INVALID');
  for(const [file,expected] of Object.entries(CLI_FILES)) {
    const target=path.join(root,file);
    if((fs.lstatSync(target).mode&0o777)!==expected.mode || hash(capture(target,JSON_MAX))!==expected.sha256) fail('HOST_CLI_BINDING_MISMATCH');
  }
  const req=createRequire(path.join(root,'package.json')), binding=json(capture(path.join(root,'src/public-bindings.json'))), roots=new Map();
  for(const archive of binding.archives) {
    const entry=req.resolve(archive.name), suffix=path.sep+archive.publicEntry.split('/').join(path.sep);
    if(!entry.endsWith(suffix)) fail('HOST_PACKAGE_PATH_MISMATCH');
    const directory=entry.slice(0,-suffix.length), expected=new Map(archive.files.map(f=>[f.path,f])); let count=0;
    if(fs.realpathSync(directory)!==directory || !fs.lstatSync(directory).isDirectory()) fail('HOST_PACKAGE_PATH_MISMATCH');
    function walk(current,prefix='') {
      for(const name of fs.readdirSync(current)) {
        const rel=prefix?prefix+'/'+name:name, file=path.join(current,name), stat=fs.lstatSync(file);
        if(stat.isDirectory() && !stat.isSymbolicLink()) walk(file,rel);
        else { const item=expected.get(rel); if(!stat.isFile() || stat.isSymbolicLink() || !item || (stat.mode&0o777)!==item.mode || stat.size!==item.bytes || hash(capture(file,item.bytes))!==item.sha256) fail('HOST_PACKAGE_MEMBER_MISMATCH'); count++; }
      }
    }
    walk(directory); if(count!==expected.size) fail('HOST_PACKAGE_MEMBER_MISMATCH');
    const meta=json(capture(path.join(directory,'package.json'))); if(meta.name!==archive.name || meta.version!==archive.version) fail('HOST_PACKAGE_VERSION_MISMATCH');
    roots.set(archive.name,{entry,req:createRequire(path.join(directory,'package.json'))});
  }
  for(const a of binding.archives) for(const name of new Set([...Object.keys(a.dependencies),...Object.keys(a.peerDependencies)])) {
    if(!roots.has(name) || roots.get(a.name).req.resolve(name)!==roots.get(name).entry) fail('HOST_PACKAGE_GRAPH_MISMATCH');
  }
  for(const a of binding.archives) for(const name of Object.keys(a.optionalDependencies)) {
    if(roots.has(name)) continue; let found=false;
    try { roots.get(a.name).req.resolve(name); found=true; } catch(e) { if(e.code!=='MODULE_NOT_FOUND') throw e; }
    if(found) fail('HOST_OPTIONAL_PACKAGE_UNBOUND');
  }
  return Object.freeze({binding,protection:req('@aikdna/kdna-core/protection-node'),read:req('@aikdna/kdna-read/protection-node'),embedding:req('@aikdna/kdna-read/embedding'),source:req('@aikdna/kdna-core/protected-source-node'),authoring:req('@aikdna/kdna-core/authoring-node')});
}
function readBinding(opts) {
  const bytes=readPipe(opts['--host-fd'],65536); let b;
  try { b=json(bytes); } finally { bytes.fill(0); }
  closed(b,['installation_root','asset','expected_A','purpose','binding_id','expires_at_ms','allow_read','allow_source','output','edit_sha256','reason_sha256'],['installation_root','asset','expected_A','purpose','binding_id','expires_at_ms','allow_read','allow_source']);
  if(b.purpose!==opts.command || typeof b.binding_id!=='string' || !/^[A-Za-z0-9:_-]{1,128}$/u.test(b.binding_id) || !/^sha256:[0-9a-f]{64}$/u.test(b.expected_A) || typeof b.allow_read!=='boolean' || typeof b.allow_source!=='boolean') fail('HOST_SCOPE_INVALID');
  if(!Number.isSafeInteger(b.expires_at_ms) || b.expires_at_ms<=Date.now() || b.expires_at_ms>Date.now()+60000) fail('HOST_SCOPE_EXPIRED');
  if(!path.isAbsolute(b.asset) || fs.realpathSync(opts['--asset'])!==b.asset || fs.realpathSync(b.asset)!==b.asset) fail('HOST_ASSET_SCOPE_MISMATCH');
  if(opts.command==='revise' && (path.resolve(opts['--out'])!==b.output || typeof b.edit_sha256!=='string' || typeof b.reason_sha256!=='string')) fail('HOST_REVISION_SCOPE_MISMATCH');
  if(opts.command==='revise' && fs.existsSync(b.output)) fail('HOST_DESTINATION_EXISTS');
  return Object.freeze(b);
}
function policyObservation(b,A) {
  const now=Date.now();
  return {context_id:b.binding_id,epoch:b.binding_id,asset_digest:A,permission:b.allow_source && now<b.expires_at_ms?'allowed':'denied',scope:'complete_source',current_ms:now,expires_at_ms:b.expires_at_ms,revoked:now>=b.expires_at_ms};
}
function admission(password,slot) { return {credential:password?{kind:'password',password,slotIndex:Number(slot||0)}:{kind:'none'},signaturePolicy:{requireSignature:false,expectedPublicKeyHex:null}}; }
function publicFailure(result) { const code=result?.diagnostic?.code || result?.admission?.diagnostic?.code || 'HOST_OPERATION_REJECTED'; return {status:'rejected',code,body:null,body_bytes:0}; }
async function readAsset(rt,bytes,password,opts,b) {
  const a=await rt.protection.admitProtectedNode(bytes,admission(password,opts['--slot']),{kind:'local',clock:Date.now});
  if(a.status!=='accepted') { emit(publicFailure(a)); return false; }
  let delivered=false;
  try {
    const request={request_id:'read:'+crypto.randomUUID(),tuple:rt.binding.tuple,mode:opts['--judgment']?'exact_selection':'whole_asset',selection:null,handle:null,budget_bytes:opts['--budget']===undefined?1048576:Number(opts['--budget'])};
    if(opts['--judgment']) { const item=a.snapshot.ir.catalog[Number(opts['--judgment'])-1]; if(!item) fail('HOST_SELECTION_INVALID'); request.selection={asset_id:a.snapshot.asset.asset_id,asset_version:a.snapshot.asset.asset_version,judgment_id:item.judgment_id}; }
    const observe=({request:current,snapshot})=>{const now=Date.now(); return {host_id:'host:studio-local-protected',host_epoch:b.binding_id,decision_id:'decision:'+crypto.randomUUID(),request_id:current.request_id,snapshot_id:snapshot.snapshot_id,A:snapshot.digests.A.observed,C:snapshot.digests.C.observed,scope:snapshot.ir.nodes.map(n=>n.id),issued_at:now,expires_at:b.expires_at_ms,current_ms:now,decision:b.allow_read&&now<b.expires_at_ms?'allow':'deny',policy_id:'policy:host-bound-local-read'};};
    const host=rt.read.createTrustedProtectedHostReadProvider({observe,async deliver(result,prepared) {
      const committed=await rt.read.commitProtectedTransport(a.operation,prepared,{observeScope:observe,commit(value) { const ok=emit(value); delivered=ok; return ok; }});
      return committed.status==='committed';
    }});
    const result=await rt.read.readProtectedNode(a.operation,request,rt.embedding.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:65536})),host);
    const success=result.status==='read_result' && result.result.channel==='read_envelope' && result.result.envelope.status==='ready';
    if(!delivered) emit(publicFailure(result));
    return success;
  } finally { rt.protection.disposeProtectionOperation(a.operation); }
}
function revisionInputs(opts,b) {
  const e=capture(opts['--edit'],JSON_MAX), r=capture(opts['--reason'],JSON_MAX);
  if(hash(e)!==b.edit_sha256 || hash(r)!==b.reason_sha256) fail('HOST_REVISION_SCOPE_MISMATCH');
  const edits=json(e),reason=json(r); closed(edits,['manifest','payload']); closed(reason,['source_A','reason']);
  if(reason.source_A!==b.expected_A || typeof reason.reason!=='string' || !reason.reason.trim()) fail('HOST_REVISION_REASON_REQUIRED');
  return {edits,reason};
}
function assertRevision(source,edits) {
  if(edits.manifest.asset_id!==source.manifest.asset_id || edits.manifest.asset_uid!==source.manifest.asset_uid || edits.manifest.version===source.manifest.version || edits.payload.asset?.asset_version===source.payload.asset?.asset_version) fail('HOST_REVISION_IDENTITY_INVALID');
}
function save(opts,b,bytes,receipt,deliverRecovery=null) {
  if(Date.now()>=b.expires_at_ms || !b.allow_source) fail('HOST_SCOPE_EXPIRED');
  const target=path.resolve(opts['--out']),parent=fs.realpathSync(path.dirname(target)); if(path.join(parent,path.basename(target))!==target) fail('HOST_OUTPUT_PATH_INVALID');
  fs.mkdirSync(target,{mode:0o700}); const made=[];
  try {
    for(const [name,value] of [['asset.kdna',bytes],['revision-receipt.json',Buffer.from(JSON.stringify(receipt)+'\n')]]) {
      const f=path.join(target,name),fd=fs.openSync(f,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o400); made.push(f);
      try { write(fd,value); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    }
    if(!capture(path.join(target,'asset.kdna')).equals(Buffer.from(bytes))) fail('HOST_SAVED_BYTES_MISMATCH');
    if(deliverRecovery && deliverRecovery()!==true) fail('HOST_DELIVERY_FAILED');
    fs.chmodSync(target,0o500); return true;
  } catch(e) {
    let cleaned=true;
    for(const f of made.reverse()) { try { fs.unlinkSync(f); } catch(error) { if(error.code!=='ENOENT') cleaned=false; } }
    try { fs.rmdirSync(target); } catch(error) { if(error.code!=='ENOENT') cleaned=false; }
    if(!cleaned) fail('HOST_ROLLBACK_INCOMPLETE'); throw e;
  }
}
async function sourceAsset(rt,bytes,password,opts,b) {
  if(!b.allow_source) fail('HOST_SOURCE_PERMISSION_REQUIRED');
  let saved=null, delivered=false;
  const inputs=opts.command==='revise'?revisionInputs(opts,b):null;
  const ordinary=rt.authoring.openSourceBytes(bytes);
  if(ordinary.status==='accepted') {
    if(Date.now()>=b.expires_at_ms) fail('HOST_SCOPE_EXPIRED');
    if(opts.command==='source') return emit({source_A:b.expected_A,manifest:ordinary.source.manifest,payload:ordinary.source.payload,inventory:ordinary.source.inventory});
    assertRevision(ordinary.source,inputs.edits);
    const packed=rt.authoring.packSourceBytes(bytes,inputs.edits); if(packed.status!=='accepted') { emit(publicFailure(packed)); return false; }
    if(Date.now()>=b.expires_at_ms) fail('HOST_SCOPE_EXPIRED');
    const receipt={kind:'local-source-revision',source_A:b.expected_A,output_A:digest(packed.bytes),reason:inputs.reason.reason,creation_accepted:'not_evaluated',identity:'not_verified',action_authorization:'not_evaluated',protection:'none'};
    save(opts,b,packed.bytes,receipt); emit({status:'revision_saved',...receipt}); return true;
  }
  const observe=()=>policyObservation(b,b.expected_A);
  const host=rt.source.createTrustedProtectedSourceHost({observe,async deliver(bundle,prepared,context) {
    let output=null,recovery=null;
    try {
      if(opts.command==='revise') {
        assertRevision(bundle,inputs.edits);
        if(!password || opts['--recovery-fd']===undefined) fail('HOST_REVISION_CREDENTIAL_CHANNEL_REQUIRED');
        pipe(opts['--recovery-fd']);
        recovery=Buffer.from('kdna-recover-'+crypto.randomBytes(32).toString('hex').toUpperCase().match(/.{4}/gu).join('-'));
        const policy={kind:'password',asset_uid:bundle.manifest.asset_uid,entitlement:{profile:'password',offline:true,revocable:false},slots:[{slot:'password',kdf_profile:'argon2id'},{slot:'recovery',kdf_profile:'scrypt-sha256'}],checksums:true,signature:'none'};
        output=await rt.source.produceProtectedSourceRevision(context,inputs.edits,policy,()=>({passwords:[{slot:'password',password},{slot:'recovery',password:recovery}]}));
        if(output.status!=='revision_produced') { emit(publicFailure(output)); return false; }
        const check=await rt.protection.admitProtectedNode(output.bytes,admission(password,0),{kind:'local',clock:Date.now});
        try { if(check.status!=='accepted') { emit(publicFailure(check)); return false; } } finally { if(check.operation) rt.protection.disposeProtectionOperation(check.operation); }
      }
      const committed=await rt.source.commitProtectedSourceTransport(prepared,{observeScope:observe,commit(current) {
        if(opts.command==='source') { delivered=emit({source_A:b.expected_A,manifest:current.manifest,payload:current.payload,inventory:current.original_inventory}); return delivered; }
        const receipt={kind:'local-source-revision',source_A:b.expected_A,output_A:digest(output.bytes),reason:inputs.reason.reason,evidence:output.evidence,creation_accepted:'not_evaluated',identity:'not_verified',action_authorization:'not_evaluated',protection:'password'};
        const ok=save(opts,b,output.bytes,receipt,()=>write(opts['--recovery-fd'],recovery)); if(ok) saved=receipt; return ok;
      }});
      return committed.status==='source_committed';
    } finally { recovery?.fill(0); output?.bytes?.fill(0); }
  }});
  const result=await rt.source.withProtectedSourceNode(bytes,{admission:admission(password,opts['--slot']),expected_A:b.expected_A,timeout_ms:Math.min(60000,Math.max(1,b.expires_at_ms-Date.now()))},{kind:'local',clock:Date.now},host);
  if(result.status==='source_delivered') { if(saved) emit({status:'revision_saved',...saved}); return true; }
  if(!delivered) emit(publicFailure(result)); return false;
}
async function main(argv) {
  const opts=argumentsFor(argv),b=readBinding(opts),rt=loadRuntime(b.installation_root),bytes=capture(opts['--asset']);
  if(digest(bytes)!==b.expected_A) fail('HOST_ASSET_SCOPE_MISMATCH');
  let password=null;
  try {
    password=secret(opts['--password-fd']);
    const ok=opts.command==='read'?await readAsset(rt,bytes,password,opts,b):await sourceAsset(rt,bytes,password,opts,b);
    if(!ok) process.exitCode=3;
  } finally { password?.fill(0); if(opts['--recovery-fd']!==undefined) { try { fs.closeSync(opts['--recovery-fd']); } catch {} } }
}
if(require.main===module) main(process.argv.slice(2)).catch(e=>{process.stderr.write((e.safeHostCode||'HOST_OPERATION_FAILED')+'\n');process.exitCode=2;});
module.exports={main};
