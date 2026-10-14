import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { makeCanonicalTempRoot } from "./support/canonical-temp-root.mjs";
import { pathToFileURL } from "node:url";

const root = path.resolve(".");
const server = process.env.KDNA_MCP_TEST_SERVER || path.join(root, "bin/kdna-mcp.mjs");
const cli = process.env.KDNA_MCP_TEST_CLI || path.join(root, "node_modules/@aikdna/kdna-cli/src/cli.js");
const fixtures = process.env.KDNA_PUBLIC_FIXTURES || path.join(root, "test/fixtures/public-read-native");
assert.ok(fixtures, "KDNA_PUBLIC_FIXTURES must name the fixed public corpus");
const recordRoot = process.env.KDNA_MCP_TEST_RECORD_ROOT ? path.join(process.env.KDNA_MCP_TEST_RECORD_ROOT, "stdio", process.env.KDNA_TEST_PHASE || "source") : null;
if (recordRoot) fs.mkdirSync(recordRoot, { recursive: true, mode: 0o700 });
const init = { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "local-stdio-verifier", version: "1.0.0" } };
const budget = { budget_bytes: 1000000 };
const toolNames = JSON.parse(fs.readFileSync(path.join(root,"../docs/agent-support-matrix.json"),"utf8")).tool_surface;
const decoded = response => { assert.ok(!response.error, JSON.stringify(response)); return JSON.parse(response.result.content[0].text); };
const ready = response => { const value = decoded(response); assert.notEqual(response.result.isError, true, JSON.stringify(value)); assert.equal(value.envelope?.status, value.envelope?.mode === "catalog" ? "catalog_only" : "ready"); return value.envelope; };
// The default presentation of the installed Read is the projected body view:
// authored content plus one fingerprint that names the full-view recovery.
const bodyView = response => {
  const value = decoded(response); assert.notEqual(response.result.isError, true, JSON.stringify(value));
  assert.equal(value.view_contract, "kdna.read.model-view/0.2.0");
  assert.equal(value.view, "body");
  assert.equal(value.status, value.fingerprint?.recovery?.mode === "catalog" ? "catalog_only" : "ready");
  assert.equal(value.fingerprint?.recovery?.view, "full");
  return value;
};

