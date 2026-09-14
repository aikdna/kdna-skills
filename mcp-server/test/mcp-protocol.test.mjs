import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";

const root = path.resolve(".");
const server = process.env.KDNA_MCP_TEST_SERVER || path.join(root, "bin/kdna-mcp.mjs");
const cli = path.join(root, "node_modules/@aikdna/kdna-cli/src/cli.js");
const fixtures = process.env.KDNA_PUBLIC_FIXTURES || path.join(root, "test/fixtures/public-read-current");
assert.ok(fixtures, "KDNA_PUBLIC_FIXTURES must name the fixed public corpus");
const recordRoot = process.env.KDNA_MCP_TEST_RECORD_ROOT ? path.join(process.env.KDNA_MCP_TEST_RECORD_ROOT, "stdio", process.env.KDNA_TEST_PHASE || "source") : null;
if (recordRoot) fs.mkdirSync(recordRoot, { recursive: true, mode: 0o700 });
const init = { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "local-stdio-verifier", version: "1.0.0" } };
const budget = { budget_bytes: 1000000 };
const toolNames = JSON.parse(fs.readFileSync(path.join(root,"../docs/agent-support-matrix.json"),"utf8")).tool_surface;
const decoded = response => { assert.ok(!response.error, JSON.stringify(response)); return JSON.parse(response.result.content[0].text); };
const ready = response => { const value = decoded(response); assert.notEqual(response.result.isError, true, JSON.stringify(value)); assert.equal(value.envelope?.status, "ready"); return value.envelope; };

function launch(t, options = {}) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "agent-stdio-case-"));
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
function reference(fixture, selection = null) {
  const argv = [cli, "read", path.join(fixtures, fixture), "--mode", selection ? "exact_selection" : "catalog", "--budget", "1000000", "--allow-read"];
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
  return JSON.parse(response.stdout).envelope;
}
function absent(pid) { assert.throws(() => process.kill(pid, 0), error => error.code === "ESRCH"); }

test("unbound initialization, exact six-tool list and no parameter-created authority", async t => {
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
    const catalog = ready(await s.call("kdna.catalog", budget));
    assert.deepEqual(catalog.content, reference(fixture).content);
    let last;
    for (const item of catalog.content.catalog) {
      const selection = { asset_id: catalog.asset.asset_id, asset_version: catalog.asset.asset_version, judgment_id: item.judgment_id };
      last = ready(await s.call("kdna.read", { ...budget, selection }));
      const expected = reference(fixture, selection);
      for (const field of ["declarations", "catalog", "selected", "closure", "references", "relationships", "missing", "provenance"]) assert.deepEqual(last.content[field], expected.content[field]);
      assert.equal(last.snapshot_id, catalog.snapshot_id); assert.equal(last.receipt.host_epoch, catalog.receipt.host_epoch);
      const ids = new Set(last.content.closure.map(node => node.id));
      for (const ref of last.content.references.filter(ref => ref.mandatory)) assert.ok(ids.has(ref.target_node), ref.target_node);
      assert.equal(last.states.writer, "not_evaluated"); assert.equal(last.states.confirmation, "not_evaluated"); assert.equal(last.states.action_authorization, "not_evaluated");
    }
    assert.deepEqual(ready(await s.call("kdna.catalog", budget)).content.catalog, catalog.content.catalog);
    const pid = Number(last.receipt.host_epoch.split(":")[1]); await s.close(); absent(pid);
  });
}

