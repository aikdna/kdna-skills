import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
import validation from "./validate-agent-support.js";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const original=JSON.parse(fs.readFileSync(path.join(root,"docs/agent-support-matrix.json"),"utf8"));
test("seven-tool guide structure separates frozen full, bounded task and truncation-stop observations",()=>{
  assert.equal(validation.validateAgentSupport(root).guide_vectors.length,5);
});
test("support guide validator rejects authority or delivery escalation",async t=>{
  const cases=[
    m=>m.binding.model_tools_can_bind=true,m=>m.binding.initialize_can_bind=true,
    m=>m.binding.finite_assets=2,m=>m.binding.transport="remote",
    m=>m.candidate_runtime.publication="released",m=>m.candidate_runtime.cli="0.36.0",
    m=>m.agents[0].support="verified",m=>m.evidence_dimensions.real_human_acceptance="passed",
    m=>m.agents[1].support="verified",m=>m.agents[1].observation=structuredClone(m.agents[0].observation),
    m=>m.agents[0].observation.host="Codex Desktop",m=>m.agents[0].observation.tools.push("kdna.expand"),
    m=>m.agents[0].observation.not_run=[],m=>m.evidence_dimensions.named_host_delivery="passed",
    m=>m.evidence_dimensions.independent_acceptance="passed",m=>m.tool_surface.push("kdna.load"),
    m=>m.historical_previous_matrix={schema_version:7},
    m=>m.presentation.default="task",m=>m.presentation.official_read_contract_unchanged=false,
    m=>m.presentation.view_budget.required_for=null,m=>m.presentation.audit.new_authorization=true,
    m=>m.presentation.references.persistent=true,m=>m.presentation.task_content.author_prose_rewritten=true,
    m=>m.presentation.task_content.verification_summary_required=false,
    m=>m.presentation.delivery.duplicate_full_structured_content=true,
    m=>m.evidence_dimensions.task_presentation_named_host_delivery="passed",
    m=>m.agents[0].observation.presentation="task",m=>m.tool_surface=m.tool_surface.filter(tool=>tool!=="kdna.audit"),
    m=>m.agents[0].task_observation.host="Codex Desktop",
    m=>m.agents[0].task_observation.audit_calls=1,
    m=>m.agents[0].task_observation.tools.push("kdna.expand"),
    m=>m.agents[0].task_observation.not_run=[],
    m=>m.agents[1].task_observation=structuredClone(m.agents[0].task_observation),
    m=>m.evidence_dimensions.audit_named_model_use="passed",
    m=>m.agents[0].truncation_observation.result="ready follow-up read",
    m=>m.presentation.named_host_evidence.audit_named_model_use="passed",
    m=>m.evidence_scope="All Hosts certified"
  ];
  for(const [index,change] of cases.entries()) await t.test("rejects changed claim "+index,()=>{
    const m=structuredClone(original); change(m);
    assert.throws(()=>validation.validateAgentSupport(root,m));
  });
});

test("source verification rejects actual manifest, lock and archive tampering", async t=>{
 const changes = [
  ["manifest", r=>{const p=path.join(r,"mcp-server/package.json");const v=JSON.parse(fs.readFileSync(p));v.dependencies["@aikdna/kdna-cli"]="0.38.0-rc.component-semantics.1";fs.writeFileSync(p,JSON.stringify(v));}],
  ["lock",r=>{const p=path.join(r,"mcp-server/package-lock.json");const v=JSON.parse(fs.readFileSync(p));v.packages["node_modules/@aikdna/kdna-read"].integrity="sha512-invalid";fs.writeFileSync(p,JSON.stringify(v));}],
  ["archive",r=>{const p=path.join(r,"mcp-server/vendor/fast-uri-3.1.8.tgz");const v=fs.readFileSync(p);v[30]^=1;fs.writeFileSync(p,v);}]
 ];
 for(const [name,change] of changes) await t.test(name,()=>{
  const scratch=fs.mkdtempSync(path.join(os.tmpdir(),"agent-source-drift-"));
  try {
   for(const dir of ["docs","integrations","kdna-loader","mcp-server"]) fs.cpSync(path.join(root,dir),path.join(scratch,dir),{recursive:true,filter:p=>!p.split(path.sep).includes("node_modules")});
   change(scratch);assert.throws(()=>validation.validateAgentSupport(scratch));
  } finally {fs.rmSync(scratch,{recursive:true,force:true});}
 });
});