function launch(t, options = {}) {
  const temporary = makeCanonicalTempRoot("agent-stdio-case-");
  const tmp = path.join(temporary, "tmp"); fs.mkdirSync(tmp, { mode: 0o700 });
  const selected = path.join(temporary, "selected.kdna");
  if (options.fixture) fs.copyFileSync(path.join(fixtures, options.fixture), selected);
  const argv = [server, ...(options.argv ?? (options.fixture ? ["--asset", selected, "--allow-read"] : []))];
  const environment = { ...process.env, TMPDIR: tmp, ...(options.env || {}) };
  const started = new Date().toISOString();
  const child = spawn(process.execPath, argv, { cwd: root, env: environment, stdio: ["pipe", "pipe", "pipe"] });
  const inputParts = [];
  let stdout = "", stderr = "", pendingText = "", counter = 0, final = null;
  const waiting = new Map(), received = [];
  const exited = new Promise(resolve => child.once("close", (code, signal) => {
    final = { code, signal, at: new Date().toISOString() };
    for (const waiter of waiting.values()) { clearTimeout(waiter.timer); waiter.reject(new Error("MCP exited before response: " + stderr)); }
    waiting.clear(); resolve(final);
  }));
  child.stdin.on("error", () => undefined);
  child.stderr.setEncoding("utf8"); child.stderr.on("data", chunk => { stderr += chunk; });
  child.stdout.setEncoding("utf8"); child.stdout.on("data", chunk => {
    stdout += chunk; pendingText += chunk;
    let newline;
    while ((newline = pendingText.indexOf("\n")) !== -1) {
      const line = pendingText.slice(0, newline); pendingText = pendingText.slice(newline + 1);
      const response = JSON.parse(line); received.push(response);
      const waiter = waiting.get(response.id);
      if (waiter) { waiting.delete(response.id); clearTimeout(waiter.timer); waiter.resolve(response); }
    }
  });
  function send(message) {
    const id = message.id ?? ++counter; message = { ...message, id };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { waiting.delete(id); reject(new Error("MCP response timeout: " + stderr)); }, 8000);
      waiting.set(id, { resolve, reject, timer });
      const line = JSON.stringify(message) + "\n"; inputParts.push(Buffer.from(line)); child.stdin.write(line);
    });
  }
  const api = {
    child, selected, tmp, received, exited,
    rpc: (method, params = {}) => send({ jsonrpc: "2.0", method, params }),
    call: (name, args = {}) => send({ jsonrpc: "2.0", method: "tools/call", params: { name, arguments: args } }),
    notify(method, params = {}) { const line = JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n"; inputParts.push(Buffer.from(line)); child.stdin.write(line); },
    raw(bytes) { inputParts.push(Buffer.isBuffer(bytes) ? Buffer.from(bytes) : Buffer.from(bytes)); child.stdin.write(bytes); },
    async initialize(extra = {}) { const response = await this.rpc("initialize", { ...init, ...extra }); assert.equal(response.result?.protocolVersion, "2024-11-05", JSON.stringify(response)); this.notify("notifications/initialized"); },
    async close(expected = 0) {
      if (!final) child.stdin.end();
      const timer = setTimeout(() => child.kill("SIGKILL"), 5000);
      const exit = await exited; clearTimeout(timer);
      if (expected !== null) assert.equal(exit.code, expected, stderr);
      assert.deepEqual(fs.readdirSync(tmp), [], "private binding snapshots must be cleaned up");
      return exit;
    },
  };
  t.after(async () => {
    try { await api.close(null); } finally {
      if (recordRoot) {
        const prefix = path.join(recordRoot, randomUUID());
        fs.writeFileSync(prefix + ".stdin", Buffer.concat(inputParts));
        fs.writeFileSync(prefix + ".stdout", stdout);
        fs.writeFileSync(prefix + ".stderr", stderr);
        fs.writeFileSync(prefix + ".json", JSON.stringify({ started, completed: final, pid: child.pid, argv: [process.execPath, ...argv], cwd: root, node: process.version, temporary, received: received.length }, null, 2) + "\n");
      }
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  });
  return api;
}
function cliReferenceResult(fixture, selection, view) {
  const argv = [cli, "read", path.join(fixtures, fixture), "--mode", selection ? "exact_selection" : "catalog", "--budget", "1000000", "--allow-read", ...(view ? ["--view", view] : [])];
  if (selection) argv.push("--asset-id", selection.asset_id, "--asset-version", selection.asset_version, "--judgment-id", selection.judgment_id);
  const started = new Date().toISOString();
  const response = spawnSync(process.execPath, argv, { encoding: "utf8", env: process.env, timeout: 30000 });
  if (recordRoot) {
    const prefix=path.join(recordRoot,"cli-reference-"+randomUUID());
    fs.writeFileSync(prefix+".stdout",response.stdout ?? "");
    fs.writeFileSync(prefix+".stderr",response.stderr ?? "");
    fs.writeFileSync(prefix+".json",JSON.stringify({started,completed:new Date().toISOString(),pid:response.pid,argv:[process.execPath,...argv],cwd:process.cwd(),node:process.version,status:response.status,signal:response.signal,error:response.error?.message},null,2)+"\n");
  }
  assert.equal(response.status, 0, response.stderr || response.stdout);
  return JSON.parse(response.stdout);
}
// The enveloped comparison reference: envelope fields asserted field by field.
function reference(fixture, selection = null) { return cliReferenceResult(fixture, selection, "raw").envelope; }
// The default-surface comparison reference: exactly what this CLI prints for a
// read with no view flag, which is the surface the adapter must deliver.
function bodyReference(fixture, selection = null) { return cliReferenceResult(fixture, selection, null); }
function absent(pid) { assert.throws(() => process.kill(pid, 0), error => error.code === "ESRCH"); }

test("unbound initialization, exact declared tool list and no parameter-created authority", async t => {
  const s = launch(t);
  assert.equal((await s.rpc("tools/list")).error.code, -32002);
  await s.initialize({ asset: path.join(fixtures, "graph-cross.kdna"), allow_read: true, binding: { approved: true } });
  const list = await s.rpc("tools/list"); assert.deepEqual(list.result.tools.map(tool => tool.name), toolNames);
  assert.ok(list.result.tools.every(tool => !JSON.stringify(tool.inputSchema).includes('"path"')));
  assert.equal(decoded(await s.call("kdna.binding-status")).state, "unbound");
  for (const [name, args] of [["kdna.inspect", {}], ["kdna.catalog", budget], ["kdna.read", { ...budget, selection: { asset_id: "asset:bytes", asset_version: "1.0.0", judgment_id: "j:0" } }], ["kdna.expand", { ...budget, handle: {} }]]) {
    const response = await s.call(name, args); assert.equal(response.result.isError, true); assert.equal(decoded(response).code, "MCP_BINDING_REQUIRED");
  }
  for (const args of [{ ...budget, path: path.join(fixtures, "graph-cross.kdna") }, { ...budget, allow_read: true }, { ...budget, approved: true }, { ...budget, cwd: fixtures }]) assert.equal((await s.call("kdna.catalog", args)).error.code, -32602);
  assert.equal((await s.rpc("initialize", init)).error.code, -32600);
  assert.equal(decoded(await s.call("kdna.binding-status")).state, "unbound");
  await s.close();
});

test("initialize negotiates only the supported protocol without enabling unoffered capabilities", async t => {
  for (const protocolVersion of ["2024-11-05", "2025-06-18"]) await t.test(protocolVersion, async t => {
    const s = launch(t);
    s.notify("notifications/initialized");
    assert.equal((await s.rpc("tools/list")).error.code, -32002);
    const response = await s.rpc("initialize", {
      protocolVersion,
      capabilities: { experimental: {}, elicitation: {} },
      clientInfo: { name: "example-mcp-client", title: "Example Client", version: "1.0.0" },
    });
    assert.equal(response.result?.protocolVersion, "2024-11-05", JSON.stringify(response));
    assert.deepEqual(response.result.capabilities, { tools: {} });
    assert.equal((await s.rpc("tools/list")).error.code, -32002);
    s.notify("notifications/initialized");
    assert.deepEqual((await s.rpc("tools/list")).result.tools.map(tool => tool.name), toolNames);
    assert.equal(decoded(await s.call("kdna.binding-status")).state, "unbound");
    assert.equal(decoded(await s.call("kdna.catalog", budget)).code, "MCP_BINDING_REQUIRED");
    assert.equal((await s.rpc("initialize", init)).error.code, -32600);
    await s.close();
  });
});

test("malformed initialization cannot establish transport readiness or consume initialization", async t => {
  const s = launch(t);
  const invalid = [
    {}, { ...init, protocolVersion: undefined }, { ...init, protocolVersion: null },
    { ...init, protocolVersion: 20241105 }, { ...init, protocolVersion: [] },
    { ...init, protocolVersion: "" }, { ...init, capabilities: undefined },
    { ...init, capabilities: null }, { ...init, capabilities: [] },
    { ...init, clientInfo: undefined }, { ...init, clientInfo: null },
    { ...init, clientInfo: [] }, { ...init, clientInfo: {} },
    { ...init, clientInfo: { name: "example-client" } },
    { ...init, clientInfo: { version: "1.0.0" } },
    { ...init, clientInfo: { name: 1, version: "1.0.0" } },
    { ...init, clientInfo: { name: "example-client", version: null } },
  ];
  for (const params of invalid) {
    assert.equal((await s.rpc("initialize", params)).error?.code, -32602, JSON.stringify(params));
    s.notify("notifications/initialized");
    assert.equal((await s.rpc("tools/list")).error.code, -32002);
  }
  await s.initialize();
  assert.deepEqual((await s.rpc("tools/list")).result.tools.map(tool => tool.name), toolNames);
  await s.close();
});

test("request metadata is transport-only across initialize, ping, tool discovery and calls", async t => {
  const s = launch(t);
  assert.equal((await s.rpc("initialize", { ...init, protocolVersion: "2025-06-18", _meta: { progressToken: 0 } })).result?.protocolVersion, "2024-11-05");
  assert.equal((await s.rpc("tools/list", { _meta: { progressToken: 0 } })).error.code, -32002);
  s.notify("notifications/initialized");
  for (const _meta of [{}, { progressToken: 0 }, { progressToken: 1.5 }, { progressToken: "request-token" }, { "example.com/trace": "opaque", asset: "/unselected.kdna", allow_read: true }]) {
    assert.deepEqual((await s.rpc("tools/list", { _meta })).result?.tools.map(tool => tool.name), toolNames);
    assert.deepEqual((await s.rpc("ping", { _meta })).result, {});
    const response = await s.rpc("tools/call", { name: "kdna.binding-status", arguments: {}, _meta });
    assert.equal(decoded(response).state, "unbound");
    assert.equal(decoded(await s.rpc("tools/call", { name: "kdna.catalog", arguments: budget, _meta })).code, "MCP_BINDING_REQUIRED");
  }
  for (const method of ["ping", "tools/list"]) assert.equal((await s.rpc(method, { _meta: { progressToken: 0 }, approved: true })).error.code, -32602);
  assert.equal((await s.rpc("tools/call", { name: "kdna.binding-status", arguments: {}, _meta: {}, path: "/unselected.kdna" })).error.code, -32602);
  for (const argumentsValue of [{ _meta: {} }, { path: "/unselected.kdna" }, { cwd: "/" }, { approved: true }, { allow_read: true }]) {
    assert.equal((await s.rpc("tools/call", { name: "kdna.binding-status", arguments: argumentsValue, _meta: { progressToken: 0 } })).error.code, -32602);
  }
  await s.close();
});

test("malformed request metadata fails before initialization and on every ready request", async t => {
  const s = launch(t);
  const invalid = [null, [], "metadata", false, 0, { progressToken: null }, { progressToken: true }, { progressToken: {} }, { progressToken: [] }];
  for (const _meta of invalid) assert.equal((await s.rpc("initialize", { ...init, _meta })).error?.code, -32602);
  await s.initialize();
  for (const _meta of invalid) {
    for (const method of ["ping", "tools/list"]) assert.equal((await s.rpc(method, { _meta })).error?.code, -32602);
    assert.equal((await s.rpc("tools/call", { name: "kdna.binding-status", arguments: {}, _meta })).error?.code, -32602);
  }
  assert.equal(decoded(await s.call("kdna.binding-status")).state, "unbound");
  await s.close();
});

test("metadata leaves bound public Read and cancellation semantics unchanged", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize({ protocolVersion: "2025-06-18" });
  const catalog = bodyView(await s.rpc("tools/call", { name: "kdna.catalog", arguments: budget, _meta: { progressToken: 0 } }));
  assert.deepEqual(catalog.content, bodyReference("graph-cross.kdna").content);
  const selection = { asset_id: catalog.fingerprint.asset.asset_id, asset_version: catalog.fingerprint.asset.asset_version, judgment_id: catalog.content.catalog[0].judgment_id };
  const selected = bodyView(await s.rpc("tools/call", { name: "kdna.read", arguments: { ...budget, selection }, _meta: { progressToken: "read" } }));
  const expected = reference("graph-cross.kdna", selection);
  for (const field of ["declarations", "catalog", "selected", "closure", "references", "relationships", "missing", "provenance"]) assert.deepEqual(selected.content[field], expected.content[field]);
  assert.equal(selected.fingerprint.snapshot_id, catalog.fingerprint.snapshot_id);
  // Expansion handles are audit machinery the default view omits; the
  // fingerprint names that omission and the explicit full surface still
  // carries them in the same session.
  assert.ok(selected.fingerprint.omitted.content.includes("expansion_handles"));
  const selectedFull = ready(await s.rpc("tools/call", { name: "kdna.read", arguments: { ...budget, selection, presentation: "full" }, _meta: { progressToken: "read" } }));
  for (const field of ["declarations", "catalog", "selected", "closure", "references", "relationships", "missing", "provenance"]) assert.deepEqual(selectedFull.content[field], expected.content[field]);
  const expanded = bodyView(await s.rpc("tools/call", { name: "kdna.expand", arguments: { ...budget, handle: selectedFull.content.expansion_handles[0] }, _meta: { progressToken: 0 } }));
  assert.equal(expanded.fingerprint.snapshot_id, selected.fingerprint.snapshot_id);
  const inspection = decoded(await s.rpc("tools/call", { name: "kdna.inspect", arguments: {}, _meta: {} }));
  assert.equal(inspection.status, "accepted"); assert.equal(inspection.states.action_authorization, "not_evaluated");
  assert.equal(decoded(await s.rpc("tools/call", { name: "kdna.cancel", arguments: {}, _meta: {} })).binding_closed, true);
  assert.equal(decoded(await s.call("kdna.catalog", budget)).code, "MCP_BINDING_CANCELLED");
  await s.close();
});