test("issued handles expand only in the original official CLI process", async t => {
  const first = launch(t, { fixture: "graph-cross.kdna" }); await first.initialize();
  const catalog = ready(await first.call("kdna.catalog", budget));
  const selection = { asset_id: catalog.asset.asset_id, asset_version: catalog.asset.asset_version, judgment_id: catalog.content.catalog[0].judgment_id };
  const selected = ready(await first.call("kdna.read", { ...budget, selection }));
  assert.ok(selected.content.expansion_handles.length > 0);
  const handle = selected.content.expansion_handles[0];
  const expanded = ready(await first.call("kdna.expand", { ...budget, handle }));
  assert.equal(expanded.snapshot_id, selected.snapshot_id); assert.ok(expanded.content.closure.some(node => node.id === handle.target));
  const second = launch(t, { fixture: "graph-cross.kdna" }); await second.initialize(); ready(await second.call("kdna.catalog", budget));
  const foreign = await second.call("kdna.expand", { ...budget, handle });
  assert.equal(foreign.result.isError, true); assert.notEqual(decoded(foreign).envelope.status, "ready");
  const tampered = await first.call("kdna.expand", { ...budget, handle: { ...handle, A: "sha256:" + "0".repeat(64) } });
  assert.equal(tampered.result.isError, true);
  assert.equal(ready(await first.call("kdna.catalog", budget)).snapshot_id, selected.snapshot_id);
});

test("startup bytes remain fixed across original-file replacement; restart creates a new snapshot", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const before = ready(await s.call("kdna.catalog", budget));
  fs.writeFileSync(s.selected, "corrupted after operator binding");
  const after = ready(await s.call("kdna.catalog", budget));
  assert.equal(after.snapshot_id, before.snapshot_id); assert.deepEqual(after.digests, before.digests); assert.deepEqual(after.content, before.content);
  await s.close();
  const fresh = launch(t, { fixture: "graph-cross.kdna" }); await fresh.initialize();
  assert.notEqual(ready(await fresh.call("kdna.catalog", budget)).snapshot_id, before.snapshot_id);
});

test("public rejection and no-body budget results remain explicit without invented content", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const none = await s.call("kdna.catalog", { budget_bytes: 0 }); assert.equal(none.result.isError, true); assert.notEqual(decoded(none).envelope?.status, "ready");
  const catalog = ready(await s.call("kdna.catalog", budget));
  const bad = await s.call("kdna.read", { ...budget, selection: { asset_id: catalog.asset.asset_id, asset_version: catalog.asset.asset_version, judgment_id: "j:not-present" } });
  assert.equal(bad.result.isError, true); assert.equal(decoded(bad).envelope.content, null);
  const corrupt = launch(t, { fixture: "hostile-zip-crc.kdna" }); await corrupt.initialize();
  const refused = await corrupt.call("kdna.catalog", budget); assert.equal(refused.result.isError, true); assert.notEqual(decoded(refused).envelope?.status, "ready");
  const inspected = decoded(await corrupt.call("kdna.inspect")); assert.equal(inspected.status, "rejected");
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
  assert.equal(decoded(await second).code, "MCP_READ_BUSY"); const accepted = ready(await first);
  assert.equal(ready(await s.call("kdna.catalog", budget)).snapshot_id, accepted.snapshot_id);
});

for (const method of ["tool", "notification"]) {
  test("real pending read cancellation closes the CLI and binding: " + method, async t => {
    const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
    const previous = ready(await s.call("kdna.catalog", budget));
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
  const pending = s.call("kdna.catalog", budget); s.child.stdin.end();
  const value = ready(await pending); await s.close(); absent(Number(value.receipt.host_epoch.split(":")[1]));
});

test("SIGTERM and a broken output pipe terminate without private snapshot survivors", async t => {
  const s = launch(t, { fixture: "graph-cross.kdna" }); await s.initialize();
  const catalog = ready(await s.call("kdna.catalog", budget)); s.child.kill("SIGTERM");
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
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "binding-policy-")); t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const target = path.join(temporary, "data.kdna"); fs.copyFileSync(path.join(fixtures, "graph-cross.kdna"), target);
  const link = path.join(temporary, "link.kdna"); fs.symlinkSync(target, link);
  const json = path.join(temporary, "data.json"); fs.copyFileSync(target, json);
  for (const selected of [link, temporary, json, "./relative.kdna"]) {
    const s = launch(t, { argv: ["--asset", selected, "--allow-read"] }); await s.close(2);
  }
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
    ready(await s.call("kdna.catalog",budget)); await s.close();
  });
});
