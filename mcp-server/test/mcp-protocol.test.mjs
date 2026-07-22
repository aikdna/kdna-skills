import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const cbor = require("cbor-x");
const { buildChecksums, pack } = require("@aikdna/kdna-core");
const packageInfo = require("../package.json");
const cliInfo = require("@aikdna/kdna-cli/package.json");

const server = path.resolve("bin/kdna-mcp.mjs");
const cli = path.resolve(
  path.dirname(require.resolve("@aikdna/kdna-cli/package.json")),
  cliInfo.bin.kdna,
);

function rpc(message, options = {}) {
  const result = spawnSync(process.execPath, [server], {
    input: `${typeof message === "string" ? message : JSON.stringify(message)}\n`,
    encoding: "utf8",
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...(options.env || {}) },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() ? JSON.parse(result.stdout.trim()) : null;
}

function invoke(name, args, options = {}) {
  const rpcOptions = { ...options };
  if (!rpcOptions.cwd && name.startsWith("kdna.workspace-") && args?.cwd) {
    rpcOptions.cwd = path.resolve(args.cwd);
  }
  return rpc(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    },
    rpcOptions,
  );
}

function callTool(name, args, options = {}) {
  const response = invoke(name, args, options);
  assert.ok(!response.error, response.error?.message);
  assert.equal(
    response.result.isError,
    undefined,
    response.result.content[0].text,
  );
  return JSON.parse(response.result.content[0].text);
}

function listTools() {
  return rpc({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }).result
    .tools;
}

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...(options.env || {}) },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(
    result.status,
    options.status ?? 0,
    result.stderr || result.stdout,
  );
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function temporaryRoot(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `kdna-mcp-${label}-`));
}

function assetId(label) {
  return `kdna:test:${label.replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "")}`;
}

function makeKdnaContainer(root, label = "writing", options = {}) {
  const source = path.join(root, `source-${label}`);
  const output = path.join(root, `${label}.kdna`);
  fs.mkdirSync(source, { recursive: true });
  fs.writeFileSync(path.join(source, "mimetype"), "application/vnd.kdna.asset");
  const manifest = {
    format_version: "0.1.0",
    asset_id: options.assetId || assetId(label),
    asset_uid: options.assetUid || `urn:uuid:${crypto.randomUUID()}`,
    asset_type: "domain",
    title: `Test ${label}`,
    version: options.version || "1.0.0",
    judgment_version: options.version || "1.0.0",
    created_at: "2026-07-22T00:00:00.000Z",
    updated_at: "2026-07-22T00:00:00.000Z",
    creator: { name: "MCP Protocol Test", id: "mcp-protocol-test" },
    lineage: { type: "original", fork_of: null, derived_from: null },
    payload: { path: "payload.kdnab", encoding: "cbor", encrypted: false },
    compatibility: {
      min_loader_version: "0.21.0",
      profile: "kdna.payload.judgment",
      profile_version: "0.1.0",
    },
    load_contract: {
      default_profile: "compact",
      profiles: {
        index: { requires_decryption: false, max_tokens_hint: 200 },
        compact: { requires_decryption: false, max_tokens_hint: 2000 },
        scenario: {
          requires_decryption: false,
          selection: "triggered_sections_only",
        },
        full: { requires_decryption: false, intended_for: ["audit"] },
      },
    },
  };
  if (options.remote) {
    manifest.access = "remote";
    manifest.runtime = { endpoint: "https://runtime.example.test/project" };
  }
  fs.writeFileSync(
    path.join(source, "kdna.json"),
    JSON.stringify(manifest, null, 2),
  );
  fs.writeFileSync(
    path.join(source, "payload.kdnab"),
    cbor.encode({
      profile: "kdna.payload.judgment",
      profile_version: "0.1.0",
      core: {
        highest_question: `What makes ${label} judgment useful?`,
        axioms: [
          { id: "ax1", one_sentence: `Use the ${label} decision boundary.` },
        ],
        boundaries: [
          { type: "stance_boundary", stance: `Do not exceed ${label} scope.` },
        ],
        risk_model: {},
      },
      patterns: [],
      scenarios: [],
      cases: [],
      reasoning: {
        self_check: [`Did I apply ${label} only when approved?`],
        failure_modes: [],
      },
    }),
  );
  fs.writeFileSync(
    path.join(source, "checksums.json"),
    JSON.stringify(buildChecksums(source), null, 2),
  );
  pack(source, output);
  return output;
}

function attach(workspace, asset, options = {}) {
  return runCli([
    "attach",
    asset,
    "--cwd",
    workspace,
    "--role",
    options.role || "article-writing",
    "--applies-to",
    options.appliesTo || "draft",
    "--does-not-apply-to",
    options.doesNotApplyTo || "code",
    "--yes",
  ]);
}