test("the default presentation is the official projected body view with full recovery", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const catalog = bodyView(await s.call("kdna.catalog", budget));
  assert.deepEqual(catalog.content, bodyReference("graph-cross.kdna").content, "the default catalog is exactly what the CLI prints with no view flag");
  const selection = { asset_id: catalog.fingerprint.asset.asset_id, asset_version: catalog.fingerprint.asset.asset_version, judgment_id: catalog.content.catalog[0].judgment_id };
  const selected = bodyView(await s.call("kdna.read", { ...budget, selection }));
  assert.deepEqual(selected.content, bodyReference("graph-cross.kdna", selection).content);
  assert.equal(selected.fingerprint.snapshot_id, catalog.fingerprint.snapshot_id);
  const explicitBody = bodyView(await s.call("kdna.catalog", { ...budget, presentation: "body" }));
  assert.deepEqual(explicitBody.content, catalog.content);
  assert.equal(explicitBody.fingerprint.snapshot_id, catalog.fingerprint.snapshot_id);
  const enveloped = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" }));
  assert.deepEqual(enveloped.content.catalog, catalog.content.catalog);
  // No second copy of the full object travels beside the projected one: the
  // single text channel is the body view, measurably smaller than the envelope.
  assert.ok(JSON.stringify(catalog).length < JSON.stringify(enveloped).length);
  for (const key of ["channel", "envelope", "contract", "receipt", "verification", "digests"]) assert.equal(Object.hasOwn(catalog, key), false, key);
  const status = decoded(await s.call("kdna.binding-status"));
  assert.equal(status.presentation_default, "body");
  assert.equal(status.body_view_contract, "kdna.read.model-view/0.2.0");
  await s.close();
});
test("the projected default carries the official reduced members and their handle ids", async t => {
  // A selection whose closure holds a non-selected judgment must deliver the
  // 0.2.0 reduction verbatim: focus, core expression and the six markers stay,
  // the body is deferred, and the entry names the official handle it expands
  // through. The identical official CLI default is the comparison reference.
  const s = launch(t, { fixture: "graph-dedup-support.kdna" }); await s.initialize();
  const catalog = bodyView(await s.call("kdna.catalog", budget));
  const selection = { asset_id: catalog.fingerprint.asset.asset_id, asset_version: catalog.fingerprint.asset.asset_version, judgment_id: catalog.content.catalog[0].judgment_id };
  const selected = bodyView(await s.call("kdna.read", { ...budget, selection }));
  const reduced = selected.content.closure.filter(entry => entry.state === "reduced");
  assert.ok(reduced.length > 0, "this fixture closes over a non-selected member");
  for (const entry of reduced) {
    assert.equal(entry.role, "judgment");
    assert.equal(entry.body_delivery, "deferred");
    assert.equal(typeof entry.handle_id, "string");
    assert.ok(entry.handle_id.startsWith("retained-handle:"));
    assert.deepEqual(Object.keys(entry.value.markers).sort(), ["answer_kind", "boundaries", "exceptions", "form", "method_term", "undecided"]);
  }
  // Each delivery mints its own handle identifiers, exactly like the CLI's own
  // runs do; everything else in the reduced surface must match the official
  // default byte for byte, so only the minted identifier is normalized away.
  const normalize = value => JSON.parse(JSON.stringify(value).replace(/"retained-handle:[0-9a-f-]{36}"/gu, '"retained-handle:<minted>"'));
  assert.deepEqual(normalize(selected.content), normalize(bodyReference("graph-dedup-support.kdna", selection).content), "the reduced surface is exactly what the official CLI prints");
  await s.close();
});

