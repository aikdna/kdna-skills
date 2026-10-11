#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ROOT = path.resolve(__dirname, "..");
const tools = ["kdna.binding-status", "kdna.inspect", "kdna.catalog", "kdna.read", "kdna.expand", "kdna.audit", "kdna.cancel"];
const runtime = {"mcp":"0.8.0-rc.native-sections.1","cli":"0.39.0","core":"0.37.2","read":"0.11.3","read_contract":"kdna.read/0.7.0-candidate","private":true,"publication":"local-stable-candidate","publication_scope":"CLI/Core/Read bind retained local stable candidate archives; their registry publication is recorded separately. This MCP server remains source-only with npm publication disabled by private:true."};
const binding = {control_channel:"operator_or_trusted_launcher_OS_argv",model_tools_can_bind:false,initialize_can_bind:false,finite_assets:1,persistent_permission:false,transport:"local_stdio_only"};
const dimensions = {"named_host_delivery":"observed_codex_cli_full_and_task_cases_only","semantic_adoption":"observed_codex_cli_full_and_task_cases_only","task_presentation_named_host_delivery":"observed_codex_cli_task_case_only","task_presentation_semantic_adoption":"observed_codex_cli_task_case_only","audit_named_model_use":"not_run","real_human_acceptance":"not_run"};
const codexObservation = {"date":"2026-10-11","host":"Codex CLI","host_version":"0.154.0","model":"not_separately_recorded","input":"one synthetic native public asset","task":"apply project-update judgments while retaining uncertainty and action limits","tools":["kdna.binding-status","kdna.catalog","kdna.read","kdna.read","kdna.cancel"],"result":"two ready reads from one catalog snapshot; task answer used the judgments; binding closed; exit 0","installation":"retained verified offline archive graph; not public registry cold acquisition","startup":"temporary trusted command-line binding; no persistent global configuration edit; other execution surfaces disabled for this turn","not_run":["task presentation","kdna.audit","kdna.expand","MCP creation","Studio protection Host","Codex Desktop","Codex IDE","real human acceptance"],"certification":"none","presentation":"full","implementation_scope":"Prior full-presentation implementation; this case does not validate the task/audit extension."};
const presentation = {
  "default": "full",
  "choices": [
    "full",
    "task"
  ],
  "tools": [
    "kdna.catalog",
    "kdna.read",
    "kdna.expand"
  ],
  "task_contract": {
    "id": "kdna.mcp.task-presentation",
    "version": "0.1.0"
  },
  "official_read_contract_unchanged": true,
  "official_budget": "budget_bytes applies to the complete official Read in both presentations",
  "view_budget": {
    "field": "view_budget_bytes",
    "required_for": "task",
    "forbidden_for": "full",
    "minimum": 0,
    "maximum": 1000000
  },
  "task_content": {
    "aliases": "external content_aliases entries with at/from pointers relative to content, node_id and role; only exact structural object duplicates become null placeholders",
    "author_prose_rewritten": false,
    "required_meaning_needs_audit": false,
    "original_null_without_alias_preserved": true,
    "canonical_content_and_states_required": true,
    "verification_summary_required": true,
    "verification_summary_scope": [
      "signature status and complete policy",
      "checksum status",
      "origin kind",
      "mode and semantic status",
      "digest status and profile",
      "signature-policy check basis, policy, result and new_signature_verification",
      "new-verification and I/O flags"
    ],
    "audit_only_verification_material": "long capture/section proofs and full receipt",
    "unknown_verification_fields": "task_view_unavailable"
  },
  "delivery": {
    "content": "text_only",
    "duplicate_full_structured_content": false,
    "duplicate_full_resource": false,
    "partial_success": false,
    "automatic_full_fallback": false,
    "unknown_shape": "unavailable_not_inferred_rejection"
  },
  "expand": {
    "exactly_one_of": [
      "handle",
      "handle_ref"
    ],
    "original_official_validation_required": true
  },
  "audit": {
    "tool": "kdna.audit",
    "arguments": [
      "audit_ref",
      "budget_bytes"
    ],
    "meaning": "exact past full result",
    "new_read": false,
    "new_verification": false,
    "new_authorization": false
  },
  "references": {
    "scope": [
      "live_operator_binding",
      "snapshot",
      "asset_and_version",
      "tuple",
      "host_epoch"
    ],
    "maximum_monotonic_ttl_ms": 60000,
    "short_handle_capped_by_original_expiry": true,
    "invalidated_by": [
      "cancel",
      "process_or_session_end",
      "observed_scope_change"
    ],
    "persistent": false,
    "capacity": {
      "audits": 32,
      "handles": 256,
      "combined_encoded_bytes": 4194304
    },
    "capacity_is_not_token_or_fee_claim": true
  },
  "named_host_evidence": {
    "task": "observed_codex_cli_task_case_only",
    "audit_named_model_use": "not_run",
    "expand_named_model_use": "not_run"
  }
};
const codexTaskObservation = {"date":"2026-10-11","host":"Codex CLI","host_version":"0.154.0","model":"not_separately_recorded","status":"observed_bounded_case","presentation":"task","input":"one synthetic native public asset with three selected judgments","task":"apply project-update judgments while retaining uncertainty and action limits","tools":["kdna.binding-status","kdna.catalog","kdna.read","kdna.cancel"],"selection":"one exact selection batched all three task judgments from the catalog snapshot","result":"ready read; answer applied the judgments and retained scope, undeclared method, claimed-unverified confirmation and action limits; binding closed; exit 0","verification":"inline summary retained absent signature and optional signature policy satisfied; no new verification was inferred","duplicate_ready_selection_reads":0,"audit_calls":0,"expand_calls":0,"installation":"retained verified offline archive graph; not public registry cold acquisition","startup":"temporary trusted command-line binding; no persistent global configuration edit; other execution surfaces disabled for this turn","host_truncation":"raw tool result complete and no truncation reported by the model under the configured display limits; not a general no-truncation guarantee","file_boundary":"no Host-file read attempt or success observed with other execution surfaces disabled in this case","not_run":["kdna.audit named model use","kdna.expand","MCP creation","Studio protection Host","Codex Desktop","Codex IDE","other Host brands","real human acceptance"],"certification":"none","token_fee_comparison":"not established"};
const codexTruncationObservation = {"date":"2026-10-11","host":"Codex CLI","host_version":"0.154.0","model":"not_separately_recorded","status":"observed_host_truncation_stop_case","presentation":"task","condition":"deliberately constrained Host display budget","catalog":"complete MCP catalog event was truncated in Host presentation","followup_read":"automatic approval rejected one follow-up read before MCP dispatch; its parameters also lacked the required strict selection shape","result":"model cancelled the binding and stopped without inventing judgment content; no shell or Host-file read observed","not_established":["successful reading after Host truncation","named-model audit retrieval","reproduction of an external OpenCode experiment","general Host certification"]};
const evidenceScope = "This matrix covers named MCP Host routes. The frozen prior full-presentation case and a separate task-presentation case each cover one synthetic native public task on Codex CLI 0.154.0. A separate forced-truncation case records stopping, not successful continuation. Named-model audit use, other Hosts and direct CLI authoring retain separate scope. Guide availability is not certification.";
const {verifySource} = require("../mcp-server/scripts/verify-runtime-candidates.mjs");
function validateAgentSupport(root = ROOT, supplied) {
  const matrix = supplied ?? JSON.parse(fs.readFileSync(path.join(root,"docs/agent-support-matrix.json"),"utf8"));
  const pkg = JSON.parse(fs.readFileSync(path.join(root,"mcp-server/package.json"),"utf8"));
  assert.equal(matrix.schema_version,12);
  assert.equal(matrix.overall_status,"local_stdio_adapter");
  assert.deepEqual(matrix.candidate_runtime,runtime);
  assert.equal(pkg.version,runtime.mcp); assert.equal(pkg.private,true);
  assert.deepEqual(matrix.tool_surface,tools); assert.deepEqual(matrix.binding,binding);
  assert.deepEqual(matrix.evidence_dimensions,dimensions);
  assert.deepEqual(matrix.presentation,presentation);
  assert.equal(matrix.evidence_scope,evidenceScope);
  assert.equal(Object.hasOwn(matrix,"historical_previous_matrix"),false);
  const source = verifySource(path.join(root,"mcp-server"));
  assert.deepEqual(pkg.kdna_runtime, Object.fromEntries(["cli","core","read","read_contract"].map(key=>[key,matrix.candidate_runtime[key]])));
  assert.deepEqual(matrix.validation,{source_stdio:"mcp-server/test/mcp-protocol.test.mjs",direct_cli:"mcp-server/test/explicit-cli-flow.test.mjs",packed_stdio:"mcp-server/test/packed-consumer.test.mjs"});
  for (const file of Object.values(matrix.validation)) assert.ok(fs.statSync(path.join(root,file)).isFile());
  assert.deepEqual(matrix.agents.map(a=>a.id),["codex","claude-code","opencode","cursor","copilot-compatible"]);
  const fence = String.fromCharCode(96).repeat(3);
  const vectors = matrix.agents.map(agent=>{
    assert.equal(agent.adapter,"operator_bound_local_stdio");
    if (agent.id === "codex") {
      assert.equal(agent.support,"observed_native_public_read_case");
      assert.deepEqual(agent.observation,codexObservation);
      assert.deepEqual(agent.task_observation,codexTaskObservation);
      assert.deepEqual(agent.truncation_observation,codexTruncationObservation);
    } else {
      assert.equal(agent.support,"unassessed");
      assert.equal(Object.hasOwn(agent,"observation"),false);
      assert.equal(Object.hasOwn(agent,"task_observation"),false);
      assert.equal(Object.hasOwn(agent,"truncation_observation"),false);
    }
    const guide = fs.readFileSync(path.join(root,agent.guide),"utf8");
    const blocks = [...guide.matchAll(new RegExp(fence+"json\\s*\\n([\\s\\S]*?)\\n"+fence,"g"))];
    assert.equal(blocks.length,1,agent.guide);
    const vector = JSON.parse(blocks[0][1]);
    assert.deepEqual(vector,{command:"/absolute/path/to/node",args:["/absolute/installed/mcp-server/bin/kdna-mcp.mjs","--asset","/absolute/selected.kdna","--allow-read"]});
    for (const key of ["mcp","cli","core","read","read_contract"]) assert.ok(guide.includes(runtime[key]), agent.guide + ": stale " + key + " coordinate");
    for (const token of ["presentation", "view_budget_bytes", "content_aliases", "handle_ref", "kdna.audit", "audit_ref"]) assert.ok(guide.includes(token),agent.guide + ": missing " + token);
    assert.match(guide,/NOT_RUN/); return {id:agent.id,guide:agent.guide,vector};
  });
  const loader=fs.readFileSync(path.join(root,"kdna-loader/SKILL.md"),"utf8");
  for (const token of ["argv","mandatory","not_evaluated","kdna.cancel","--session --allow-read"]) assert.ok(loader.includes(token),token);
  const contract=fs.readFileSync(path.join(root,"docs/KDNA_LOADER_CONTRACT.md"),"utf8");
  assert.match(contract,/not a second public/);
  return {status:"SOURCE_AND_GUIDE_STRUCTURE_VALID",runtime,tools,source,guide_vectors:vectors,proof_limit:"Source archives, graph and guide structure only; actual process tests run separately. Separate bounded Codex CLI full and task cases are recorded; forced truncation establishes stopping only. Named-model audit use, other Hosts, routes and human acceptance remain unassessed."};
}
module.exports={validateAgentSupport};
if(require.main===module) {
  if(process.argv.length!==2) throw new Error("No authority-file or command-line overrides are accepted");
  console.log(JSON.stringify(validateAgentSupport(),null,2));
}
