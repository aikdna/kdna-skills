'use strict';
// Source-only integration: an explicitly selected, byte-bound Studio installation.
// Synthetic editorial input proves mechanics, never real Agent/human acceptance.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const wrapper=path.join(__dirname,'studio-protected-host.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const digest=b=>'sha256:'+hash(b);
const installation=process.env.STUDIO_PROTECTED_TEST_INSTALLATION;
const artifacts=process.env.STUDIO_PROTECTED_TEST_ARTIFACTS;
function spawnProcess(file,args,stdio,nodeOptions=[]) {
  const p=spawn(process.execPath,[...nodeOptions,file,...args],{stdio});
  const record={pid:p.pid,start:new Date().toISOString()};
  let out='',err='',safeCLIError='';
  p.stdout.on('data',b=>{out+=b.toString('utf8');});
  p.stderr.on('data',b=>{if(file===wrapper) err+=b.toString('utf8');else {try{const e=JSON.parse(b.toString('utf8'));if(e.status==='rejected'&&/^[A-Z][A-Z0-9_]+$/u.test(e.code))safeCLIError=e.code;}catch{}}b.fill(0);});
  for(const s of p.stdio) if(s?.writable) s.on('error',()=>{});
  const completion=new Promise((resolve,reject)=>{
    p.once('error',reject);
    const timer=setTimeout(()=>p.kill('SIGTERM'),60000);
    p.once('close',(code,signal)=>{clearTimeout(timer);resolve({...record,end:new Date().toISOString(),code,signal,out,err,safeCLIError});});
  });
  return {p,completion};
}
async function createFixture(root,protectedAsset,password) {
  const dir=path.join(root,protectedAsset?'protected-original':'public-original');fs.mkdirSync(dir);
  const material=path.join(dir,'material.txt'),delegation=path.join(dir,'delegation.json'),bundle=path.join(dir,'bundle');
  fs.writeFileSync(material,'An absent observation remains unknown. A negative observation requires evidence.');
  fs.writeFileSync(delegation,JSON.stringify({coordinate:'fixture:protected-host-mechanics',statement:'Synthetic editorial input for local Host mechanics only.'}));
  const args=['session','--out',bundle,'--text',material,'--synthetic-fixture','--agent-adoption-fd','3','--delegation-record',delegation];
  if(protectedAsset) args.push('--password-fd','4');
  const {p,completion}=spawnProcess(path.join(installation,'bin/kdna-studio.js'),args,['pipe','pipe','pipe','pipe','pipe']);
  if(protectedAsset) p.stdio[4].end(password); else p.stdio[4].end();
  const send=(id,op,data)=>p.stdin.write(JSON.stringify({id,op,data})+'\n');
  const taxonomy=(localKey,role,statement,items)=>({localKey,type:'taxonomy',method:{term:'recognition'},role,statement,content:{items,broader:[]}});
  const alternative={localKey:'preserve',title:'Retain uncertainty',subject:'An observation',scope:'Missing observations only',statement:'Retain unknown when an observation is absent.',rationale:'Absence is not a negative observation.',materials:[1],method:{method:{term:'recognition'},components:[
    taxonomy('feature','识别特征','Check whether a recorded observation exists.',[{key:'record',title:'Recorded observation',meaning:'A traceable observation is available.'}]),
    taxonomy('classes','类别定义','Distinguish absent observations from recorded negative observations.',[{key:'absent',title:'Absent',meaning:'No observation has been recorded.'},{key:'negative',title:'Observed negative',meaning:'An observation records a negative result.'}]),
    taxonomy('mapping','匹配办法','Classify absent records as unknown; classify recorded negatives only from their evidence.',[{key:'unknown',title:'Unknown',meaning:'Missing evidence remains unknown.'},{key:'evidenced',title:'Evidence classified',meaning:'A recorded observation supports its own classification.'}]),
  ]}};
  let partial='';
  p.stdout.on('data',b=>{
    partial+=b.toString('utf8');let at;
    while((at=partial.indexOf('\n'))>=0) {
      const raw=partial.slice(0,at);partial=partial.slice(at+1);let e;try{e=JSON.parse(raw);}catch{continue;}
      if(e.event==='ready')send('brief','brief',{title:'Ordinary observation judgment',scope:'Synthetic local protection mechanics.',highest_question:'How should an absent observation be represented?'});
      else if(e.id==='brief')send('proposal','propose',{localKey:'signal',alternatives:[alternative,{...alternative,localKey:'infer',statement:'Treat an absent observation as negative.'}]});
      else if(e.id==='proposal'){send('select-review','review',{});p.stdio[3].write('Select preserve because missing evidence cannot establish a negative.\n');}
      else if(e.event==='adoption_reply')send('interpret-'+e.replyTo,'interpret',{replyTo:e.replyTo,kind:e.review.preview?'confirm':'select',...(e.review.preview?{}:{choices:[{judgmentLocalKey:'signal',alternativeLocalKey:'preserve'}]})});
      else if(e.id==='select-review')send('preview','preview',{});
      else if(e.id==='preview'){send('confirm-review','review',{});p.stdio[3].write('Confirm this current preview for the synthetic mechanics check.\n');}
      else if(e.id==='confirm-review')send('export','export',{});
    }
  });
  const r=await completion;assert.equal(r.code,0,'Studio fixture creation must succeed: '+r.safeCLIError);
  const asset=path.join(bundle,'asset.kdna');assert.ok(fs.statSync(asset).isFile());
  return {asset,original:fs.readFileSync(asset),creation:{pid:r.pid,code:r.code,start:r.start,end:r.end}};
}
async function invoke(command,asset,{password,slot,selection,allowRead=true,allowSource=false,edit,reason,out,bindingPatch={},recovery=false,rejectRecovery=false,captureRecovery=false,preload,arguments:extra=[]}={}) {
  const bytes=fs.readFileSync(asset),binding={installation_root:installation,asset:fs.realpathSync(asset),expected_A:digest(bytes),purpose:command,binding_id:'test:'+crypto.randomUUID(),expires_at_ms:Date.now()+59000,allow_read:allowRead,allow_source:allowSource,...(out?{output:out,edit_sha256:hash(fs.readFileSync(edit)),reason_sha256:hash(fs.readFileSync(reason))}:{}),...bindingPatch};
  const args=[command,'--asset',asset,'--host-fd','3'];
  if(password!==undefined)args.push('--password-fd','4');
  if(slot!==undefined)args.push('--slot',String(slot));
  if(selection!==undefined)args.push('--judgment',String(selection));
  if(edit)args.push('--edit',edit,'--reason',reason,'--out',out);
  if(recovery)args.push('--recovery-fd','5');
  args.push(...extra);
  const {p,completion}=spawnProcess(wrapper,args,['ignore','pipe','pipe','pipe','pipe','pipe'],preload?['--require',preload]:[]);
  const recoveryChunks=[];
  p.stdio[3].end(JSON.stringify(binding));p.stdio[4].end(password);
  p.stdio[5].on('data',b=>{if(captureRecovery)recoveryChunks.push(Buffer.from(b));b.fill(0);});
  // fd5 is a real recovery sink; only success/failure is retained.
  let recoveryDelivered=false;p.stdio[5].on('data',()=>{recoveryDelivered=true;});
  if(rejectRecovery)p.stdio[5].destroy();
  const r=await completion;let values=[];
  if(r.out.trim())values=r.out.trim().split('\n').map(s=>JSON.parse(s));
  const recoveryBytes=captureRecovery?Buffer.concat(recoveryChunks):null;for(const b of recoveryChunks)b.fill(0);
  return {...r,values,recoveryDelivered,recoveryBytes};
}
function noContent(r) {
  assert.notEqual(r.code,0);
  for(const value of r.values) { assert.equal(value.body,null);assert.equal(value.body_bytes,0);assert.equal(value.status,'rejected'); }
  assert.equal(r.out.includes('Retain unknown'),false);
  assert.equal(r.out.includes('manifest'),false);
  assert.match(r.err,/^(?:HOST_[A-Z_]+\n)?$/u);
}
function ready(r) {
  assert.equal(r.code,0,r.err);assert.equal(r.values.length,1);
  const value=r.values[0];
  assert.equal(value.channel,'read_envelope');assert.equal(value.envelope.status,'ready');
  assert.notEqual(value.creation_accepted,'accepted');
  return value.envelope;
}
function publicRecord(r) {return {pid:r.pid,start:r.start,end:r.end,exit:r.code,signal:r.signal,recovery_delivered:r.recoveryDelivered||false,outputs:r.values.map(v=>({status:v.status||v.envelope?.status,channel:v.channel,code:v.code,source_A:v.source_A,output_A:v.output_A}))};}