test("operator-selected path without allow-read neither binds nor opens a nonexistent file", async t => {
  const s = launch(t, { argv: ["--asset", "/definitely-not-selected-or-readable.kdna"] });
  await s.initialize();
  assert.equal(decoded(await s.call("kdna.binding-status")).state, "unbound");
  assert.equal(decoded(await s.call("kdna.catalog", budget)).code, "MCP_BINDING_REQUIRED");
});

test("adapter rejects malformed selection/budget and all old arbitrary-path tools", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  for (const value of [-1, 1.5, "100", null, 1000001]) assert.equal((await s.call("kdna.catalog", { budget_bytes: value })).error.code, -32602);
  for (const selection of [null, {}, { asset_id: "a", asset_version: "b", judgment_id: "c", approved: true }]) assert.equal((await s.call("kdna.read", { ...budget, selection })).error.code, -32602);
  for (const name of ["kdna.workspace-load", "kdna.workspace-status", "kdna.load", "kdna.discover"]) assert.equal((await s.call(name, { path: s.selected })).error.code, -32602);
  assert.equal((await s.rpc("tools/list", null)).error.code, -32602);
});

for (const fixture of ["graph-cross.kdna", "graph-same.kdna", "graph-method.kdna", "graph-asset.kdna", "graph-null.kdna", "graph-dedup-support.kdna"]) {
  test("official catalog and every canonical selection/mandatory closure stay exact: " + fixture, async t => {
    const s = launch(t, { fixture }); await s.initialize();
    // This matrix asserts the enveloped surface field by field, so every read
    // asks for it explicitly; the projected default is covered separately.
    const catalog = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" }));
    assert.deepEqual(catalog.content, reference(fixture).content);
    let last;
    for (const item of catalog.content.catalog) {
      const selection = { asset_id: catalog.asset.asset_id, asset_version: catalog.asset.asset_version, judgment_id: item.judgment_id };
      last = ready(await s.call("kdna.read", { ...budget, selection, presentation: "full" }));
      const expected = reference(fixture, selection);
      for (const field of ["declarations", "catalog", "selected", "closure", "references", "relationships", "missing", "provenance"]) assert.deepEqual(last.content[field], expected.content[field]);
      assert.equal(last.snapshot_id, catalog.snapshot_id); assert.equal(last.receipt.host_epoch, catalog.receipt.host_epoch);
      const ids = new Set(last.content.closure.map(node => node.id));
      for (const ref of last.content.references.filter(ref => ref.mandatory)) assert.ok(ids.has(ref.target_node), ref.target_node);
      assert.deepEqual(last.states, expected.states);
      assert.equal(last.states.writer, "not_evaluated");
      assert.ok(["not_evaluated", "claimed_unverified"].includes(last.states.confirmation));
      assert.equal(last.states.action_authorization, "not_evaluated");
    }
    assert.deepEqual(ready(await s.call("kdna.catalog", { ...budget, presentation: "full" })).content.catalog, catalog.content.catalog);
    const pid = Number(last.receipt.host_epoch.split(":")[1]); await s.close(); absent(pid);
  });
}

