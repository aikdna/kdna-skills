#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const directory=path.join(root,"test/fixtures/public-read-native");
assert.equal(process.argv.length,3,"usage: node scripts/generate-native-fixtures.mjs EXACT_CLI_ENTRY");
const cli=fs.realpathSync(process.argv[2]);
const manifest=JSON.parse(fs.readFileSync(path.resolve(path.dirname(cli),"../package.json")));
assert.equal(manifest.name,"@aikdna/kdna-cli");
assert.equal(manifest.version,"0.39.0-rc.native-sections.3");
const seed=JSON.parse(fs.readFileSync(path.join(directory,"seed.authored.json")));
const mutations={
 "graph-cross":()=>{},
 "graph-same":a=>{a.payload.dependencies[0].required=true;},
 "graph-method":a=>{a.payload.judgments[0].method.components[0].statement="A second synthetic subjective basis with the same explicitly authored method.";},
 "graph-asset":a=>{a.manifest.asset_id="asset:teaching";a.manifest.asset_uid="uid:teaching";a.payload.asset.asset_id="asset:teaching";a.payload.judgments[0].focus="What should this synthetic team update emphasize?";},
 "graph-null":a=>{a.payload.conditions=[];a.payload.judgments[0].boundaries={state:"none",value:null};a.payload.judgments[0].exceptions={state:"none",value:null};},
 "graph-dedup-support":a=>{a.payload.dependencies[0].required=true;a.payload.judgments[2].subject.actor_ids=["actor:boundary"];},
};
const temporary=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),"kdna-native-fixtures-"));
try {
for(const [name,mutate] of Object.entries(mutations)){
 const authored=structuredClone(seed);mutate(authored);
 const input=path.join(directory,name+".authored.json"),output=path.join(temporary,name+".kdna");
 fs.writeFileSync(input,JSON.stringify(authored,null,2)+"\n");
 const result=spawnSync(process.execPath,[cli,"create",input,"--output",output,"--allow-create"],{encoding:"utf8",timeout:30000});
 assert.equal(result.status,0,result.stdout+result.stderr);
 const inspected=spawnSync(process.execPath,[cli,"inspect",output],{encoding:"utf8",timeout:30000});
 assert.equal(inspected.status,0,inspected.stdout+inspected.stderr);
 assert.equal(JSON.parse(inspected.stdout).status,"accepted");
 fs.renameSync(output,path.join(directory,name+".kdna"));
}
} finally { fs.rmSync(temporary,{recursive:true,force:true}); }
const bytes=fs.readFileSync(path.join(directory,"graph-cross.kdna"));
fs.writeFileSync(path.join(directory,"hostile-native-truncated.kdna"),bytes.subarray(0,bytes.length-1));
console.log(JSON.stringify({nativeFixtures:Object.keys(mutations).length,rejectedFixture:1,cli:manifest.version}));
