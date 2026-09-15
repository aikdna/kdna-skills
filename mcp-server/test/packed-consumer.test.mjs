import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {createLocalConsumer} from "../scripts/create-local-consumer.mjs";
import {EXPECTED_GRAPH} from "../scripts/verify-runtime-candidates.mjs";
import {makeCanonicalTempRoot} from "./support/canonical-temp-root.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");

test("fresh packed consumer installs offline and runs the real stdio boundary suite", {timeout:120000}, t=>{
 const temporary=makeCanonicalTempRoot("mcp-packed-consumer-");
 t.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));
 const consumer=path.join(temporary,"consumer");
 assert.equal(createLocalConsumer(consumer).archives,13);
 const env={...process.env,npm_config_cache:path.join(temporary,"empty-cache")};
 delete env.NODE_TEST_CONTEXT;
 const install=spawnSync("npm",["ci","--dry-run=false","--offline","--ignore-scripts","--omit=optional","--no-audit","--no-fund"],{cwd:consumer,env,encoding:"utf8",timeout:60000});
 assert.equal(install.status,0,install.stdout+install.stderr);
 for(const [name,value] of Object.entries(EXPECTED_GRAPH)) {
  const file=path.join(consumer,name,"package.json");
  if(value.optional) assert.equal(fs.existsSync(file),false,name);
  else assert.equal(JSON.parse(fs.readFileSync(file)).version,value.version,name);
 }
 const server=path.join(consumer,"node_modules/@aikdna/kdna-mcp-server/bin/kdna-mcp.mjs");
 const run=spawnSync(process.execPath,["--test","--test-reporter=tap","test/mcp-protocol.test.mjs"],{cwd:root,env:{...env,KDNA_MCP_TEST_SERVER:server},encoding:"utf8",timeout:60000,maxBuffer:8*1024*1024});
 assert.equal(run.status,0,run.stdout+run.stderr);
 assert.match(run.stdout,/^# fail 0$/m); assert.match(run.stdout,/^# skipped 0$/m);
 assert.match(run.stdout,/operator/);
 assert.throws(()=>createLocalConsumer(consumer),/must not exist/);
 assert.ok(fs.existsSync(server),"refused recreation preserves the installed consumer");
});