test("issued handles expand only in the original official CLI process", async t => {
  const first = launch(t, { fixture: "graph-cross.kdna" }); await first.initialize();
  const catalog = ready(await first.call("kdna.catalog", { ...budget, presentation: "full" }));
  const selection = { asset_id: catalog.asset.asset_id, asset_version: catalog.asset.asset_version, judgment_id: catalog.content.catalog[0].judgment_id };
  const selected = ready(await first.call("kdna.read", { ...budget, selection, presentation: "full" }));
  assert.ok(selected.content.expansion_handles.length > 0);
  const handle = selected.content.expansion_handles[0];
  const expanded = ready(await first.call("kdna.expand", { ...budget, handle, presentation: "full" }));
  assert.equal(expanded.snapshot_id, selected.snapshot_id); assert.ok(expanded.content.closure.some(node => node.role === handle.target.kind && node.value.id === handle.target.id));
  const second = launch(t, { fixture: "graph-cross.kdna" }); await second.initialize(); ready(await second.call("kdna.catalog", { ...budget, presentation: "full" }));
  const foreign = await second.call("kdna.expand", { ...budget, handle });
  assert.equal(foreign.result.isError, true); assert.equal(decoded(foreign).diagnostic.code, "READ_HANDLE_STALE"); assert.equal(decoded(foreign).body, null);
  const tampered = await first.call("kdna.expand", { ...budget, handle: { ...handle, A: "sha256:" + "0".repeat(64) } });
  assert.equal(tampered.result.isError, true);
  assert.equal(ready(await first.call("kdna.catalog", { ...budget, presentation: "full" })).snapshot_id, selected.snapshot_id);
});

test("startup bytes remain fixed across original-file replacement; restart creates a new snapshot", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const before = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" }));
  fs.writeFileSync(s.selected, "corrupted after operator binding");
  const after = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" }));
  assert.equal(after.snapshot_id, before.snapshot_id); assert.deepEqual(after.digests, before.digests); assert.deepEqual(after.content, before.content);
  await s.close();
  const fresh = launch(t, { fixture: "graph-cross.kdna" }); await fresh.initialize();
  assert.notEqual(ready(await fresh.call("kdna.catalog", { ...budget, presentation: "full" })).snapshot_id, before.snapshot_id);
});

test("public rejection and no-body budget results remain explicit without invented content", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const none = await s.call("kdna.catalog", { budget_bytes: 0 }); assert.equal(none.result.isError, true); assert.notEqual(decoded(none).envelope?.status, "ready");
  const catalog = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" }));
  const bad = await s.call("kdna.read", { ...budget, selection: { asset_id: catalog.asset.asset_id, asset_version: catalog.asset.asset_version, judgment_id: "j:not-present" } });
  assert.equal(bad.result.isError, true); assert.equal(decoded(bad).body, null); assert.equal(decoded(bad).body_bytes, 0); assert.equal(decoded(bad).status, "rejected"); assert.equal(decoded(bad).diagnostic.code, "READ_SELECTION_NOT_FOUND");
  const corrupt = launch(t, { fixture: "hostile-native-truncated.kdna" }); await corrupt.initialize();
  const refused = await corrupt.call("kdna.catalog", budget); assert.equal(refused.result.isError, true); assert.notEqual(decoded(refused).envelope?.status, "ready");
  const inspected = decoded(await corrupt.call("kdna.inspect")); assert.equal(inspected.status, "rejected");
});

