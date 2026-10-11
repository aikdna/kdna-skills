import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const moduleUrl = process.env.KDNA_MCP_TEST_SERVER
  ? pathToFileURL(path.resolve(path.dirname(process.env.KDNA_MCP_TEST_SERVER), "task-content.mjs"))
  : new URL("../bin/task-content.mjs", import.meta.url);
const { compactTaskContent, reconstructTaskContent } = await import(moduleUrl);
const clone = value => structuredClone(value);
const node = (id, role, value, owner = null) => ({ id, role, target: { kind: role, id }, owner: { kind: owner === null ? "asset" : "judgment", id: owner ?? "synthetic:asset" }, owner_judgment_id: owner, value });

function richContent() {
  const asset = node("node:asset", "asset_declaration", { asset_id: "synthetic:asset", version: "1.0.0", scope: { statement: "Synthetic local task only." }, declarations: { authorship: "claimed" }, future_metadata: { state: "unknown", value: null } });
  const actor = node("node:actor", "actor", { id: "synthetic:agent", kind: "agent", name: "Synthetic test author" });
  const closure = [asset, actor], catalog = [], selected = [], references = [];
  for (let i = 0; i < 3; i++) {
    const id = "synthetic:j:" + i;
    const component = { id: "synthetic:component:" + i, method: { term: "feeling" }, role: "个人感受", statement: "A synthetic declared preference.", material_refs: [] };
    const method = { method: { term: "feeling" }, components: [component], bindings: [] };
    const contract = { id: "synthetic:contract:" + i, shape: { kind: "scalar", scalar_type: "text" }, minimum: 1, maximum: 1 };
    const result = { contract_ref: contract.id, result_type: { term: "text" }, value: { kind: "text", value: "Equal prose has distinct semantic roles." } };
    const value = {
      id, focus: "Synthetic issue " + i, subject: { actor_ids: [actor.value.id] }, scope: { statement: "Synthetic local task only." },
      core_expression: { kind: "authored", statement: result.value.value, qualification_refs: ["synthetic:boundary"] },
      method, result_contract: contract, result,
      boundaries: { state: "provided", value: [{ id: "synthetic:boundary", effect: "limit", statement: "Only with current read consent." }] },
      exceptions: { state: "provided", value: [{ when: "synthetic:condition", effect: "defer", statement: "Do not act while the decision is unresolved." }] },
      misuse: { state: "provided", value: [{ statement: "Reading is not approval to spend or publish." }] },
      conditions: [{ id: "synthetic:condition", state: "unresolved", value: null }],
      material_refs: [], reason_refs: [], sources: [{ state: "unverified", evidence_ref: null }],
      ports: [{ direction: i ? "output" : "input", contract_ref: contract.id }], inputs: [], extensions: [],
      future_authored_field: { "$ref": "literal author content", at: "/literal", from: "/also-literal", empty: [], absent_state: "absent", explicit: null, values: [false, 0, "", "条件/例外~"] },
    };
    const judgment = node("node:judgment:" + i, "judgment", value, id);
    judgment.method_interpretation = {
      declaration: clone(method), declaration_presence: { components_state: "declared", bindings_state: "declared" },
      component_interpretations: [{ component_ref: component.id, status: i === 0 ? "undeclared" : "unresolved", body: i === 0 ? null : { statement: "Interpretation is not the declaration.", conflict: true } }],
    };
    const contractNode = node("node:contract:" + i, "result_contract", clone(contract), id);
    const resultNode = node("node:result:" + i, "result", clone(result), id);
    const componentNode = node("node:component:" + i, "method_component", clone(component), id);
    closure.push(judgment, contractNode, resultNode, componentNode);
    catalog.push({ judgment_id: id, focus: value.focus, node_ref: judgment.id, parent_ref: null });
    selected.push(id);
    for (const target of [contractNode, resultNode, componentNode]) references.push({ id: "edge:" + target.id, source_node: judgment.id, target_node: target.id, role: "mandatory_support", mandatory: true });
  }
  const boundary = node("node:boundary", "boundary", { id: "synthetic:boundary", statement: "Only with current read consent." });
  closure.push(boundary);
  references.push({ id: "edge:boundary", source_node: "node:judgment:0", target_node: boundary.id, role: "mandatory_support", mandatory: true });
  return {
    declarations: [clone(asset)], catalog, selected, closure, references,
    relationships: [{ id: "synthetic:relation", source: selected[0], target: selected[1], direction: "source_to_target", kind: "qualifies" }],
    missing: [{ target: "synthetic:unresolved", state: "unresolved", reason: null }],
    provenance: { declarations: [clone(actor)], confirmation: "claimed_unverified", verifier_id: null, evidence_ref: null },
    asset_capability: "asserted_answers",
    asset_index: [{ target: { kind: "dependency", id: "synthetic:optional" }, owner: { kind: "asset", id: "synthetic:asset" }, body_delivery: "deferred", node_ref: "node:optional", handle_ref: "opaque:test-handle" }],
    expansion_handles: [{ handle_ref: "opaque:test-handle", expires_at: 12345 }],
    future_content_field: { "$ref": "still literal", "a/b~c": { value: null } },
  };
}

