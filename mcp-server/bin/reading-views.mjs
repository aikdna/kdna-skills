import { createHash, randomUUID } from "node:crypto";
import { AdapterError } from "./operator-binding.mjs";
import { compactTaskContent } from "./task-content.mjs";

const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
const encode = v => JSON.stringify(v);
const bytes = v => Buffer.byteLength(encode(v));
const digest = v => "sha256:" + createHash("sha256").update(encode(v)).digest("hex");
const fail = (code, message) => { throw new AdapterError(code, message); };
const envelopeKeys = ["contract", "mode", "request_id", "status", "tuple", "asset", "snapshot_id", "digests", "content", "states", "diagnostics", "omissions", "assessment", "verification", "receipt", "budget"];
const contentKeys = ["declarations", "catalog", "selected", "closure", "references", "relationships", "missing", "provenance", "asset_capability", "asset_index", "expansion_handles"];
const handleKeys = ["binding_kind", "handle_id", "asset", "tuple", "origin", "issuing_operation_id", "issuing_request_digest", "anchor", "target", "scope", "issued_at", "expires_at", "host_id", "host_epoch"];
const exact = (v, names) => object(v) && Object.keys(v).length === names.length && names.every(k => Object.hasOwn(v, k));
const byteAdmissionContract = v => exact(v, ["id", "version", "definition_digest"]) && v.id === "kdna.section-bytes-node" && v.version === "0.1.1-candidate" && v.definition_digest === "sha256:8358dfe622117bb88866d7f72ca15e21961a87b37e108978ed05015b102277ef";
const uint = v => Number.isSafeInteger(v) && v >= 0;
const identifier = v => typeof v === "string" && v.length > 0 && [...v].length <= 256 && !/[\u0000-\u001f\u007f-\u009f\ud800-\udfff]/u.test(v);
const entryName = v => typeof v === "string" && [...v].length <= 4096 && /^(?!\/)(?!.*(?:^|\/)(?:\.|\.\.)(?:\/|$))(?!.*\/\/)(?!.*\/$)[^\\\u0000-\u001f\u007f-\u009f]+$/u.test(v);
const sha = v => typeof v === "string" && /^sha256:[0-9a-f]{64}$/.test(v);
const singleRangePurposes = ["zip_end", "zip_directory", "zip_local_header", "zip_local_name", "mimetype", "manifest", "whole_after_authorization", "zip_directory_header", "zip_directory_name", "section_table_after_authorization", "section_content_after_authorization", "resource_after_authorization", "section_structure_after_authorization", "zip_locator_local_signature", "zip_locator_local_header", "zip_locator_directory_signature", "zip_locator_directory_header", "zip_locator_directory_name", "zip_locator_local_name", "zip_locator_eocd", "zip_comment", "checksum_document_after_authorization", "checksum_member_after_authorization", "signature_document_after_authorization", "signature_member_after_authorization"];
const rangeBytes = v => exact(v, ["offset_bytes", "length_bytes"]) && uint(v.offset_bytes) && uint(v.length_bytes);
function byteObservation(v) {
  if (v === null) return true;
  if (!exact(v, ["contract", "input_kind", "input_byte_length", "ownership_copy", "capture", "access_ranges", "filesystem_reads"]) || !byteAdmissionContract(v.contract) || v.input_kind !== "owned_uint8array" || !uint(v.input_byte_length) || !rangeBytes(v.ownership_copy) || v.ownership_copy.offset_bytes !== 0 || v.ownership_copy.length_bytes !== v.input_byte_length || v.filesystem_reads !== 0 || !Array.isArray(v.access_ranges)) return false;
  const c = v.capture;
  if (c !== null && (!exact(c, ["capture_id", "input_byte_length", "manifest_bytes_digest", "zip_directory_bytes_digest", "table_frames", "identity_scope"]) || !identifier(c.capture_id) || !uint(c.input_byte_length) || !sha(c.manifest_bytes_digest) || !sha(c.zip_directory_bytes_digest) || c.identity_scope !== "observed_metadata_and_loaded_sections_only" || !Array.isArray(c.table_frames) || !c.table_frames.every(row => exact(row, ["section_id", "member", "offset_bytes", "length_bytes", "digest"]) && identifier(row.section_id) && entryName(row.member) && uint(row.offset_bytes) && uint(row.length_bytes) && row.length_bytes > 0 && sha(row.digest)))) return false;
  return v.access_ranges.every(row => exact(row, ["offset_bytes", "length_bytes", "purpose"]) ? uint(row.offset_bytes) && uint(row.length_bytes) && singleRangePurposes.includes(row.purpose) : exact(row, ["purpose", "ranges"]) && ["section_structure_after_authorization", "section_interpretation_after_authorization"].includes(row.purpose) && Array.isArray(row.ranges) && row.ranges.length >= 1 && row.ranges.length <= 4096 && row.ranges.every(rangeBytes));
}
function byteAdmissionRejection(v) {
  // Recognize the pinned official no-body layout only. This does not parse,
  // validate an asset, grant authority or reinterpret its original diagnosis.
  return exact(v, ["contract", "request_id", "status", "reason", "stage", "diagnostic", "input_observation", "snapshot"]) && byteAdmissionContract(v.contract) && ["rejected", "unsupported"].includes(v.status) && (v.request_id === null || identifier(v.request_id)) && typeof v.reason === "string" && /\S/u.test(v.reason) && ["input", "metadata", "authorization", "content", "semantic", "integrity"].includes(v.stage) && v.snapshot === null && (v.diagnostic === null || exact(v.diagnostic, ["field", "subject"]) && (v.diagnostic.field === null || typeof v.diagnostic.field === "string") && (v.diagnostic.subject === null || identifier(v.diagnostic.subject))) && byteObservation(v.input_observation);
}
const unavailable = () => fail("MCP_TASK_VIEW_UNAVAILABLE", "This official result cannot be represented completely by the task view. Request full presentation explicitly.");
const stale = () => fail("MCP_REFERENCE_UNAVAILABLE", "The reference is absent, expired or outside this live operator-bound session. A reference grants no permission.");
function summaryFields(value, kept, proof, required = []) {
  if (!object(value) || Object.keys(value).some(k => ![...kept, ...proof].includes(k)) || !required.every(k => Object.hasOwn(value, k))) unavailable();
  return Object.fromEntries(kept.filter(k => Object.hasOwn(value, k)).map(k => [k, structuredClone(value[k])]));
}
function verificationSummary(v) {
  const names = ["contract", "operation_id", "origin", "request_digest", "intent_digest", "mode", "origin_verification", "signature_policy_check", "new_capture", "io", "new_domain_validation", "new_digest_computation"];
  if (!exact(v, names)) unavailable();
  const o = v.origin_verification;
  if (!exact(o, ["signature_integrity", "checksum_integrity", "capture", "request_digest", "checked_sections", "unchecked_sections", "routing_integrity", "runtime_entry_digest", "whole_container_digest", "whole_content_digest", "ir_digest", "mode", "semantic_status"])) unavailable();
  const signature = summaryFields(o.signature_integrity, ["status", "policy", "profile", "profile_version", "algorithm", "public_key", "key_fingerprint", "members", "excluded_members"], ["policy_digest", "read_intent_digest", "capture_id", "request_digest", "signature_document_digest", "expected_signature_content_digest", "observed_signature_content_digest"], ["status", "policy"]);
  const checksum = summaryFields(o.checksum_integrity, ["status", "profile", "profile_version", "covered_entries"], ["document_digest", "expected_entry_set_digest", "observed_entry_set_digest", "capture_id", "request_digest", "observed_A", "observed_C"], ["status"]);
  const origin = summaryFields(v.origin, ["kind", "snapshot_id"], ["capture_id", "admission_request_digest", "verification_digest", "checked_sections_digest"], ["kind", "snapshot_id"]);
  const capture = summaryFields(o.capture, ["identity_scope"], ["capture_id", "input_byte_length", "manifest_bytes_digest", "zip_directory_bytes_digest", "table_frames"], ["identity_scope"]);
  const signaturePolicy = summaryFields(v.signature_policy_check, ["basis", "policy", "result", "new_signature_verification"], ["policy_digest", "origin_receipt_digest"], ["basis", "policy", "result", "new_signature_verification"]);
  if (!Array.isArray(o.checked_sections) || !Array.isArray(o.unchecked_sections)) unavailable();
  for (const row of o.checked_sections) if (!exact(row, ["section_id", "member", "offset_bytes", "length_bytes", "digest"])) unavailable();
  const digests = Object.fromEntries(["runtime_entry_digest", "whole_container_digest", "whole_content_digest", "ir_digest"].map(key => [key, summaryFields(o[key], ["status", "profile", "member_names"], ["digest"], ["status", "profile"])]));
  return { origin, signature_integrity: signature, checksum_integrity: checksum, routing_integrity: o.routing_integrity, capture,
    mode: o.mode, semantic_status: o.semantic_status, digest_verification: digests,
    checked_sections: o.checked_sections.map(row => row.section_id), unchecked_sections: o.unchecked_sections,
    signature_policy_check: signaturePolicy, new_capture: v.new_capture, new_domain_validation: v.new_domain_validation, new_digest_computation: v.new_digest_computation, io: v.io };
}