test("task presentation preserves the official native admission rejection of damaged input", async t => {
  const s = launch(t, { fixture: "hostile-native-truncated.kdna" }); await s.initialize();
  const defaultResponse = await s.call("kdna.catalog", budget), fullResponse = await s.call("kdna.catalog", { ...budget, presentation: "full" });
  const taskResponse = await s.call("kdna.catalog", { ...budget, presentation: "task", view_budget_bytes: 1000000 });
  for (const response of [defaultResponse, fullResponse, taskResponse]) {
    assert.equal(response.result.isError, true);
    assert.deepEqual(Object.keys(response.result).sort(), ["content", "isError"]);
    assert.equal(response.result.content.length, 1); assert.equal(response.result.content[0].type, "text");
  }
  const full = decoded(fullResponse), view = decoded(taskResponse);
  assert.equal(full.contract.id, "kdna.section-bytes-node"); assert.equal(full.contract.version, "0.1.1-candidate");
  assert.equal(full.status, "rejected"); assert.equal(full.reason, "READ_CORE_INVALID"); assert.equal(full.stage, "input");
  assert.equal(full.snapshot, null); assert.equal(full.diagnostic, null);
  assert.equal(full.input_observation.input_byte_length, fs.statSync(path.join(fixtures, "hostile-native-truncated.kdna")).size);
  assert.ok(full.input_observation.access_ranges.length > 0);
  const causal = ({ request_id, ...value }) => value;
  assert.deepEqual(causal(decoded(defaultResponse)), causal(full));
  assert.deepEqual(causal(view.official_result), causal(full));
  assert.equal(view.status, "rejected"); assert.equal(view.audit, null); assert.equal(view.content, undefined);
  assert.equal(view.authorization.action_authorized, false);
  const short = await s.call("kdna.catalog", { ...budget, presentation: "task", view_budget_bytes: 1 });
  assert.equal(short.result.isError, true); assert.equal(decoded(short).code, "MCP_TASK_VIEW_BUDGET_EXCEEDED");
  assert.equal(decoded(short).official_result, undefined);
  assert.equal(decoded(await s.call("kdna.audit", { ...budget, audit_ref: "audit:not-issued" })).code, "MCP_REFERENCE_UNAVAILABLE");
  assert.equal(decoded(await s.call("kdna.binding-status")).state, "bound");
  await s.close();
});

test("technical inspection does not promote declared writer/read/action/Creation facts", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna", env: { PATH: "/nonexistent-cli-path", NODE_PATH: "" } }); await s.initialize();
  const result = decoded(await s.call("kdna.inspect"));
  assert.equal(result.status, "accepted"); assert.equal(result.states.core, "valid");
  for (const state of ["writer", "confirmation", "read_permission", "action_authorization"]) assert.equal(result.states[state], "not_evaluated");
  assert.equal(result.content, undefined);
  const status = decoded(await s.call("kdna.binding-status")); assert.equal(status.creation_accepted, false); assert.equal(status.action_authorized, false);
});

test("overlapping reads fail busy without changing selection or issuing an extra read", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const first = s.call("kdna.catalog", budget), second = s.call("kdna.catalog", budget);
  assert.equal(decoded(await second).code, "MCP_READ_BUSY"); const accepted = bodyView(await first);
  assert.equal(bodyView(await s.call("kdna.catalog", budget)).fingerprint.snapshot_id, accepted.fingerprint.snapshot_id);
});

for (const method of ["tool", "notification"]) {
  test("real pending read cancellation closes the CLI and binding: " + method, async t => {
    const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
    const previous = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" }));
    const pending = s.call("kdna.catalog", budget);
    if (method === "tool") {
      const cancelled = s.call("kdna.cancel"); assert.equal(decoded(await cancelled).binding_closed, true);
    } else s.notify("notifications/cancelled", { requestId: 3 });
    const response = await pending;
    assert.equal(response.result.isError, true); assert.equal(decoded(response).code, "MCP_READ_CANCELLED");
    assert.equal(decoded(await s.call("kdna.catalog", budget)).code, "MCP_BINDING_CANCELLED");
    assert.equal(decoded(await s.call("kdna.cancel")).binding_closed, true);
    absent(Number(previous.receipt.host_epoch.split(":")[1]));
    await s.close();
  });
}

test("EOF waits for the accepted read and releases its real CLI child", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const pending = s.call("kdna.catalog", { ...budget, presentation: "full" }); s.child.stdin.end();
  const value = ready(await pending); await s.close(); absent(Number(value.receipt.host_epoch.split(":")[1]));
});

test("SIGTERM and a broken output pipe terminate without private snapshot survivors", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const catalog = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" })); s.child.kill("SIGTERM");
  await s.close(); absent(Number(catalog.receipt.host_epoch.split(":")[1]));
  const broken = launch(t, { fixture: "graph-cross.kdna" });
  broken.child.stdout.destroy();
  broken.raw(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: init }) + "\n");
  await broken.close(1);
});

test("malformed UTF-8/JSON and over-limit stdio inputs fail boundedly", async t => {
  const s = launch(t); s.raw(Buffer.from([0xff, 10]));
  await s.initialize(); assert.equal(s.received[0].error.code, -32700);
  const large = launch(t); large.raw(Buffer.alloc(1048577, 120)); large.child.stdin.end(); await large.close(1);
});

test("operator binding rejects symlinks, directories, non-kdna and relative files", async t => {
  const temporary = makeCanonicalTempRoot("binding-policy-"); t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const target = path.join(temporary, "data.kdna"); fs.copyFileSync(path.join(fixtures, "graph-cross.kdna"), target);
  const link = path.join(temporary, "link.kdna"); fs.symlinkSync(target, link);
  const json = path.join(temporary, "data.json"); fs.copyFileSync(target, json);
  for (const selected of [link, temporary, json, "./relative.kdna"]) {
    const s = launch(t, { argv: ["--asset", selected, "--allow-read"] }); await s.close(2);
  }
});


