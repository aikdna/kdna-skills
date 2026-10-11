import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";
const bin = process.env.KDNA_MCP_TEST_SERVER ? path.dirname(process.env.KDNA_MCP_TEST_SERVER) : path.resolve("bin");
const { ReadingViews } = await import(pathToFileURL(path.join(bin, "reading-views.mjs")));
const budget = 1000000;
function setup(options = {}) {
  let readable = true, mono = 0, wall = 1000;
  const binding = { digest: "sha256:bound", assertReadable() { if (!readable) throw new Error("revoked"); } }, session = { stopped: false };
  const views = new ReadingViews(binding, session, { now: () => mono, wallNow: () => wall, ...options });
  return { views, session, revoke() { readable = false; }, time(v) { mono = v; }, wall(v) { wall = v; } };
}
function result({ snapshot = "snapshot:a", epoch = "epoch:a", version = "1.0.0", handles = true } = {}) {
  const asset = { asset_id: "asset:a", asset_version: version, judgment_version: version }, tuple = { container: "0.6.0" };
  const signaturePolicy = { requireSignature: false, expectedPublicKeyHex: null }, observed = { status: "verified", profile: "profile:a", digest: "sha256:a" };
  const verification = { contract: { id: "kdna.retained-sections", version: "0.1.0-candidate" }, operation_id: "operation:a", origin: { snapshot_id: snapshot, kind: "whole", capture_id: "capture:a", admission_request_digest: "sha256:a", verification_digest: "sha256:a", checked_sections_digest: "sha256:a" }, request_digest: "sha256:a", intent_digest: "sha256:a", mode: "exact_selection",
    origin_verification: { signature_integrity: { status: "absent", policy: signaturePolicy, policy_digest: "sha256:a", read_intent_digest: "sha256:a", capture_id: "capture:a", request_digest: "sha256:a" }, checksum_integrity: { status: "absent" }, capture: { identity_scope: "observed_metadata_and_loaded_sections_only", capture_id: "capture:a", input_byte_length: 8000, manifest_bytes_digest: "sha256:a", zip_directory_bytes_digest: "sha256:a", table_frames: [] }, request_digest: "sha256:a", checked_sections: [{ section_id: "section:a", member: "pack", offset_bytes: 0, length_bytes: 20, digest: "sha256:a" }], unchecked_sections: [], routing_integrity: "checked", runtime_entry_digest: observed, whole_container_digest: observed, whole_content_digest: observed, ir_digest: observed, mode: "whole_asset", semantic_status: "verified_whole_graph" }, signature_policy_check: { basis: "immutable_origin_signature_receipt", policy: signaturePolicy, policy_digest: "sha256:a", origin_receipt_digest: "sha256:a", result: "satisfied", new_signature_verification: false }, new_capture: false, io: [], new_domain_validation: false, new_digest_computation: false };
  return { channel: "read_envelope", admission_rejection: null, control: null, transport_failure: null, envelope: {
    contract: { id: "kdna.retained-sections", version: "0.1.0-candidate" }, mode: "exact_selection", request_id: "request:a", status: "ready", tuple, asset, snapshot_id: snapshot,
    digests: { A: { observed: "sha256:bound", comparison: { state: "not_compared" } } },
    content: { catalog: [{ judgment_id: "j:a", focus: "Withhold release unless the exception is resolved." }], selected: { ...asset, judgment_ids: ["j:a"] }, closure: [{ id: "node:a", role: "judgment", target: { kind: "judgment", id: "j:a" }, owner: asset, owner_judgment_id: "j:a", value: { statement: "Do not act when owner is unknown", conditions: ["permission required"], exceptions: ["urgent incident"], unresolved: ["owner unknown"], literal: { "$ref": "author supplied literal" } }, method_interpretation: { status: "undeclared", body: null, declaration_presence: "declared" } }], asset_index: handles ? [{ target: { kind: "dependency", id: "dep:a" }, body_delivery: "deferred", node_ref: "node:dep", handle_id: "long:a" }] : [], references: [{ source_node: "node:a", target_node: "node:dep", mandatory: false, role: "optional" }], expansion_handles: handles ? [{ binding_kind: "retained_section_snapshot", handle_id: "long:a", asset, tuple, origin: { snapshot_id: snapshot }, issuing_operation_id: "op:a", issuing_request_digest: "sha256:request", anchor: { kind: "selection_set", selection: { ...asset, judgment_ids: ["j:a"] } }, target: { kind: "dependency", id: "dep:a" }, scope: ["node:a", "node:dep"], issued_at: 1000, expires_at: 61000, host_id: "host:a", host_epoch: epoch }] : [] },
    states: { core: "valid", interpretation: "degraded", confirmation: "claimed_unverified", writer: "insufficient", read_permission: "allowed", action_authorization: "not_evaluated" }, diagnostics: [{ code: "READ_UNRESOLVED_EXTERNAL", field: "/references/0", subject: "dep:a", severity: "warning" }], omissions: [], assessment: { state: "not_evaluated" }, verification, receipt: { host_id: "host:a", host_epoch: epoch }, budget: { limit_bytes: budget, actual_bytes: "0000000000008000", required_bytes: "0000000000008000" }
  } };
}
const code = expected => error => error.code === expected;
test("task contains complete authored conditions, exceptions, unresolved and distinct responsibility states; audit returns the exact past result", () => {
  const { views } = setup(), full = result(), view = views.task(full, budget);
  assert.deepEqual(view.content.closure, full.envelope.content.closure);
  for (const key of ["states", "diagnostics", "asset", "snapshot_id", "assessment", "digests"]) assert.deepEqual(view[key], full.envelope[key]);
  assert.equal(view.authorization.action_authorized, false);
  assert.equal(view.content.asset_index[0].body_delivery, "deferred");
  assert.equal(view.content.asset_index[0].handle_ref, view.content.expansion_handles[0].handle_ref);
  assert.deepEqual(views.expand(view.content.expansion_handles[0].handle_ref), full.envelope.content.expansion_handles[0]);
  assert.deepEqual(views.audit(view.audit.audit_ref, budget), full);
  assert.equal(view.audit.full_result_bytes, Buffer.byteLength(JSON.stringify(full)));
  const summary = view.verification_summary;
  assert.equal(summary.signature_integrity.status, "absent"); assert.deepEqual(summary.signature_integrity.policy, full.envelope.verification.origin_verification.signature_integrity.policy);
  assert.equal(summary.checksum_integrity.status, "absent"); assert.equal(summary.semantic_status, "verified_whole_graph"); assert.equal(summary.mode, "whole_asset"); assert.equal(summary.origin.kind, "whole");
  assert.equal(summary.signature_policy_check.result, "satisfied"); assert.equal(summary.signature_policy_check.new_signature_verification, false);
  assert.deepEqual(summary.checked_sections, ["section:a"]); assert.equal(summary.capture.identity_scope, "observed_metadata_and_loaded_sections_only");
  for (const k of ["new_capture", "new_domain_validation", "new_digest_computation", "io"]) assert.deepEqual(summary[k], full.envelope.verification[k]);
});
test("self-key and pinned-key signature states and checksum coverage remain distinct from authorship confirmation", () => {
  for (const status of ["verified_self_key", "verified_pinned_key"]) {
    const c = setup(), full = result(), o = full.envelope.verification.origin_verification;
    o.signature_integrity = { ...o.signature_integrity, status, policy: { requireSignature: true, expectedPublicKeyHex: status === "verified_pinned_key" ? "public-key" : null }, profile: "signature-profile", profile_version: "0.1.0", algorithm: "ed25519", public_key: "public-key", key_fingerprint: "fingerprint", members: ["body"], excluded_members: ["optional-media"], signature_document_digest: "sha256:proof", expected_signature_content_digest: "sha256:body", observed_signature_content_digest: "sha256:body" };
    o.checksum_integrity = { status: "verified_document_2", profile: "checksum-profile", profile_version: "2.0.0-candidate", covered_entries: ["body", "manifest"], document_digest: "sha256:proof", expected_entry_set_digest: "sha256:body", observed_entry_set_digest: "sha256:body", capture_id: "capture:a", request_digest: "sha256:request", observed_A: "sha256:a", observed_C: "sha256:c" };
    full.envelope.verification.signature_policy_check.policy = o.signature_integrity.policy;
    const v = c.views.task(full, budget);
    assert.equal(v.verification_summary.signature_integrity.status, status);
    assert.deepEqual(v.verification_summary.signature_integrity.policy, o.signature_integrity.policy);
    assert.deepEqual(v.verification_summary.signature_integrity.excluded_members, ["optional-media"]);
    assert.deepEqual(v.verification_summary.checksum_integrity.covered_entries, ["body", "manifest"]);
    assert.equal(v.states.confirmation, "claimed_unverified"); assert.equal(v.states.action_authorization, "not_evaluated"); assert.equal(v.authorization.action_authorized, false);
  }
});
test("delivery budgets and store limits refuse atomically without a partial view or hidden fallback", () => {
  const { views } = setup();
  assert.throws(() => views.task(result(), 0), code("MCP_TASK_VIEW_BUDGET_EXCEEDED"));
  assert.equal(views.records.size, 0); assert.equal(views.handles.size, 0); assert.equal(views.totalBytes, 0);
  const v = views.task(result(), budget);
  assert.throws(() => views.audit(v.audit.audit_ref, 1), code("MCP_AUDIT_BUDGET_EXCEEDED"));
  for (const options of [{ maxRecords: 0 }, { maxHandles: 0 }, { maxBytes: 1 }]) {
    const limited = setup(options).views;
    assert.throws(() => limited.task(result(), budget), code("MCP_REFERENCE_STORAGE_FULL"));
    assert.equal(limited.records.size, 0); assert.equal(limited.totalBytes, 0);
  }
  let boundary = Buffer.byteLength(JSON.stringify(v));
  for (;;) {
    const next = Buffer.byteLength(JSON.stringify({ ...v, budget: { ...v.budget, view_limit_bytes: boundary } }));
    if (next === boundary) break; boundary = next;
  }
  const exact = setup().views.task(result(), boundary);
  assert.equal(Buffer.byteLength(JSON.stringify(exact)), boundary);
  assert.throws(() => setup().views.task(result(), boundary - 1), code("MCP_TASK_VIEW_BUDGET_EXCEEDED"));
});
test("the total store cap includes complete encoded keys, scopes, expiry metadata and escaping", () => {
  const full = result(), probe = setup(); probe.views.task(full, budget);
  const charge = probe.views.totalBytes;
  assert.equal(charge, Buffer.byteLength(JSON.stringify({ scope: probe.views.scope, records: [...probe.views.records], handles: [...probe.views.handles] })));
  assert.ok(charge > Buffer.byteLength(JSON.stringify(full)) + Buffer.byteLength(JSON.stringify(full.envelope.content.expansion_handles[0])));
  const exact = setup({ maxBytes: charge }); const v = exact.views.task(full, budget);
  assert.equal(exact.views.totalBytes, charge); assert.deepEqual(exact.views.audit(v.audit.audit_ref, budget), full);
  const short = setup({ maxBytes: charge - 1 });
  assert.throws(() => short.views.task(full, budget), code("MCP_REFERENCE_STORAGE_FULL")); assert.equal(short.views.totalBytes, 0);
  const count = setup({ maxRecords: 1 }); const first = count.views.task(full, budget);
  assert.throws(() => count.views.task(full, budget), code("MCP_REFERENCE_STORAGE_FULL"));
  assert.deepEqual(count.views.audit(first.audit.audit_ref, budget), full);
});
test("cross-session, snapshot, asset version and Host epoch references are rejected", () => {
  const first = setup(), v = first.views.task(result(), budget), ref = v.audit.audit_ref, handle = v.content.expansion_handles[0].handle_ref;
  for (const other of [setup().views]) { assert.throws(() => other.audit(ref, budget), code("MCP_REFERENCE_UNAVAILABLE")); assert.throws(() => other.expand(handle), code("MCP_REFERENCE_UNAVAILABLE")); }
  for (const change of [{ snapshot: "snapshot:b" }, { epoch: "epoch:b" }, { version: "1.0.1" }]) {
    const current = setup(), old = current.views.task(result(), budget);
    current.views.observe(result(change));
    assert.equal(current.views.totalBytes, 0);
    assert.throws(() => current.views.audit(old.audit.audit_ref, budget), code("MCP_REFERENCE_UNAVAILABLE"));
    assert.throws(() => current.views.expand(old.content.expansion_handles[0].handle_ref), code("MCP_REFERENCE_UNAVAILABLE"));
  }
});
test("monotonic expiry survives backward wall clock; original handle TTL may only shorten", () => {
  const current = setup(), full = result(); full.envelope.content.expansion_handles[0].expires_at = 1020;
  const v = current.views.task(full, budget); current.wall(-100000); current.time(21);
  assert.throws(() => current.views.expand(v.content.expansion_handles[0].handle_ref), code("MCP_REFERENCE_UNAVAILABLE"));
  assert.deepEqual(current.views.audit(v.audit.audit_ref, budget), full);
  current.time(60000); assert.throws(() => current.views.audit(v.audit.audit_ref, budget), code("MCP_REFERENCE_UNAVAILABLE"));
  assert.equal(current.views.totalBytes, 0);
});
test("cancel, stopped CLI, revoked binding and Host denial clear every stored reference", () => {
  for (const stop of [c => c.views.clear(), c => { c.session.stopped = true; }, c => c.revoke(), c => c.views.observe({ channel: "read_envelope", envelope: { states: { read_permission: "denied" } } })]) {
    const c = setup(), v = c.views.task(result(), budget); stop(c);
    assert.throws(() => c.views.audit(v.audit.audit_ref, budget));
    assert.throws(() => c.views.expand(v.content.expansion_handles[0].handle_ref));
    assert.equal(c.views.records.size, 0); assert.equal(c.views.handles.size, 0); assert.equal(c.views.totalBytes, 0);
  }
});
test("unknown result shape and mismatched handles fail closed, while complete official no-body causes remain visible", () => {
  for (const mutate of [v => { v.envelope.future = { condition: "new" }; }, v => { v.envelope.content.future = { condition: "new" }; }, v => { v.envelope.content.expansion_handles[0].host_epoch = "wrong"; }, v => { v.envelope.content.expansion_handles[0].origin.snapshot_id = "wrong"; }, v => { v.envelope.verification.future = { condition: "new" }; }, v => { v.envelope.verification.origin_verification.signature_integrity.future = "new interpretation"; }, v => { v.envelope.verification.signature_policy_check.future = "new restriction"; }]) {
    const c = setup(), v = result(); mutate(v);
    assert.throws(() => c.views.task(v, budget), code("MCP_TASK_VIEW_UNAVAILABLE")); assert.equal(c.views.records.size, 0);
  }
  const refusal = { status: "rejected", body: null, body_bytes: 0, diagnostic: { code: "READ_SELECTION_NOT_FOUND", subject: "j:missing", field: "/selection/judgment_ids/0" } };
  const c = setup(), view = c.views.task(refusal, budget);
  assert.equal(view.status, "rejected"); assert.deepEqual(view.official_result, refusal); assert.equal(view.audit, null); assert.equal(c.views.records.size, 0);
});
