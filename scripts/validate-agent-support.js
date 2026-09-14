#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ROOT = path.resolve(__dirname, "..");
const tools = ["kdna.binding-status", "kdna.inspect", "kdna.catalog", "kdna.read", "kdna.expand", "kdna.cancel"];
const runtime = {mcp:"0.7.0-rc.component-semantics.1",cli:"0.38.0-rc.component-semantics.1",core:"0.24.0-rc.component-semantics.2",read:"0.3.0-rc.component-semantics.2",read_contract:"kdna.read/0.2.0",private:true,publication:"unpublished"};
const binding = {control_channel:"operator_or_trusted_launcher_OS_argv",model_tools_can_bind:false,initialize_can_bind:false,finite_assets:1,persistent_permission:false,transport:"local_stdio_only"};
const dimensions = {named_host_delivery:"not_run",semantic_adoption:"not_run",real_human_acceptance:"not_run"};
const {verifySource} = require("../mcp-server/scripts/verify-runtime-candidates.mjs");
function validateAgentSupport(root = ROOT, supplied) {
  const matrix = supplied ?? JSON.parse(fs.readFileSync(path.join(root,"docs/agent-support-matrix.json"),"utf8"));
  const pkg = JSON.parse(fs.readFileSync(path.join(root,"mcp-server/package.json"),"utf8"));
  assert.equal(matrix.schema_version,9);
  assert.equal(matrix.overall_status,"local_stdio_adapter");
  assert.deepEqual(matrix.candidate_runtime,runtime);
  assert.equal(pkg.version,runtime.mcp); assert.equal(pkg.private,true);
  assert.deepEqual(matrix.tool_surface,tools); assert.deepEqual(matrix.binding,binding);
  assert.deepEqual(matrix.evidence_dimensions,dimensions);
  assert.equal(Object.hasOwn(matrix,"historical_previous_matrix"),false);
  const source = verifySource(path.join(root,"mcp-server"));
  assert.deepEqual(pkg.kdna_runtime, Object.fromEntries(["cli","core","read","read_contract"].map(key=>[key,matrix.candidate_runtime[key]])));
  assert.deepEqual(matrix.validation,{source_stdio:"mcp-server/test/mcp-protocol.test.mjs",direct_cli:"mcp-server/test/explicit-cli-flow.test.mjs",packed_stdio:"mcp-server/test/packed-consumer.test.mjs"});
  for (const file of Object.values(matrix.validation)) assert.ok(fs.statSync(path.join(root,file)).isFile());
  assert.deepEqual(matrix.agents.map(a=>a.id),["codex","claude-code","opencode","cursor","copilot-compatible"]);
  const fence = String.fromCharCode(96).repeat(3);
  const vectors = matrix.agents.map(agent=>{
    assert.equal(agent.support,"unassessed"); assert.equal(agent.adapter,"operator_bound_local_stdio");
    const guide = fs.readFileSync(path.join(root,agent.guide),"utf8");
    const blocks = [...guide.matchAll(new RegExp(fence+"json\\s*\\n([\\s\\S]*?)\\n"+fence,"g"))];
    assert.equal(blocks.length,1,agent.guide);
    const vector = JSON.parse(blocks[0][1]);
    assert.deepEqual(vector,{command:"/absolute/path/to/node",args:["/absolute/installed/mcp-server/bin/kdna-mcp.mjs","--asset","/absolute/selected.kdna","--allow-read"]});
    assert.match(guide,/NOT_RUN/); return {id:agent.id,guide:agent.guide,vector};
  });
  const loader=fs.readFileSync(path.join(root,"kdna-loader/SKILL.md"),"utf8");
  for (const token of ["argv","mandatory","not_evaluated","kdna.cancel","--session --allow-read"]) assert.ok(loader.includes(token),token);
  const contract=fs.readFileSync(path.join(root,"docs/KDNA_LOADER_CONTRACT.md"),"utf8");
  assert.match(contract,/not a second public/);
  return {status:"SOURCE_AND_GUIDE_STRUCTURE_VALID",runtime,tools,source,guide_vectors:vectors,proof_limit:"Source archives, graph and guide structure only; actual process tests run separately. No named Host, semantic adoption or human acceptance."};
}
module.exports={validateAgentSupport};
if(require.main===module) {
  if(process.argv.length!==2) throw new Error("No authority-file or command-line overrides are accepted");
  console.log(JSON.stringify(validateAgentSupport(),null,2));
}
