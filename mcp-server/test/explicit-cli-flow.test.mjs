import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import test from "node:test";
const root=path.resolve(".");
const cli=path.join(root,"node_modules/@aikdna/kdna-cli/src/cli.js");
const binding=JSON.parse(fs.readFileSync(path.join(path.dirname(cli),"../public-contract-binding.json"),"utf8"));
const fixture=path.join(process.env.KDNA_PUBLIC_FIXTURES || path.join(root,"test/fixtures/public-read-current"),"graph-cross.kdna");
const recordRoot=process.env.KDNA_MCP_TEST_RECORD_ROOT?path.join(process.env.KDNA_MCP_TEST_RECORD_ROOT,"stdio","direct-cli"):null;
if(recordRoot)fs.mkdirSync(recordRoot,{recursive:true,mode:0o700});
function record(value,input,stdout,stderr){
 if(!recordRoot)return;
 const prefix=path.join(recordRoot,randomUUID());
 for(const [suffix,data] of Object.entries({stdin:input,stdout,stderr,json:JSON.stringify(value,null,2)+"\n"}))fs.writeFileSync(prefix+"."+suffix,data);
}
function run(args){
 const argv=[cli,...args],started=new Date().toISOString();
 const result=spawnSync(process.execPath,argv,{cwd:root,env:process.env,encoding:"utf8",timeout:30000});
 record({started,completed:new Date().toISOString(),pid:result.pid,argv:[process.execPath,...argv],cwd:root,node:process.version,status:result.status,signal:result.signal},"",result.stdout??"",result.stderr??"");
 assert.equal(result.error,undefined); return {...result,value:JSON.parse(result.stdout)};
}
test("Loader direct inspect is technical and unapproved read discloses no body",()=>{
 const inspected=run(["inspect",fixture]); assert.equal(inspected.status,0);
 assert.equal(inspected.value.status,"accepted");
 for(const state of ["writer","confirmation","read_permission","action_authorization"]) assert.equal(inspected.value.states[state],"not_evaluated");
 const refused=run(["read",fixture,"--mode","catalog","--budget","1000000"]);
 assert.notEqual(refused.status,0); assert.notEqual(refused.value.envelope?.status,"ready");
 assert.equal(refused.value.envelope?.content??null,null);
});
test("Loader one-shot examples select actual catalog identifiers and preserve original catalog",()=>{
 const catalog=run(["read",fixture,"--mode","catalog","--budget","1000000","--allow-read"]);
 assert.equal(catalog.status,0);
 const e=catalog.value.envelope; assert.equal(e.status,"ready");
 const ids=e.content.catalog.map(x=>x.judgment_id);
 for(const id of ids){
   const exact=run(["read",fixture,"--mode","exact_selection","--asset-id",e.asset.asset_id,"--asset-version",e.asset.asset_version,"--judgment-id",id,"--budget","1000000","--allow-read"]);
   assert.equal(exact.status,0);assert.equal(exact.value.envelope.status,"ready");
   assert.equal(exact.value.envelope.content.selected.judgment_id,id);
 }
 assert.deepEqual(e.content.catalog.map(x=>x.judgment_id),ids);
});
test("Loader progressive public requests keep one real CLI process through catalog selection expand and EOF",async t=>{
 const argv=[cli,"read",fixture,"--session","--allow-read"],started=new Date().toISOString();
 const child=spawn(process.execPath,argv,{cwd:root,env:process.env,stdio:["pipe","pipe","pipe"]});
 let input="",stdout="",stderr="",buffer="",pending=null,exit=null;
 const closed=new Promise(resolve=>child.once("close",(code,signal)=>{exit={code,signal,at:new Date().toISOString()};if(pending){pending.reject(new Error("CLI closed"));pending=null;}resolve(exit);}));
 child.stdin.on("error",()=>undefined);
 child.stdout.setEncoding("utf8");child.stderr.setEncoding("utf8");
 child.stdout.on("data",chunk=>{
  stdout+=chunk;buffer+=chunk;let end;
  while((end=buffer.indexOf("\n"))>=0){
   const line=buffer.slice(0,end);buffer=buffer.slice(end+1);
   assert.ok(pending,"unrequested CLI output");const p=pending;pending=null;clearTimeout(p.timer);p.resolve(JSON.parse(line));
  }
 });
 child.stderr.on("data",chunk=>stderr+=chunk);
 t.after(async()=>{
  if(!exit)child.stdin.end();const timer=setTimeout(()=>child.kill("SIGKILL"),3000);
  await closed;clearTimeout(timer);
  record({started,completed:exit,pid:child.pid,argv:[process.execPath,...argv],cwd:root,node:process.version},input,stdout,stderr);
 });
 function request(mode,selection=null,handle=null){
  assert.equal(pending,null);
  const line=JSON.stringify({request_id:"loader:"+randomUUID(),tuple:binding.tuple,mode,budget_bytes:1000000,selection,handle})+"\n";
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending=null;child.kill("SIGTERM");reject(new Error("CLI session timeout"));},8000);pending={resolve,reject,timer};input+=line;child.stdin.write(line);});
 }
 const c=(await request("catalog")).envelope;assert.equal(c.status,"ready");
 const selection={asset_id:c.asset.asset_id,asset_version:c.asset.asset_version,judgment_id:c.content.catalog[0].judgment_id};
 const e=(await request("exact_selection",selection)).envelope;assert.equal(e.status,"ready");assert.equal(e.snapshot_id,c.snapshot_id);
 const handle=e.content.expansion_handles[0];assert.ok(handle);
 const x=(await request("expand",handle.selection,handle)).envelope;assert.equal(x.status,"ready");assert.equal(x.snapshot_id,c.snapshot_id);
 const again=(await request("catalog")).envelope;assert.deepEqual(again.content.catalog,c.content.catalog);
 assert.equal(c.receipt.host_epoch,"process:"+child.pid);
 child.stdin.end();const result=await closed;assert.equal(result.code,0);
 assert.throws(()=>process.kill(child.pid,0),error=>error.code==="ESRCH");
});
