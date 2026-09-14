import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validateCandidateFacts, EXPECTED_GRAPH, PACKED_FILES} from "../scripts/verify-runtime-candidates.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
function facts(){
 const packageJson=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
 const lock=JSON.parse(fs.readFileSync(path.join(root,"package-lock.json"),"utf8"));
 const installed={};
 for(const [key,value] of Object.entries(EXPECTED_GRAPH)) if(!value.optional) installed[key]=JSON.parse(fs.readFileSync(path.join(root,key,"package.json"),"utf8"));
 return {root,packageJson,lock,installed,packedFiles:[...PACKED_FILES]};
}
test("private local candidate binds exact twelve artifacts and complete installed graph",()=>{
 const result=validateCandidateFacts(facts());
 assert.equal(result.fixedArtifacts,12); assert.equal(result.lockedRequiredPackages,12);
 assert.equal(result.installedRequiredPackages,12); assert.equal(result.optionalOmitted,9);
 assert.equal(result.packedFileCount,19); assert.equal(result.status,"LOCAL_RC_ONLY_UNPUBLISHED");
});
test("runtime binding rejects candidate, graph, dependency and package drift",async t=>{
 const mutations=[
   f=>f.packageJson.private=false,f=>f.packageJson.kdna_runtime.cli="0.36.1",
   f=>f.packageJson.dependencies["@aikdna/kdna-cli"]="0.37.3",
   f=>f.lock.packages["node_modules/@aikdna/kdna-cli"].integrity="sha512-drift",
   f=>f.lock.packages["node_modules/@aikdna/kdna-cli"].dependencies["@aikdna/kdna-read"]="0.1.0",
   f=>f.lock.packages["node_modules/fast-uri"].version="3.1.5",
   f=>f.lock.packages["node_modules/shadow/node_modules/@aikdna/kdna-core"]={version:"0.23.0"},
   f=>f.installed["node_modules/@aikdna/kdna-cli"].version="0.36.1",
   f=>delete f.installed["node_modules/@aikdna/kdna-read"],
   f=>f.packedFiles.push("test/unexpected.mjs"),
   f=>f.packedFiles.push("vendor/unbound.tgz"),
   f=>f.lock.packages[""].dependencies["@aikdna/kdna-cli"]="^0.37.3"
 ];
 for(const [i,change] of mutations.entries()) await t.test("rejects drift "+i,()=>{const f=facts();change(f);assert.throws(()=>validateCandidateFacts(f));});
});