test("finite aliases restore rich mandatory semantics without any audit", () => {
  const original = richContent(), before = clone(original);
  const represented = compactTaskContent(original);
  assert.deepEqual(original, before, "compression does not mutate official content");
  assert.equal(represented.content_aliases.length, 14);
  assert.ok(represented.content_aliases.every(alias => Object.keys(alias).join(",") === "at,from,node_id,role"));
  const restored = reconstructTaskContent({ content: represented.content, content_aliases: [...represented.content_aliases].reverse() });
  assert.deepEqual(restored, original, "dependency order is independent of alias array order");
  const first = restored.closure[2];
  assert.equal(first.value.boundaries.value[0].statement, "Only with current read consent.");
  assert.equal(first.value.exceptions.value[0].statement, "Do not act while the decision is unresolved.");
  assert.equal(first.value.conditions[0].state, "unresolved");
  assert.equal(first.value.misuse.value[0].statement, "Reading is not approval to spend or publish.");
  assert.equal(first.value.sources[0].state, "unverified");
  assert.equal(first.method_interpretation.declaration_presence.components_state, "declared");
  assert.equal(first.method_interpretation.component_interpretations[0].status, "undeclared");
  assert.equal(first.method_interpretation.component_interpretations[0].body, null);
  assert.equal(restored.provenance.confirmation, "claimed_unverified");
  assert.equal(restored.relationships[0].direction, "source_to_target");
  const ids = new Set(restored.closure.map(entry => entry.id));
  assert.ok(restored.references.filter(entry => entry.mandatory).every(entry => ids.has(entry.source_node) && ids.has(entry.target_node)));
});

test("canonical node identities/values and literal unknown authored content stay independent", () => {
  const original = richContent(), represented = compactTaskContent(original);
  for (const [index, entry] of original.closure.entries()) {
    if (["result", "result_contract", "method_component"].includes(entry.role)) assert.deepEqual(represented.content.closure[index], entry);
  }
  const authored = represented.content.closure[2].value;
  assert.equal(authored.core_expression.statement, "Equal prose has distinct semantic roles.");
  assert.deepEqual(authored.future_authored_field, original.closure[2].value.future_authored_field);
  assert.deepEqual(represented.content.future_content_field, original.future_content_field);
  assert.deepEqual(represented.content.expansion_handles, original.expansion_handles);
  assert.deepEqual(represented.content.asset_index, original.asset_index);
  assert.ok(represented.content_aliases.every(alias => !alias.at.includes("future_") && !alias.at.includes("core_expression")));
  represented.content.future_content_field["a/b~c"].value = "edited clone";
  assert.equal(original.future_content_field["a/b~c"].value, null);
});