function readRecord(workspace) {
  return JSON.parse(
    fs.readFileSync(path.join(workspace, ".kdna", "attachments.json"), "utf8"),
  );
}

test("initialize and tool discovery expose only the seven thin read/load tools", () => {
  const initialized = rpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {},
  });
  assert.equal(initialized.result.protocolVersion, "2024-11-05");
  assert.deepEqual(initialized.result.serverInfo, {
    name: "@aikdna/kdna-mcp-server",
    version: packageInfo.version,
  });

  const tools = listTools();
  assert.deepEqual(
    tools.map(({ name }) => name),
    [
      "kdna.inspect",
      "kdna.verify",
      "kdna.plan-load",
      "kdna.load",
      "kdna.workspace-status",
      "kdna.workspace-resolve",
      "kdna.workspace-load",
    ],
  );
  const surface = JSON.stringify(tools);
  assert.doesNotMatch(
    surface,
    /available-local|kdna\.match|kdna\.attach|disable|enable|switch|rollback|remove/u,
  );
  assert.doesNotMatch(surface, /password|entitlementStatus|hasPassword/u);
  for (const tool of tools)
    assert.equal(tool.inputSchema.additionalProperties, false);
});

test("explicit-file inspect, verify, plan, and load all pass through the pinned CLI", () => {
  const root = temporaryRoot("explicit");
  try {
    const asset = makeKdnaContainer(root);
    const inspected = callTool("kdna.inspect", { assetPath: asset });
    assert.equal(inspected.asset_id, "kdna:test:writing");
    const verified = callTool("kdna.verify", { assetPath: asset });
    assert.equal(verified.overall_valid, true);
    const plan = callTool("kdna.plan-load", { assetPath: asset });
    assert.equal(plan.can_load_now, true);
    const loaded = callTool("kdna.load", {
      assetPath: asset,
      profile: "compact",
    });
    assert.equal(loaded.type, "kdna.runtime-capsule");
    assert.equal(loaded.asset.asset_id, "kdna:test:writing");
    assert.match(JSON.stringify(loaded.context), /writing decision boundary/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("no workspace record skips even when a global-looking directory contains an asset", () => {
  const root = temporaryRoot("no-record");
  try {
    const workspace = path.join(root, "workspace");
    const fakeHome = path.join(root, "home");
    const globalDirectory = path.join(fakeHome, ".kdna", "packages");
    fs.mkdirSync(workspace, { recursive: true });
    fs.mkdirSync(globalDirectory, { recursive: true });
    makeKdnaContainer(globalDirectory, "unapproved-global");

    const options = {
      env: { HOME: fakeHome, KDNA_ASSET_DIR: globalDirectory },
    };
    const status = callTool(
      "kdna.workspace-status",
      { cwd: workspace },
      options,
    );
    assert.equal(status.attachments, null);
    const resolution = callTool(
      "kdna.workspace-resolve",
      { cwd: workspace, task: "draft this article" },
      options,
    );
    assert.equal(resolution.decision, "skip");
    assert.equal(resolution.reason_code, "no_approved_attachment");
    assert.deepEqual(resolution.candidates, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("approved workspace load shows identity, digest, scope, reason, checks, controls, plan, and capsule", () => {
  const root = temporaryRoot("adoption");
  try {
    const workspace = path.join(root, "project");
    const tasks = path.join(root, "private-tasks");
    fs.mkdirSync(workspace);
    fs.mkdirSync(tasks);
    const asset = makeKdnaContainer(root, "editorial");
    const attached = attach(workspace, asset, {
      role: "article-writing",
      appliesTo: "draft",
      doesNotApplyTo: "code",
    });

    const adopted = callTool(
      "kdna.workspace-load",
      { cwd: workspace, task: "Please draft the article.", profile: "compact" },
      { env: { TMPDIR: tasks } },
    );
    assert.equal(adopted.document_type, "kdna.mcp.workspace-adoption");
    assert.equal(adopted.adoption, "load");
    assert.equal(adopted.adapter.cli, "@aikdna/kdna-cli@0.36.0");
    assert.equal(adopted.adapter.core, "@aikdna/kdna-core@0.21.0");
    assert.equal(
      adopted.resolution.reason_code,
      "single_approved_attachment_clearly_applies",
    );
    assert.equal(adopted.resolution.authorization, "satisfied");
    assert.equal(adopted.resolution.integrity, "verified");
    assert.equal(
      adopted.resolution.selected.attachment_id,
      attached.attachment.attachment_id,
    );
    assert.equal(adopted.resolution.selected.asset_id, "kdna:test:editorial");
    assert.match(adopted.resolution.selected.digest, /^sha256:[0-9a-f]{64}$/u);
    assert.deepEqual(adopted.scope, {
      kind: "workspace",
      applies_to: ["draft"],
      does_not_apply_to: ["code"],
    });
    assert.match(
      adopted.controls.disable,
      new RegExp(attached.attachment.attachment_id, "u"),
    );
    assert.equal(adopted.load_plan.can_load_now, true);
    assert.equal(adopted.runtime_capsule.type, "kdna.runtime-capsule");
    assert.equal(adopted.runtime_capsule.asset.asset_id, "kdna:test:editorial");
    assert.deepEqual(
      fs.readdirSync(tasks),
      [],
      "private task file must be removed after resolution",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("outside-scope and disabled attachments do not load", () => {
  const root = temporaryRoot("skip-disable");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const attached = attach(workspace, makeKdnaContainer(root, "scope"));

    const outside = callTool("kdna.workspace-load", {
      cwd: workspace,
      task: "Review this code change.",
    });
    assert.equal(outside.adoption, "skip");
    assert.equal(outside.resolution.reason_code, "outside_scope");
    assert.equal(outside.runtime_capsule, null);

    runCli(["disable", attached.attachment.attachment_id, "--cwd", workspace]);
    const disabled = callTool("kdna.workspace-load", {
      cwd: workspace,
      task: "Draft this article.",
    });
    assert.equal(disabled.adoption, "skip");
    assert.equal(disabled.resolution.reason_code, "no_approved_attachment");
    assert.equal(disabled.runtime_capsule, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("conflicting approved attachments ask and never compose capsules", () => {
  const root = temporaryRoot("conflict");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    attach(workspace, makeKdnaContainer(root, "first"), {
      role: "article-writing",
    });
    attach(workspace, makeKdnaContainer(root, "second"), {
      role: "article-writing",
    });
    const adopted = callTool("kdna.workspace-load", {
      cwd: workspace,
      task: "Draft this article.",
    });
    assert.equal(adopted.adoption, "ask");
    assert.equal(adopted.resolution.reason_code, "attachment_conflict");
    assert.equal(adopted.resolution.candidates.length, 2);
    assert.equal(adopted.load_plan, null);
    assert.equal(adopted.runtime_capsule, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a corrupted immutable snapshot blocks before plan or load", () => {
  const root = temporaryRoot("digest-block");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    attach(workspace, makeKdnaContainer(root, "digest"));
    const record = readRecord(workspace);
    const snapshot = path.join(
      workspace,
      ".kdna",
      record.attachments[0].asset.snapshot,
    );
    fs.appendFileSync(snapshot, "tampered");

    const adopted = callTool("kdna.workspace-load", {
      cwd: workspace,
      task: "Draft this article.",
    });
    assert.equal(adopted.adoption, "block");
    assert.equal(adopted.resolution.reason_code, "snapshot_digest_mismatch");
    assert.equal(adopted.resolution.integrity, "failed");
    assert.equal(adopted.load_plan, null);
    assert.equal(adopted.runtime_capsule, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an attachment requiring remote authorization blocks without accepting caller claims or secrets", () => {
  const root = temporaryRoot("authorization-block");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    attach(workspace, makeKdnaContainer(root, "remote", { remote: true }));
    const adopted = callTool("kdna.workspace-load", {
      cwd: workspace,
      task: "Draft this article.",
    });
    assert.equal(adopted.adoption, "block");
    assert.equal(adopted.resolution.reason_code, "authorization_required");
    assert.equal(adopted.resolution.authorization, "required");
    assert.equal(adopted.runtime_capsule, null);

    for (const forbidden of [
      { password: "secret" },
      { hasPassword: true },
      { entitlementStatus: "active" },
    ]) {
      const response = invoke("kdna.workspace-load", {
        cwd: workspace,
        task: "Draft this article.",
        ...forbidden,
      });
      assert.equal(response.error.code, -32602);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("nested and simultaneous workspaces resolve independently without merging", () => {
  const root = temporaryRoot("multi-workspace");
  try {
    const parent = path.join(root, "parent");
    const child = path.join(parent, "child");
    const separate = path.join(root, "separate");
    fs.mkdirSync(child, { recursive: true });
    fs.mkdirSync(separate);
    attach(parent, makeKdnaContainer(root, "parent-asset"));
    attach(child, makeKdnaContainer(root, "child-asset"));
    attach(separate, makeKdnaContainer(root, "separate-asset"));

    const childResolution = callTool("kdna.workspace-resolve", {
      cwd: child,
      task: "Draft this article.",
    });
    const separateResolution = callTool("kdna.workspace-resolve", {
      cwd: separate,
      task: "Draft this article.",
    });
    assert.equal(childResolution.selected.asset_id, "kdna:test:child-asset");
    assert.deepEqual(
      childResolution.candidates.map(({ asset_id }) => asset_id),
      ["kdna:test:child-asset"],
    );
    assert.equal(
      separateResolution.selected.asset_id,
      "kdna:test:separate-asset",
    );
    assert.notEqual(
      childResolution.selected.digest,
      separateResolution.selected.digest,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("workspace tools cannot escape the Host root or inherit a record above it", () => {
  const root = temporaryRoot("host-root");
  try {
    const parent = path.join(root, "parent");
    const hostRoot = path.join(parent, "host-root");
    const sibling = path.join(parent, "sibling");
    fs.mkdirSync(hostRoot, { recursive: true });
    fs.mkdirSync(sibling);
    attach(parent, makeKdnaContainer(root, "parent-only"));
    attach(sibling, makeKdnaContainer(root, "sibling-only"));

    const noInheritance = callTool(
      "kdna.workspace-resolve",
      { cwd: hostRoot, task: "Draft this article." },
      { cwd: hostRoot },
    );
    assert.equal(noInheritance.decision, "skip");
    assert.equal(noInheritance.reason_code, "no_approved_attachment");
    assert.deepEqual(noInheritance.candidates, []);

    const escaped = invoke(
      "kdna.workspace-status",
      { cwd: sibling },
      { cwd: hostRoot },
    );
    assert.equal(escaped.result.isError, true);
    assert.deepEqual(JSON.parse(escaped.result.content[0].text), {
      error: {
        code: "workspace_outside_host_root",
        message: "The requested workspace is outside the current Host root.",
      },
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("MCP status, resolve, and load cannot mutate attachment records or snapshots", () => {
  const root = temporaryRoot("read-only");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    attach(workspace, makeKdnaContainer(root, "immutable"));
    const recordPath = path.join(workspace, ".kdna", "attachments.json");
    const snapshot = path.join(
      workspace,
      ".kdna",
      readRecord(workspace).attachments[0].asset.snapshot,
    );
    const beforeRecord = fs.readFileSync(recordPath);
    const beforeSnapshot = fs.readFileSync(snapshot);

    callTool("kdna.workspace-status", { cwd: workspace });
    callTool("kdna.workspace-resolve", {
      cwd: workspace,
      task: "Draft this article.",
    });
    callTool("kdna.workspace-load", {
      cwd: workspace,
      task: "Draft this article.",
    });
    assert.deepEqual(fs.readFileSync(recordPath), beforeRecord);
    assert.deepEqual(fs.readFileSync(snapshot), beforeSnapshot);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the server invokes its pinned CLI even when PATH contains a hostile kdna executable", () => {
  const root = temporaryRoot("pinned-cli");
  try {
    const workspace = path.join(root, "project");
    const hostileBin = path.join(root, "bin");
    fs.mkdirSync(workspace);
    fs.mkdirSync(hostileBin);
    const hostile = path.join(hostileBin, "kdna");
    fs.writeFileSync(hostile, "#!/bin/sh\necho HOSTILE >&2\nexit 99\n", {
      mode: 0o700,
    });
    attach(workspace, makeKdnaContainer(root, "pinned"));
    const resolution = callTool(
      "kdna.workspace-resolve",
      { cwd: workspace, task: "Draft this article." },
      { env: { PATH: hostileBin } },
    );
    assert.equal(resolution.decision, "load");
    assert.equal(resolution.selected.asset_id, "kdna:test:pinned");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("tool failures are sterile and do not echo local paths or task text", () => {
  const missing = path.join(
    os.tmpdir(),
    "private-customer-path",
    "missing.kdna",
  );
  const response = invoke("kdna.inspect", { assetPath: missing });
  assert.equal(response.result.isError, true);
  const text = response.result.content[0].text;
  assert.doesNotMatch(text, /private-customer-path|missing\.kdna/u);
  assert.deepEqual(JSON.parse(text), {
    error: {
      code: "runtime_rejected",
      message: "The pinned KDNA CLI rejected the request.",
    },
  });
});

test("JSON-RPC validation rejects malformed requests, unknown tools, and extra arguments", () => {
  assert.equal(rpc("{").error.code, -32700);
  assert.equal(
    rpc({ jsonrpc: "1.0", id: 1, method: "tools/list" }).error.code,
    -32600,
  );
  assert.equal(
    rpc({ jsonrpc: "2.0", id: 1, method: "unknown", params: {} }).error.code,
    -32601,
  );
  assert.equal(invoke("kdna.unknown", {}).error.code, -32602);
  assert.equal(
    invoke("kdna.inspect", { assetPath: "x.kdna", extra: true }).error.code,
    -32602,
  );
  assert.equal(
    invoke("kdna.workspace-resolve", { cwd: ".", task: "" }).error.code,
    -32602,
  );
});

test("notifications produce no response", () => {
  const response = rpc({
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {},
  });
  assert.equal(response, null);
});