// A presentation adapter, never a parser, verifier or authorization provider.
// Records are published only after a complete view fits its delivery budget.
export class ReadingViews {
  constructor(binding, session, { now = () => performance.now(), wallNow = Date.now, ttl = 60000, maxBytes = 4 * 1024 * 1024, maxRecords = 32, maxHandles = 256 } = {}) {
    this.binding = binding; this.session = session; this.now = now; this.wallNow = wallNow;
    this.ttl = Math.min(ttl, 60000); this.maxBytes = maxBytes; this.maxRecords = maxRecords; this.maxHandles = maxHandles;
    this.clear();
  }
  clear() { this.records = new Map(); this.handles = new Map(); this.totalBytes = 0; this.scope = null; }
  storageBytes(records = this.records, handles = this.handles) {
    if (records.size === 0 && handles.size === 0) return 0;
    // Charge the complete encoded tables, including opaque keys, scope,
    // deadlines, lengths, escaping and structural overhead, not only bodies.
    return bytes({ scope: this.scope, records: [...records], handles: [...handles] });
  }
  assertLive() {
    try { this.binding.assertReadable(); }
    catch (cause) { this.clear(); throw cause; }
    if (this.session.stopped) { this.clear(); stale(); }
  }
  prune() {
    const time = this.now();
    for (const [ref, record] of this.records) if (record.expires <= time) this.records.delete(ref);
    for (const [ref, handle] of this.handles) if (handle.expires <= time) this.handles.delete(ref);
    this.totalBytes = this.storageBytes();
  }
  observe(value) {
    const e = value?.channel === "read_envelope" ? value.envelope : null;
    if (e?.states?.read_permission === "denied") { this.clear(); return; }
    if (!e || typeof e.snapshot_id !== "string" || !object(e.receipt) || typeof e.receipt.host_epoch !== "string") return;
    const scope = encode([this.binding.digest, e.snapshot_id, e.asset, e.tuple, e.receipt.host_id, e.receipt.host_epoch]);
    if (this.scope !== scope) { this.clear(); this.scope = scope; }
  }
  task(value, viewBudget) {
    this.assertLive(); this.observe(value); this.prune();
    if (!Number.isSafeInteger(viewBudget) || viewBudget < 0 || viewBudget > 1000000) unavailable();
    // Complete official no-body controls/rejections keep every causal field.
    // They never issue an audit reference or disguise a refusal as a read.
    const byteRejected = byteAdmissionRejection(value);
    if (object(value) && (value.contract?.id === "kdna.section-bytes-node" || Object.hasOwn(value, "input_observation")) && !byteRejected) unavailable();
    if (byteRejected || (value?.channel === "no_body_control") || (value?.status === "rejected" && value.body === null && value.body_bytes === 0) || (value?.channel === "read_envelope" && value.envelope?.status === "rejected" && value.envelope.content === null)) {
      const model = { contract: { id: "kdna.mcp.task-presentation", version: "0.1.0" }, status: "rejected", official_result: value, authorization: { action_authorized: false }, audit: null, budget: { view_limit_bytes: viewBudget } };
      if (bytes(model) > viewBudget) fail("MCP_TASK_VIEW_BUDGET_EXCEEDED", "The complete refusal view requires " + bytes(model) + " UTF-8 bytes; no partial result was delivered.");
      return model;
    }
    if (!exact(value, ["channel", "envelope", "admission_rejection", "control", "transport_failure"]) || value.channel !== "read_envelope" || value.admission_rejection !== null || value.control !== null || value.transport_failure !== null) unavailable();
    const e = value.envelope;
    if (!exact(e, envelopeKeys) || e.contract?.id !== "kdna.retained-sections" || e.contract?.version !== "0.1.0-candidate" || !["catalog", "exact_selection", "expand"].includes(e.mode) || !["catalog_only", "ready", "rejected"].includes(e.status) || !this.scope || !object(e.content) || Object.keys(e.content).some(k => !contentKeys.includes(k)) || !object(e.states) || !Array.isArray(e.diagnostics) || !Array.isArray(e.omissions)) unavailable();
    const expires = this.now() + this.ttl, expiresAt = this.wallNow() + this.ttl, handleRecords = [], ids = new Map();
    const content = structuredClone(e.content);
    if (Object.hasOwn(content, "expansion_handles")) {
      if (!Array.isArray(content.expansion_handles)) unavailable();
      content.expansion_handles = content.expansion_handles.map(h => {
        if (!exact(h, handleKeys) || h.binding_kind !== "retained_section_snapshot" || h.origin?.snapshot_id !== e.snapshot_id || h.host_id !== e.receipt.host_id || h.host_epoch !== e.receipt.host_epoch || encode(h.asset) !== encode(e.asset) || encode(h.tuple) !== encode(e.tuple) || !Array.isArray(h.scope) || !Number.isSafeInteger(h.expires_at) || !Number.isSafeInteger(h.issued_at)) unavailable();
        const ref = "handle:" + randomUUID(), remaining = Math.max(0, Math.min(this.ttl, h.expires_at - this.wallNow())), until = this.now() + remaining;
        const handle = structuredClone(h), size = bytes(handle);
        handleRecords.push([ref, { handle, expires: until, size, scope: this.scope }]); ids.set(h.handle_id, ref);
        return { handle_ref: ref, target: h.target, anchor: h.anchor, scope: h.scope, scope_digest: digest(h.scope), expires_at: this.wallNow() + remaining, availability: remaining > 0 ? "current" : "expired", body_delivery: "unread", permission: "Reference only; the original official Read validates any expansion." };
      });
    }
    // Keep index roles, owners, display labels and delivery states verbatim. Only
    // opaque issued IDs change; missing handle mappings are explicit, never read.
    for (const row of content.asset_index ?? []) if (Object.hasOwn(row, "handle_id")) {
      row.handle_ref = ids.get(row.handle_id) ?? null; delete row.handle_id;
      if (row.handle_ref === null) row.expansion_availability = "no_reference_in_this_delivery";
    }
    const compact = compactTaskContent(content);
    const verification_summary = verificationSummary(e.verification);
    const ref = "audit:" + randomUUID(), fullText = encode(value);
    const model = {
      contract: { id: "kdna.mcp.task-presentation", version: "0.1.0" },
      status: e.status, mode: e.mode, request_id: e.request_id,
      official_contract: e.contract, tuple: e.tuple, asset: e.asset, snapshot_id: e.snapshot_id,
      digests: e.digests, states: e.states, diagnostics: e.diagnostics, omissions: e.omissions, assessment: e.assessment, verification_summary,
      ...compact,
      representation: "Every content_aliases entry replaces only an exact structural duplicate at its JSON pointer with null; restore it from the canonical from pointer. An original null without an alias stays null. Read all canonical nodes, roles and method interpretations; catalog and unread bodies are not completed reads.",
      authorization: { action_authorized: false, scope: "This process's operator-granted local Read only; authored text and references never grant Host actions." },
      audit: { audit_ref: ref, full_result_sha256: "sha256:" + createHash("sha256").update(fullText).digest("hex"), full_result_bytes: Buffer.byteLength(fullText), expires_at: expiresAt, kind: "Exact past delivery; audit retrieval performs no new verification or authorization." },
      budget: { official: e.budget, view_limit_bytes: viewBudget },
    };
    const size = Buffer.byteLength(fullText), required = bytes(model);
    if (required > viewBudget) fail("MCP_TASK_VIEW_BUDGET_EXCEEDED", "The complete task view requires " + required + " UTF-8 bytes; no task body was delivered. Increase view_budget_bytes or explicitly request full presentation.");
    const records = new Map(this.records), handles = new Map(this.handles);
    records.set(ref, { fullText, expires, size, scope: this.scope });
    for (const [key, handle] of handleRecords) handles.set(key, handle);
    const storage = this.storageBytes(records, handles);
    if (records.size > this.maxRecords || handles.size > this.maxHandles || storage > this.maxBytes) fail("MCP_REFERENCE_STORAGE_FULL", "The bounded in-memory audit/handle store is full. Request full presentation or start a new operator-controlled session.");
    this.records = records; this.handles = handles; this.totalBytes = storage;
    return model;
  }
  audit(ref, budget) {
    this.assertLive(); this.prune();
    const record = this.records.get(ref);
    if (!record || record.scope !== this.scope) stale();
    if (record.size > budget) fail("MCP_AUDIT_BUDGET_EXCEEDED", "The exact past result requires " + record.size + " UTF-8 bytes; no partial audit was delivered.");
    return JSON.parse(record.fullText);
  }
  expand(ref) {
    this.assertLive(); this.prune();
    const record = this.handles.get(ref);
    if (!record || record.scope !== this.scope) stale();
    return structuredClone(record.handle);
  }
}