test("kdna.read accepts exactly one present selection key, matching its declared schema", async t => {
  const { default: Ajv } = await import("ajv");
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const declared = (await s.rpc("tools/list")).result.tools.find(tool => tool.name === "kdna.read").inputSchema;
  assert.ok(declared.properties.selection.oneOf, "the declared selection schema must be oneOf, matching the runtime either/or rule");
  assert.equal(declared.properties.selection.anyOf, undefined, "anyOf would let both keys pass the schema");
  const validate = new Ajv({ allErrors: true, strict: false }).compile(declared);
  const catalog = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" }));
  const asset = { asset_id: catalog.asset.asset_id, asset_version: catalog.asset.asset_version };
  const ids = catalog.content.catalog.map(item => item.judgment_id);
  assert.ok(ids.length >= 2, "the fixture must carry at least two judgments for this matrix");
  const cases = [
    ["legacy single id", { ...asset, judgment_id: ids[0] }, true],
    ["plural one id", { ...asset, judgment_ids: [ids[0]] }, true],
    ["plural two ids", { ...asset, judgment_ids: ids.slice(0, 2) }, true],
    ["null single beside valid plural", { ...asset, judgment_id: null, judgment_ids: [ids[0]] }, false],
    ["null plural beside valid single", { ...asset, judgment_id: ids[0], judgment_ids: null }, false],
    ["empty plural array", { ...asset, judgment_ids: [] }, false],
    ["plural wrong type", { ...asset, judgment_ids: ids[0] }, false],
    ["single wrong type", { ...asset, judgment_id: 7 }, false],
    ["both keys valid", { ...asset, judgment_id: ids[0], judgment_ids: [ids[1]] }, false],
    ["duplicate ids", { ...asset, judgment_ids: [ids[0], ids[0]] }, false],
    ["sixty-five ids", { ...asset, judgment_ids: Array.from({ length: 65 }, (_, index) => "j:" + index) }, false],
    ["unknown selection key", { ...asset, judgment_id: ids[0], approved: true }, false],
    ["missing asset_version", { asset_id: asset.asset_id, judgment_id: ids[0] }, false],
  ];
  for (const [label, selection, expected] of cases) {
    assert.equal(validate({ ...budget, selection }), expected, "declared schema: " + label);
    const response = await s.call("kdna.read", { ...budget, selection });
    const refused = Boolean(response.error);
    if (refused) assert.equal(response.error.code, -32602, "refusal code: " + label);
    else assert.notEqual(response.result.isError, true, "runtime accepted then failed downstream: " + label);
    assert.equal(!refused, expected, "runtime acceptance: " + label);
  }
  await s.close();
});

test("all five guide command vectors launch the actual local stdio candidate",async t=>{
  const matrix=JSON.parse(fs.readFileSync(path.join(root,"../docs/agent-support-matrix.json"),"utf8"));
  const fence=String.fromCharCode(96).repeat(3);
  for(const agent of matrix.agents) await t.test(agent.id,async t=>{
    const guide=fs.readFileSync(path.join(root,"..",agent.guide),"utf8");
    const match=guide.match(new RegExp(fence+"json\\s*\\n([\\s\\S]*?)\\n"+fence));
    const vector=JSON.parse(match[1]);
    const args=vector.args.map(value=>value==="/absolute/installed/mcp-server/bin/kdna-mcp.mjs"?server:value==="/absolute/selected.kdna"?path.join(fixtures,"graph-cross.kdna"):value);
    assert.equal(args.shift(),server);
    const s=launch(t,{argv:args}); await s.initialize();
    assert.equal(decoded(await s.call("kdna.binding-status")).state,"bound");
    bodyView(await s.call("kdna.catalog",budget)); await s.close();
  });
});