test("same prose, differing complete declarations and extra fields never alias", () => {
  const original = richContent();
  original.declarations[0].value.future_metadata.extra = false;
  original.provenance.declarations[0].owner.id = "synthetic:another-owner";
  const judgment = original.closure[2];
  judgment.value.result_contract.maximum = 2;
  judgment.value.result.value.unresolved = true;
  judgment.value.method.components[0].statement = "A distinct declared method despite the same result prose.";
  judgment.method_interpretation.declaration.extra = { state: "unknown", value: null };
  const represented = compactTaskContent(original);
  for (const at of ["/declarations/0", "/provenance/declarations/0", "/closure/2/value/result_contract", "/closure/2/value/result", "/closure/2/value/method/components/0", "/closure/2/method_interpretation/declaration"]) assert.ok(!represented.content_aliases.some(alias => alias.at === at), at);
  assert.deepEqual(reconstructTaskContent(represented), original);
  assert.equal(represented.content.closure[2].value.result.value.value, represented.content.closure[6].value.core_expression.statement);
});

test("explicit null, missing fields, empty structures, array order and JSON types persist", () => {
  const original = richContent();
  original.closure[2].value.result = null;
  original.closure[2].value.boundaries = { state: "none", value: null };
  original.closure[2].value.exceptions = { state: "absent" };
  original.closure[2].value.method.components = [null];
  original.closure[2].method_interpretation.declaration = null;
  original.closure[6].value.method.components[0].material_refs = ["b", "a"];
  original.closure[9].value.material_refs = ["a", "b"];
  const represented = compactTaskContent(original), restored = reconstructTaskContent(represented);
  assert.deepEqual(restored, original);
  assert.ok(!represented.content_aliases.some(alias => alias.at.startsWith("/closure/2/value/result") && alias.at !== "/closure/2/value/result_contract"));
  assert.ok(!represented.content_aliases.some(alias => alias.at === "/closure/2/method_interpretation/declaration"));
  assert.equal(restored.closure[2].value.boundaries.value, null);
  assert.equal(Object.hasOwn(restored.closure[2].value.exceptions, "value"), false);
  assert.deepEqual(restored.closure[2].value.extensions, []);
  assert.deepEqual(restored.closure[2].value.future_authored_field.values, [false, 0, "", "条件/例外~"]);
  assert.ok(!represented.content_aliases.some(alias => alias.at === "/closure/6/value/method/components/0"));
});

test("catalog and unknown-only content pass through as independent JSON copies", () => {
  for (const original of [{ catalog: [{ judgment_id: "synthetic:j", parent_ref: null }], asset_index: [] }, { closure: [], unknown: { "$ref": "/literal", values: [null, {}, []] } }]) {
    const represented = compactTaskContent(original);
    assert.deepEqual(represented, { content: original, content_aliases: [] });
    assert.notEqual(represented.content, original);
    assert.deepEqual(reconstructTaskContent(represented), original);
  }
});

test("reconstruction refuses malformed aliases, inherited paths, identity changes and overlap", () => {
  const good = compactTaskContent(richContent());
  const bad = mutate => { const value = clone(good); mutate(value); assert.throws(() => reconstructTaskContent(value), /Invalid task content aliases/); };
  bad(value => { value.content_aliases[0].extra = true; });
  bad(value => { value.content_aliases[0].from = "/closure/999"; });
  bad(value => { value.content_aliases[0].from = "/closure/00"; });
  bad(value => { value.content_aliases[0].from = "/closure/~2"; });
  bad(value => { value.content_aliases[0].at = "/__proto__/polluted"; });
  bad(value => { value.content_aliases[0].role = "result"; });
  bad(value => { value.content_aliases[0].node_id = "forged"; });
  bad(value => { value.content.declarations[0] = {}; });
  bad(value => { value.content_aliases.push(clone(value.content_aliases[0])); });
  bad(value => { value.content_aliases[2].from = value.content_aliases[2].at; });
  bad(value => { value.content_aliases[2].at = "/closure/2/value/boundaries"; value.content.closure[2].value.boundaries = null; });
  assert.equal(Object.hasOwn(Object.prototype, "polluted"), false);
});