test('same-contract public and protected conclusion with explicit method: close/reopen/read/revise',async t=>{
  assert.ok(installation&&artifacts,'Set STUDIO_PROTECTED_TEST_INSTALLATION and STUDIO_PROTECTED_TEST_ARTIFACTS explicitly.');
  assert.equal(fs.realpathSync(installation),installation);assert.equal(fs.realpathSync(artifacts),artifacts);
  const root=path.join(artifacts,'protected-host-'+process.pid);fs.mkdirSync(root,{mode:0o700});
  const password=Buffer.from(crypto.randomBytes(32).toString('base64url'));
  const wrong=Buffer.from(crypto.randomBytes(32).toString('base64url'));
  const evidence={contract:'container0.5/Read0.6.4',kind:'synthetic-local-host-mechanics',real_agent_adoption:'not_evaluated',cases:[]};
  try {
    for(const protectedAsset of [false,true]) {
      const label=protectedAsset?'protected':'public',fixture=await createFixture(root,protectedAsset,password),credential=protectedAsset?password:undefined;
      evidence.cases.push({case:label+':create-save-close',asset_A:digest(fixture.original),...fixture.creation});
      await t.test(label+' true process reopen and whole/question/selection Read',async()=>{
        const whole=await invoke('read',fixture.asset,{password:credential});const envelope=ready(whole);
        assert.ok(JSON.stringify(envelope.content.declarations).includes('How should an absent observation be represented?'),'actual Read includes the authored highest question');
        const selected=await invoke('read',fixture.asset,{password:credential,selection:1});const selectedEnvelope=ready(selected);
        assert.ok(selectedEnvelope.content.closure.some(n=>n.role==='judgment'));
        assert.equal(selectedEnvelope.content.closure.filter(n=>n.role==='method_component').length,3,'explicit recognition method preserves its three authored roles');
        assert.notEqual(whole.pid,fixture.creation.pid);assert.notEqual(selected.pid,whole.pid);
        evidence.cases.push({case:label+':reopen-whole-read',...publicRecord(whole)},{case:label+':reopen-selection-read',...publicRecord(selected)});
      });
      await t.test(label+' explicit read/source permissions and scope fail closed',async()=>{
        for(const options of [{allowRead:false},{bindingPatch:{purpose:'source'}},{bindingPatch:{expected_A:'sha256:'+'0'.repeat(64)}},{bindingPatch:{expires_at_ms:Date.now()-1}}]) {
          const r=await invoke('read',fixture.asset,{password:credential,...options});noContent(r);evidence.cases.push({case:label+':scope-denial',...publicRecord(r)});
        }
        const sourceDenied=await invoke('source',fixture.asset,{password:credential,allowSource:false});noContent(sourceDenied);evidence.cases.push({case:label+':source-denied',...publicRecord(sourceDenied)});
      });
      if(protectedAsset)await t.test('missing/wrong credential rejects without source or Read body',async()=>{
        for(const command of ['read','source'])for(const supplied of [undefined,wrong]) {
          const r=await invoke(command,fixture.asset,{password:supplied,allowSource:true});noContent(r);evidence.cases.push({case:'protected:'+command+':credential-rejection',...publicRecord(r)});
        }
      });
      await t.test(label+' reasoned new version preserves original and reopens',async()=>{
        const opened=await invoke('source',fixture.asset,{password:credential,allowSource:true});assert.equal(opened.code,0,opened.err);assert.equal(opened.values.length,1);
        const source=opened.values[0],edits={manifest:structuredClone(source.manifest),payload:structuredClone(source.payload)};
        assert.equal(source.source_A,digest(fixture.original));
        const changed='Retain unknown when evidence is absent; revise only after a recorded observation.';
        const rationale='The original preserved uncertainty. This revision adds the evidence condition for changing it.';
        const parts=source.manifest.version.split('.');assert.equal(parts.length,3);const version=parts.slice(0,2).join('.')+'.'+(Number(parts[2])+1);
        edits.manifest.version=version;if(Object.hasOwn(edits.manifest,'judgment_version'))edits.manifest.judgment_version=version;
        edits.manifest.updated_at=new Date().toISOString();edits.payload.asset.asset_version=version;edits.payload.asset.judgment_version=version;
        const judgment=edits.payload.judgments[0];judgment.core_expression.statement=changed;judgment.result.value.value=changed;
        edits.manifest.history={coverage:'partial',statement:'This local revision records its own rationale; the predecessor remains in the original file.',entries:[...source.manifest.history.entries,{id:'revision:'+crypto.randomUUID(),version,judgment_version:version,at:edits.manifest.updated_at,summary:rationale,affected_refs:[{kind:'judgment',id:judgment.id}],actor_refs:[]}]};
        const edit=path.join(root,label+'-edit.json'),reason=path.join(root,label+'-reason.json'),out=path.join(root,label+'-revision');
        fs.writeFileSync(edit,JSON.stringify(edits),{mode:0o600});fs.writeFileSync(reason,JSON.stringify({source_A:source.source_A,reason:rationale}),{mode:0o600});
        const revised=await invoke('revise',fixture.asset,{password:credential,allowSource:true,edit,reason,out,recovery:protectedAsset,captureRecovery:protectedAsset});
        assert.equal(revised.code,0,revised.err);assert.equal(revised.values[0].status,'revision_saved');assert.equal(revised.recoveryDelivered,protectedAsset);
        assert.deepEqual(fs.readFileSync(fixture.asset),fixture.original,'original bytes remain exact');
        const successor=path.join(out,'asset.kdna');assert.equal(digest(fs.readFileSync(successor)),revised.values[0].output_A);assert.notEqual(revised.values[0].output_A,source.source_A);
        const reopened=await invoke('read',successor,{password:credential,selection:1});const envelope=ready(reopened);
        assert.ok(JSON.stringify(envelope.content).includes(changed),'actual saved successor Read contains revision');
        assert.notEqual(reopened.pid,revised.pid);
        for(const failedMember of ['asset.kdna','revision-receipt.json']) {
          const partialOut=path.join(root,label+'-partial-'+failedMember),marker=path.join(root,label+'-partial-'+failedMember+'.observed'),preload=path.join(root,label+'-partial-'+failedMember+'.cjs');
          // Test-owned preload performs a real prefix write to the exclusive
          // destination FD, then throws ENOSPC. No production test hook exists.
          fs.writeFileSync(preload,`'use strict';const fs=require('node:fs');const open=fs.openSync,write=fs.writeSync;let targetFD=null;fs.openSync=function(file,...args){const fd=open.call(fs,file,...args);if(file===${JSON.stringify(path.join(partialOut,failedMember))})targetFD=fd;return fd;};fs.writeSync=function(fd,buffer,offset,length,position){if(fd===targetFD){targetFD=null;write.call(fs,fd,buffer,offset,Math.min(length,17),position);fs.writeFileSync(${JSON.stringify(marker)},'actual partial write observed',{flag:'wx'});throw Object.assign(new Error('controlled partial write failure'),{code:'ENOSPC'});}return write.call(fs,fd,buffer,offset,length,position);};`,{mode:0o600});
          const partial=await invoke('revise',fixture.asset,{password:credential,allowSource:true,edit,reason,out:partialOut,recovery:protectedAsset,preload});noContent(partial);
          assert.equal(fs.existsSync(marker),true,'the injected failure follows an actual partial filesystem write');
          assert.equal(fs.existsSync(partialOut),false,'partial asset/receipt write leaves no successor directory');
          assert.equal(partial.values.some(v=>v.status==='revision_saved'),false);assert.deepEqual(fs.readFileSync(fixture.asset),fixture.original);
          evidence.cases.push({case:label+':partial-write-rollback',failed_member:failedMember,actual_partial_write:true,output_directory_absent:true,original_A_unchanged:true,...publicRecord(partial)});
        }
        if(protectedAsset) {
          try {
            const recovered=await invoke('read',successor,{password:revised.recoveryBytes,slot:1,selection:1});ready(recovered);
            evidence.cases.push({case:'protected:revision-recovery-slot-reopen',...publicRecord(recovered)});
          } finally { revised.recoveryBytes.fill(0); }
          for(const supplied of [undefined,wrong]) {
            const deniedOut=path.join(root,'protected-denied-revision-'+crypto.randomUUID());
            const denied=await invoke('revise',fixture.asset,{password:supplied,allowSource:true,edit,reason,out:deniedOut,recovery:true});noContent(denied);assert.equal(fs.existsSync(deniedOut),false);
            evidence.cases.push({case:'protected:revision-credential-rejection',...publicRecord(denied)});
          }
          const sinkOut=path.join(root,'protected-failed-recovery-sink');
          const sinkFailure=await invoke('revise',fixture.asset,{password:credential,allowSource:true,edit,reason,out:sinkOut,recovery:true,rejectRecovery:true});noContent(sinkFailure);
          assert.equal(fs.existsSync(sinkOut),false,'a failed recovery sink rolls the uncommitted output back');
          evidence.cases.push({case:'protected:failed-recovery-sink-rollback',...publicRecord(sinkFailure)});
        }
        const second=await invoke('revise',fixture.asset,{password:credential,allowSource:true,edit,reason,out,recovery:protectedAsset});noContent(second);assert.match(second.err,/HOST_DESTINATION_EXISTS/);
        // Reusing the old asset-scoped authorization for the successor must fail.
        const reuse=await invoke('read',successor,{password:credential,bindingPatch:{asset:fixture.asset,expected_A:source.source_A}});noContent(reuse);
        const changedEdit=await invoke('revise',fixture.asset,{password:credential,allowSource:true,edit,reason,out:path.join(root,label+'-wrong-edit'),recovery:protectedAsset,bindingPatch:{edit_sha256:'0'.repeat(64)}});noContent(changedEdit);
        assert.equal(fs.existsSync(path.join(root,label+'-wrong-edit')),false);
        assert.deepEqual(fs.readFileSync(fixture.asset),fixture.original);
        evidence.cases.push({case:label+':source',...publicRecord(opened)},{case:label+':reasoned-revision-save-close',...publicRecord(revised)},{case:label+':revision-reopen-read',...publicRecord(reopened)},{case:label+':existing-destination-refused',...publicRecord(second)},{case:label+':old-scope-reuse-refused',...publicRecord(reuse)},{case:label+':changed-edit-refused',...publicRecord(changedEdit)});
      });
    }
    await t.test('consumer cannot select another installation or changed public binding',async()=>{
      const asset=path.join(root,'public-original','bundle','asset.kdna');
      const option=await invoke('read',asset,{arguments:['--installation-root',installation]});noContent(option);assert.match(option.err,/HOST_OPTION_INVALID/);
      const changed=path.join(root,'changed-installation');fs.mkdirSync(changed);
      for(const relative of ['package.json','bin/kdna-studio.js','src/terminal-workspace.js','src/component-operations.js','src/public-bindings.json']) {
        const target=path.join(changed,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(installation,relative),target);
      }
      fs.appendFileSync(path.join(changed,'src/public-bindings.json'),'\n');
      const mismatch=await invoke('read',asset,{bindingPatch:{installation_root:changed}});noContent(mismatch);assert.match(mismatch.err,/HOST_CLI_BINDING_MISMATCH/);
      evidence.cases.push({case:'consumer-installation-option-refused',...publicRecord(option)},{case:'changed-public-binding-refused',...publicRecord(mismatch)});
    });
    await t.test('a permission-only change of a bound installed member is rejected',async()=>{
      const asset=path.join(root,'public-original','bundle','asset.kdna'),copy=path.join(root,'mode-installation');fs.mkdirSync(copy);
      for(const relative of ['package.json','bin/kdna-studio.js','src/terminal-workspace.js','src/component-operations.js','src/public-bindings.json']) {
        const target=path.join(copy,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(installation,relative),target);
      }
      const bindings=JSON.parse(fs.readFileSync(path.join(installation,'src/public-bindings.json'),'utf8'));
      for(const archive of bindings.archives) {
        const target=path.join(copy,'node_modules',archive.name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.cpSync(path.join(installation,'node_modules',archive.name),target,{recursive:true,errorOnExist:true,force:false});
      }
      const baseline=await invoke('read',asset,{bindingPatch:{installation_root:copy}});ready(baseline);
      const core=bindings.archives.find(a=>a.name==='@aikdna/kdna-core'),member=core.files.find(f=>f.path===core.publicEntry),target=path.join(copy,'node_modules',core.name,member.path),before=fs.readFileSync(target);
      assert.equal(fs.statSync(target).mode&0o777,member.mode);fs.chmodSync(target,member.mode^0o100);
      assert.equal(hash(fs.readFileSync(target)),hash(before));assert.equal(fs.statSync(target).size,before.length);
      const mismatch=await invoke('read',asset,{bindingPatch:{installation_root:copy}});noContent(mismatch);assert.match(mismatch.err,/HOST_PACKAGE_MEMBER_MISMATCH/);
      evidence.cases.push({case:'bound-installation-copy-baseline',...publicRecord(baseline)},{case:'bound-package-mode-only-mismatch-refused',package:core.name,member:member.path,declared_mode:member.mode,observed_mode:fs.statSync(target).mode&0o777,bytes_unchanged:true,...publicRecord(mismatch)});
    });
  } finally {
    password.fill(0);wrong.fill(0);
    fs.writeFileSync(path.join(root,'mechanics-receipt.json'),JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
  }
});