for (const fixture of ["graph-cross.kdna", "graph-same.kdna", "graph-method.kdna", "graph-asset.kdna", "graph-null.kdna", "graph-dedup-support.kdna"]) {
  test("opt-in task carries the complete catalog, authored closure and past audit: " + fixture, async t => {
    const { reconstructTaskContent } = await import(pathToFileURL(path.join(path.dirname(server), "task-content.mjs")));
    const s = launch(t, { fixture }); await s.initialize();
    const task = { ...budget, presentation: "task", view_budget_bytes: 1000000 };
    const response = await s.call("kdna.catalog", task), catalog = decoded(response);
    assert.notEqual(response.result.isError, true, JSON.stringify(catalog));
    assert.equal(catalog.status, "catalog_only");
    assert.deepEqual(Object.keys(response.result), ["content"]);
    assert.equal(response.result.content.length, 1); assert.equal(response.result.content[0].type, "text");
    const fullCatalog = ready(await s.call("kdna.audit", { ...budget, audit_ref: catalog.audit.audit_ref }));
    assert.deepEqual(catalog.content.catalog, fullCatalog.content.catalog);
    const selection = { asset_id: catalog.asset.asset_id, asset_version: catalog.asset.asset_version, judgment_ids: catalog.content.catalog.map(c => c.judgment_id) };
    const chosen = await s.call("kdna.read", { ...task, selection }), view = decoded(chosen);
    assert.notEqual(chosen.result.isError, true, JSON.stringify(view)); assert.equal(view.status, "ready");
    const auditResponse = await s.call("kdna.audit", { ...budget, audit_ref: view.audit.audit_ref }), audit = ready(auditResponse);
    const restored = reconstructTaskContent({ content: view.content, content_aliases: view.content_aliases });
    for (const field of ["declarations", "catalog", "selected", "closure", "references", "relationships", "missing", "provenance", "asset_capability"]) assert.deepEqual(restored[field], audit.content[field]);
    for (const field of ["asset", "tuple", "snapshot_id", "digests", "states", "diagnostics", "omissions", "assessment"]) assert.deepEqual(view[field], audit[field]);
    assert.equal(view.audit.full_result_bytes, Buffer.byteLength(auditResponse.result.content[0].text));
    assert.ok(Buffer.byteLength(chosen.result.content[0].text) < view.audit.full_result_bytes, "measure every visible channel, with no full structuredContent copy");
    assert.equal(view.authorization.action_authorized, false);
    const pid = Number(audit.receipt.host_epoch.split(":")[1]);
    const expansion = view.content.expansion_handles?.[0];
    if (expansion) {
      const expanded = decoded(await s.call("kdna.expand", { ...task, handle_ref: expansion.handle_ref }));
      assert.equal(expanded.status, "ready"); assert.equal(expanded.snapshot_id, view.snapshot_id);
      const other = launch(t, { fixture }); await other.initialize();
      assert.equal(decoded(await other.call("kdna.expand", { ...task, handle_ref: expansion.handle_ref })).code, "MCP_REFERENCE_UNAVAILABLE");
      assert.equal(decoded(await other.call("kdna.audit", { ...budget, audit_ref: view.audit.audit_ref })).code, "MCP_REFERENCE_UNAVAILABLE");
    }
    assert.equal(decoded(await s.call("kdna.audit", { budget_bytes: 0, audit_ref: view.audit.audit_ref })).code, "MCP_AUDIT_BUDGET_EXCEEDED");
    decoded(await s.call("kdna.cancel"));
    assert.equal(decoded(await s.call("kdna.audit", { ...budget, audit_ref: view.audit.audit_ref })).code, "MCP_BINDING_CANCELLED");
    await s.close(); absent(pid);
  });
}

test("presentation and short-reference schemas match runtime refusal; the projected default stays compatible", async t => {
  const { default: Ajv } = await import("ajv");
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const list = (await s.rpc("tools/list")).result.tools;
  for (const name of ["kdna.catalog", "kdna.expand", "kdna.audit"]) {
    const validate = new Ajv({ strict: false }).compile(list.find(t => t.name === name).inputSchema);
    const cases = name === "kdna.catalog" ? [budget, { ...budget, presentation: "body" }, { ...budget, presentation: "full" }, { ...budget, presentation: "task", view_budget_bytes: 0 }, { ...budget, presentation: "task" }, { ...budget, view_budget_bytes: 1 }, { ...budget, presentation: "full", view_budget_bytes: 1 }, { ...budget, presentation: "body", view_budget_bytes: 1 }, { ...budget, presentation: null }, { ...budget, presentation: "unknown" }, { ...budget, presentation: "task", view_budget_bytes: 1000001 }] : name === "kdna.expand" ? [{ ...budget, handle: {} }, { ...budget, handle_ref: "handle:missing" }, { ...budget, handle: {}, handle_ref: "handle:missing" }, { ...budget, handle: null, handle_ref: "handle:missing" }, { ...budget }, { ...budget, handle_ref: 1 }, { ...budget, handle: {}, presentation: "body" }, { ...budget, handle: {}, presentation: "unknown" }] : [{ ...budget, audit_ref: "audit:missing" }, { ...budget, audit_ref: "audit:missing", path: "/other.kdna" }, { ...budget, audit_ref: "" }, { ...budget, audit_ref: "audit:missing", presentation: "task" }];
    for (const args of cases) {
      const expected = validate(args), response = await s.call(name, args);
      assert.equal(!response.error, expected, JSON.stringify({ name, args }));
      if (response.error) assert.equal(response.error.code, -32602);
    }
  }
  const original = bodyView(await s.call("kdna.catalog", budget)), explicitBody = bodyView(await s.call("kdna.catalog", { ...budget, presentation: "body" }));
  assert.deepEqual(original.content, explicitBody.content);
  assert.equal(original.fingerprint.snapshot_id, explicitBody.fingerprint.snapshot_id);
  const enveloped = ready(await s.call("kdna.catalog", { ...budget, presentation: "full" }));
  assert.deepEqual(enveloped.content.catalog, original.content.catalog);
  assert.equal(enveloped.snapshot_id, original.fingerprint.snapshot_id);
  assert.ok(original.fingerprint.omitted.envelope.includes("states"));
  const low = decoded(await s.call("kdna.catalog", { budget_bytes: 0, presentation: "task", view_budget_bytes: 1000000 }));
  assert.equal(low.status, "rejected"); assert.equal(low.audit, null); assert.ok(low.official_result);
  assert.equal(decoded(await s.call("kdna.catalog", { ...budget, presentation: "task", view_budget_bytes: 0 })).code, "MCP_TASK_VIEW_BUDGET_EXCEEDED");
  const missing = decoded(await s.call("kdna.read", { ...budget, presentation: "task", view_budget_bytes: 1000000, selection: { asset_id: enveloped.asset.asset_id, asset_version: enveloped.asset.asset_version, judgment_id: "j:missing" } }));
  assert.equal(missing.status, "rejected"); assert.equal(missing.official_result.diagnostic.code, "READ_SELECTION_NOT_FOUND"); assert.equal(missing.audit, null);
  await s.close();
});
