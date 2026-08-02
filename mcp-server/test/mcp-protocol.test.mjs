import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import readline from "node:readline";
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
  const launchCwd = options.cwd || process.cwd();
  const environment = { ...process.env, ...(options.env || {}) };
  if (
    !Object.prototype.hasOwnProperty.call(
      environment,
      "KDNA_MCP_WORKSPACE_ROOT",
    )
  ) {
    environment.KDNA_MCP_WORKSPACE_ROOT = fs.realpathSync(
      options.hostRoot || launchCwd,
    );
  }
  const result = spawnSync(process.execPath, [server], {
    input: `${typeof message === "string" ? message : JSON.stringify(message)}\n`,
    encoding: "utf8",
    cwd: launchCwd,
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() ? JSON.parse(result.stdout.trim()) : null;
}

function rawServer(message, options = {}) {
  const launchCwd = options.cwd || process.cwd();
  return spawnSync(process.execPath, [server], {
    input: `${typeof message === "string" ? message : JSON.stringify(message)}\n`,
    encoding: "utf8",
    cwd: launchCwd,
    env: { ...process.env, ...(options.env || {}) },
  });
}

function rpcMany(messages, options = {}) {
  const launchCwd = options.cwd || process.cwd();
  const environment = { ...process.env, ...(options.env || {}) };
  if (
    !Object.prototype.hasOwnProperty.call(
      environment,
      "KDNA_MCP_WORKSPACE_ROOT",
    )
  ) {
    environment.KDNA_MCP_WORKSPACE_ROOT = fs.realpathSync(
      options.hostRoot || launchCwd,
    );
  }
  const result = spawnSync(process.execPath, [server], {
    input: `${messages.map((message) => JSON.stringify(message)).join("\n")}\n`,
    encoding: "utf8",
    cwd: launchCwd,
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function openRpcSession(options = {}) {
  const launchCwd = options.cwd || process.cwd();
  const environment = { ...process.env, ...(options.env || {}) };
  if (
    !Object.prototype.hasOwnProperty.call(
      environment,
      "KDNA_MCP_WORKSPACE_ROOT",
    )
  ) {
    environment.KDNA_MCP_WORKSPACE_ROOT = fs.realpathSync(
      options.hostRoot || launchCwd,
    );
  }
  const child = spawn(process.execPath, [server], {
    cwd: launchCwd,
    env: environment,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const output = readline.createInterface({ input: child.stdout });
  const iterator = output[Symbol.asyncIterator]();
  return {
    async request(message) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
      const next = await iterator.next();
      assert.equal(next.done, false, stderr);
      return JSON.parse(next.value);
    },
    async close() {
      child.stdin.end();
      const status = await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("close", resolve);
      });
      assert.equal(status, 0, stderr);
      output.close();
    },
  };
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
    input: options.input,
    encoding: "utf8",
    stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
  assert.equal(
    result.status,
    options.status ?? 0,
    result.stderr || result.stdout,
  );
  if (options.raw) return result.stdout;
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function makeProtectedKdnaContainer(
  root,
  password = "mcp-protected-test-password",
) {
  const suffix = crypto.randomBytes(4).toString("hex");
  const source = path.join(root, `protected-source-${suffix}`);
  const output = path.join(root, `protected-${suffix}.kdna`);
  runCli(["demo", "minimal", source, "--password-stdin"], {
    input: `${password}\n`,
    raw: true,
  });
  runCli(["pack", source, output], { raw: true });
  return output;
}

function writeAuthorizationFile(
  root,
  value = "mcp-protected-test-password",
  mode = 0o600,
) {
  const file = path.join(
    root,
    `authorization-${crypto.randomBytes(4).toString("hex")}`,
  );
  fs.writeFileSync(file, `${value}\n`, { mode });
  return file;
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function privateControlDirectory(root) {
  const directory = path.join(
    root,
    `.mcp-private-${crypto.randomBytes(4).toString("hex")}`,
  );
  fs.mkdirSync(directory, { mode: 0o700 });
  return directory;
}

function processingApproval(
  root,
  hostRoot,
  assetDigest,
  profile = "compact",
  overrides = {},
) {
  const hostId = overrides.hostId || "test-host";
  let useBoundary = overrides.useBoundary;
  if (useBoundary === undefined) {
    try {
      const record = JSON.parse(
        fs.readFileSync(
          path.join(hostRoot, ".kdna", "attachments.json"),
          "utf8",
        ),
      );
      const attachment = record.attachments.find(
        (candidate) => candidate.asset?.digest === assetDigest,
      );
      if (attachment) {
        useBoundary = {
          kind: "workspace_attachment",
          attachment_id: attachment.attachment_id,
          scope_digest: sha256(JSON.stringify(attachment.scope)),
        };
      }
    } catch {
      // An explicit file has no workspace attachment policy to bind.
    }
  }
  if (useBoundary === undefined) {
    throw new Error("workspace processing approval requires an attachment");
  }
  const directory =
    overrides.file === undefined
      ? privateControlDirectory(root)
      : path.dirname(overrides.file);
  const file =
    overrides.file || path.join(directory, "processing-consent.json");
  const document = {
    document_type: "kdna.mcp.host-processing-consent",
    schema_version: "0.1.0",
    nonce: crypto.randomBytes(16).toString("hex"),
    host_id: hostId,
    workspace_root_digest: sha256(fs.realpathSync(hostRoot)),
    asset_digest: assetDigest,
    use_boundary: useBoundary,
    processing_boundary:
      overrides.processingBoundary ||
      {
        kind: "named_remote",
        processor: "Test Remote Processor",
      },
    capsule_profile: profile,
    approval_source: "user_explicit_natural_language",
    approved: true,
    ...(overrides.document || {}),
  };
  const temporary = path.join(
    directory,
    `.processing-consent-${crypto.randomBytes(4).toString("hex")}`,
  );
  fs.writeFileSync(temporary, JSON.stringify(document), { mode: 0o600 });
  fs.renameSync(temporary, file);
  const environment = {
    KDNA_MCP_HOST_ID: hostId,
    KDNA_MCP_HOST_PROCESSING_CONSENT_FILE: file,
  };
  Object.defineProperties(environment, {
    file: { value: file, enumerable: false },
    env: { value: environment, enumerable: false },
    document: { value: document, enumerable: false },
  });
  return environment;
}

function processingConsentReplacementGuard(root, consentFile, replacement) {
  const hook = path.join(root, "processing-consent-replacement-guard.cjs");
  const marker = path.join(root, "processing-consent-replaced");
  fs.writeFileSync(
    hook,
    `
const fs = require("node:fs");
const path = require("node:path");
if (process.argv[2] === "load") {
  try {
    const descriptor = fs.openSync(${JSON.stringify(marker)}, "wx");
    fs.closeSync(descriptor);
    const temporary = path.join(
      path.dirname(${JSON.stringify(consentFile)}),
      ".processing-consent-replacement"
    );
    fs.writeFileSync(
      temporary,
      ${JSON.stringify(JSON.stringify(replacement))},
      { mode: 0o600 }
    );
    fs.renameSync(temporary, ${JSON.stringify(consentFile)});
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}
`,
    { mode: 0o600 },
  );
  const inherited = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} `
    : "";
  return `${inherited}--require=${hook}`;
}

function authorizationEnvironmentGuard(root) {
  const hook = path.join(root, "authorization-environment-guard.cjs");
  fs.writeFileSync(
    hook,
    `
if (
  process.argv[1] === ${JSON.stringify(cli)} &&
  process.env.KDNA_MCP_AUTHORIZATION_FILE
) {
  throw new Error("authorization coordinate reached the CLI child");
}
`,
    { mode: 0o600 },
  );
  const inherited = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} `
    : "";
  return `${inherited}--require=${hook}`;
}

function workspaceBoundaryEnvironmentGuard(root, expectedRoot) {
  const hook = path.join(root, "workspace-boundary-guard.cjs");
  fs.writeFileSync(
    hook,
    `
if (
  process.argv[1] === ${JSON.stringify(cli)} &&
  ["attachments", "resolve"].includes(process.argv[2])
) {
  const index = process.argv.indexOf("--workspace-root");
  if (index < 0 || process.argv[index + 1] !== ${JSON.stringify(expectedRoot)}) {
    throw new Error("MCP omitted or changed the explicit Host workspace root");
  }
  if (
    process.argv[2] === "resolve" &&
    (!process.argv.includes("--task-stdin") || process.argv.includes("--task-file"))
  ) {
    throw new Error("MCP did not use the private task stdin contract");
  }
}
`,
    { mode: 0o600 },
  );
  const inherited = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} `
    : "";
  return `${inherited}--require=${hook}`;
}

function hostRootDriftEnvironmentGuard(root, expectedRoot) {
  const hook = path.join(root, "host-root-drift-guard.cjs");
  const canonicalExpectedRoot = fs.realpathSync(expectedRoot);
  fs.writeFileSync(
    hook,
    `
const fs = require("node:fs");
const originalRealpath = fs.realpathSync;
let rootCalls = 0;
fs.realpathSync = function guardedRealpath(value, ...rest) {
  const result = originalRealpath.call(this, value, ...rest);
  if (value === ${JSON.stringify(canonicalExpectedRoot)} && ++rootCalls > 1) {
    return ${JSON.stringify(path.dirname(canonicalExpectedRoot))};
  }
  return result;
};
`,
    { mode: 0o600 },
  );
  const inherited = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} `
    : "";
  return `${inherited}--require=${hook}`;
}

function authorizationReplacementEnvironmentGuard(root, authorizationFile) {
  const hook = path.join(root, "authorization-replacement-guard.cjs");
  const marker = path.join(root, "authorization-replaced");
  const loadMarker = path.join(root, "authorization-replacement-load-invoked");
  fs.writeFileSync(
    hook,
    `
const fs = require("node:fs");
const path = require("node:path");
const command = process.argv[2];
if (command === "load") {
  fs.writeFileSync(${JSON.stringify(loadMarker)}, "called");
}
if (command === "plan-load") {
  try {
    const descriptor = fs.openSync(${JSON.stringify(marker)}, "wx");
    fs.closeSync(descriptor);
    const replacement = path.join(
      path.dirname(${JSON.stringify(authorizationFile)}),
      "replacement-authorization"
    );
    fs.writeFileSync(replacement, "replacement-test-value\\n", { mode: 0o600 });
    fs.renameSync(replacement, ${JSON.stringify(authorizationFile)});
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}
`,
    { mode: 0o600 },
  );
  const inherited = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} `
    : "";
  return {
    nodeOptions: `${inherited}--require=${hook}`,
    loadMarker,
  };
}

function cliSupportsDeferredAuthorization() {
  const cliPackage = require("@aikdna/kdna-cli/package.json");
  const cliEntry = require.resolve("@aikdna/kdna-cli/package.json");
  const src = require("node:fs").readFileSync(
    require("node:path").join(require("node:path").dirname(cliEntry), "src", "cmds", "workspace-attachments.js"),
    "utf8",
  );
  return src.includes("--defer-password-authorization");
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
    "--scope-user-approved",
  ]);
}

function readRecord(workspace) {
  return JSON.parse(
    fs.readFileSync(path.join(workspace, ".kdna", "attachments.json"), "utf8"),
  );
}

function writeCliMutationHook(root, options) {
  const hook = path.join(root, `mutate-on-${options.trigger}.cjs`);
  const marker = path.join(root, `mutated-on-${options.trigger}`);
  const loadMarker = path.join(root, "runtime-load-invoked");
  const mutation =
    options.mutation === "remove-record"
      ? `fs.unlinkSync(${JSON.stringify(options.recordPath)});`
      : `
const recordPath = ${JSON.stringify(options.recordPath)};
const record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
record.attachments[0].state = "disabled";
fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + "\\n");
`;
  fs.writeFileSync(
    hook,
    `
const fs = require("node:fs");
const command = process.argv[2];
if (command === "load") {
  fs.writeFileSync(${JSON.stringify(loadMarker)}, "called");
}
if (command === ${JSON.stringify(options.trigger)}) {
  try {
    const descriptor = fs.openSync(${JSON.stringify(marker)}, "wx");
    fs.closeSync(descriptor);
    ${mutation}
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}
`,
  );
  const inherited = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} `
    : "";
  return {
    env: { NODE_OPTIONS: `${inherited}--require=${hook}` },
    loadMarker,
  };
}

test("initialize and tool discovery expose only the three workspace-bound tools", () => {
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

test("workspace schemas and critical mutation helpers contain no duplicate statements", () => {
  const source = fs.readFileSync(server, "utf8");
  const resolveStart = source.indexOf('name: "kdna.workspace-resolve"');
  const resolveEnd = source.indexOf(
    'name: "kdna.workspace-load"',
    resolveStart,
  );
  const resolveSchema = source.slice(resolveStart, resolveEnd);
  assert.equal(
    (resolveSchema.match(/additionalProperties:\s*false/gu) || []).length,
    1,
  );

  assert.doesNotMatch(source, /writePrivateTask|--task-file|kdna-mcp-task-/u);
  assert.match(source, /"--task-stdin"/u);
  assert.equal(
    (source.match(/const selectionInputSchema\s*=/gu) || []).length,
    1,
  );
  assert.equal((source.match(/async function handle\(/gu) || []).length, 1);

  const controlsStart = source.indexOf("function adoptionControls(");
  const controlsEnd = source.indexOf(
    "function workspaceAdoption(",
    controlsStart,
  );
  assert.equal(
    (
      source.slice(controlsStart, controlsEnd).match(/if\s*\(!selected\)/gu) ||
      []
    ).length,
    1,
  );

  const cliRoot = path.dirname(
    require.resolve("@aikdna/kdna-cli/package.json"),
  );
  const cliWorkspaceSource = fs.readFileSync(
    path.join(cliRoot, "src", "workspace-attachments.js"),
    "utf8",
  );
  const attachStart = cliWorkspaceSource.indexOf("function attachWorkspace(");
  const attachEnd = cliWorkspaceSource.indexOf(
    "function listWorkspaceAttachments(",
    attachStart,
  );
  assert.equal(
    (
      cliWorkspaceSource
        .slice(attachStart, attachEnd)
        .match(/atomicWriteRecord\(/gu) || []
    ).length,
    1,
  );
});

test("generic explicit-file MCP tools are absent; the public Skill uses the official CLI", () => {
  const listed = listTools().map(({ name }) => name);
  for (const name of [
    "kdna.inspect",
    "kdna.verify",
    "kdna.plan-load",
    "kdna.load",
  ]) {
    assert.equal(listed.includes(name), false);
    const response = invoke(name, { assetPath: "guessed.kdna" });
    assert.equal(response.error.code, -32602);
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
      {
        env: {
          TMPDIR: tasks,
          ...processingApproval(
            root,
            workspace,
            attached.attachment.asset.digest,
          ),
        },
      },
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
      adopted.judgment_decision.source,
      "runtime-capsule/context/axioms",
    );
    assert.deepEqual(adopted.judgment_decision.rules[0], {
      rule: "Use the editorial decision boundary.",
      applies_when: [],
      does_not_apply_when: [],
      failure_risk: null,
    });
    assert.equal(
      adopted.resolution.selected.attachment_id,
      attached.attachment.attachment_id,
    );
    assert.equal(adopted.resolution.selected.asset_id, "kdna:test:editorial");
    assert.match(adopted.resolution.selected.digest, /^sha256:[0-9a-f]{64}$/u);
    assert.deepEqual(adopted.scope, {
      kind: "workspace",
      application: "task_hints",
      matching_policy: "open_world_ask",
      authority: "user_approved_routing_hint",
      approval_source: "user_explicit",
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
    assert.equal(adopted.host_processing.host_id, "test-host");
    assert.equal(
      adopted.host_processing.processing_boundary.processor,
      "Test Remote Processor",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("attachment approval alone cannot authorize Host processing or remote delivery", () => {
  const root = temporaryRoot("processing-consent-required");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    attach(workspace, makeKdnaContainer(root, "processing-consent-required"));
    const response = invoke("kdna.workspace-load", {
      cwd: workspace,
      task: "Draft this article.",
      profile: "compact",
    });
    assert.equal(response.result.isError, true);
    assert.deepEqual(JSON.parse(response.result.content[0].text), {
      error: {
        code: "host_processing_consent_required",
        message:
          "Host processing consent is required before any Runtime Capsule delivery.",
      },
    });
    assert.doesNotMatch(response.result.content[0].text, /runtime-capsule/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("one exact Host processing consent is reusable within its declared attachment scope", () => {
  const root = temporaryRoot("processing-consent-reuse");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const attached = attach(
      workspace,
      makeKdnaContainer(root, "processing-consent-reuse"),
    );
    const processing = processingApproval(
      root,
      workspace,
      attached.attachment.asset.digest,
    );
    const request = (id, task) => ({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name: "kdna.workspace-load",
        arguments: { cwd: workspace, task, profile: "compact" },
      },
    });
    const responses = rpcMany(
      [
        request(1, "Draft the first article."),
        request(2, "Draft the second article."),
      ],
      { cwd: workspace, env: processing },
    );
    const adoptions = responses.map((response) =>
      JSON.parse(response.result.content[0].text),
    );
    assert.deepEqual(
      adoptions.map(({ adoption }) => adoption),
      ["load", "load"],
    );
    assert.equal(
      adoptions[0].host_processing.consent_digest,
      adoptions[1].host_processing.consent_digest,
    );
    assert.equal(
      adoptions[0].host_processing.use_boundary.scope_digest,
      sha256(JSON.stringify(attached.attachment.scope)),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a long-running Host can replace an exact consent after user approval without restarting MCP", async () => {
  const root = temporaryRoot("processing-consent-rotation");
  let session;
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const writing = attach(
      workspace,
      makeKdnaContainer(root, "writing-consent"),
      {
        role: "writing",
        appliesTo: "draft",
        doesNotApplyTo: "code",
      },
    );
    const coding = attach(
      workspace,
      makeKdnaContainer(root, "coding-consent"),
      {
        role: "coding",
        appliesTo: "code",
        doesNotApplyTo: "draft",
      },
    );
    const initialConsent = processingApproval(
      root,
      workspace,
      writing.attachment.asset.digest,
    );
    session = openRpcSession({ cwd: workspace, env: initialConsent });
    const request = (id, task) => ({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name: "kdna.workspace-load",
        arguments: { cwd: workspace, task, profile: "compact" },
      },
    });

    const first = await session.request(request(1, "Draft this article."));
    const firstAdoption = JSON.parse(first.result.content[0].text);
    assert.equal(firstAdoption.adoption, "load");
    assert.equal(
      firstAdoption.resolution.selected.attachment_id,
      writing.attachment.attachment_id,
    );

    processingApproval(
      root,
      workspace,
      coding.attachment.asset.digest,
      "compact",
      {
        file: initialConsent.file,
        processingBoundary: {
          kind: "named_remote",
          processor: "Newly Approved Remote Processor",
        },
      },
    );

    const stale = await session.request(request(2, "Draft this article."));
    assert.equal(stale.result.isError, true);
    assert.equal(
      JSON.parse(stale.result.content[0].text).error.code,
      "host_processing_consent_invalid",
    );

    const second = await session.request(request(3, "Code this function."));
    const secondAdoption = JSON.parse(second.result.content[0].text);
    assert.equal(secondAdoption.adoption, "load");
    assert.equal(
      secondAdoption.resolution.selected.attachment_id,
      coding.attachment.attachment_id,
    );
    assert.equal(
      secondAdoption.host_processing.processing_boundary.processor,
      "Newly Approved Remote Processor",
    );
  } finally {
    if (session) await session.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("processing consent drift during load suppresses the Capsule and requires the new consent", () => {
  const root = temporaryRoot("processing-consent-mid-load");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const attached = attach(
      workspace,
      makeKdnaContainer(root, "processing-consent-mid-load"),
    );
    const initialConsent = processingApproval(
      root,
      workspace,
      attached.attachment.asset.digest,
    );
    const replacementConsent = processingApproval(
      root,
      workspace,
      attached.attachment.asset.digest,
      "compact",
      {
        processingBoundary: {
          kind: "named_remote",
          processor: "Newly Approved Remote Processor",
        },
      },
    );
    const response = invoke(
      "kdna.workspace-load",
      {
        cwd: workspace,
        task: "Draft this article.",
        profile: "compact",
      },
      {
        cwd: workspace,
        env: {
          ...initialConsent,
          NODE_OPTIONS: processingConsentReplacementGuard(
            root,
            initialConsent.file,
            replacementConsent.document,
          ),
        },
      },
    );
    assert.equal(response.result.isError, true);
    assert.deepEqual(JSON.parse(response.result.content[0].text), {
      error: {
        code: "host_processing_consent_invalid",
        message: "The Host processing consent is invalid or changed.",
      },
    });
    assert.doesNotMatch(response.result.content[0].text, /runtime-capsule/u);

    const adopted = callTool(
      "kdna.workspace-load",
      {
        cwd: workspace,
        task: "Draft this article.",
        profile: "compact",
      },
      { cwd: workspace, env: initialConsent },
    );
    assert.equal(adopted.adoption, "load");
    assert.equal(
      adopted.host_processing.processing_boundary.processor,
      "Newly Approved Remote Processor",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Host identity, destination, asset, scope, and profile drift fail closed", () => {
  const cases = [
    {
      label: "host",
      hostId: "approved-host",
      environment: { KDNA_MCP_HOST_ID: "different-host" },
      expected: "host_processing_consent_invalid",
    },
    {
      label: "unknown-destination",
      processingBoundary: { kind: "unknown", processor: "Nobody" },
      expected: "host_processing_destination_unknown",
    },
    {
      label: "self-claimed-local",
      processingBoundary: { kind: "verified_local_only" },
      expected: "local_processing_attestation_required",
    },
    {
      label: "asset",
      document: { asset_digest: `sha256:${"a".repeat(64)}` },
      expected: "host_processing_consent_invalid",
    },
    {
      label: "scope",
      useBoundary: {
        kind: "workspace_attachment",
        attachment_id: "att_000000000000000000000000",
        scope_digest: `sha256:${"b".repeat(64)}`,
      },
      expected: "host_processing_consent_invalid",
    },
  ];
  for (const candidate of cases) {
    const root = temporaryRoot(`processing-${candidate.label}`);
    try {
      const workspace = path.join(root, "project");
      fs.mkdirSync(workspace);
      const attached = attach(
        workspace,
        makeKdnaContainer(root, `processing-${candidate.label}`),
      );
      const environment = {
        ...processingApproval(
          root,
          workspace,
          attached.attachment.asset.digest,
          "compact",
          candidate,
        ),
        ...(candidate.environment || {}),
      };
      const response = invoke(
        "kdna.workspace-load",
        {
          cwd: workspace,
          task: "Draft this article.",
          profile: candidate.label === "profile" ? "full" : "compact",
        },
        { env: environment },
      );
      assert.equal(response.result.isError, true, candidate.label);
      assert.equal(
        JSON.parse(response.result.content[0].text).error.code,
        candidate.expected,
        candidate.label,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  const root = temporaryRoot("processing-profile");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const attached = attach(
      workspace,
      makeKdnaContainer(root, "processing-profile"),
    );
    const response = invoke(
      "kdna.workspace-load",
      { cwd: workspace, task: "Draft this article.", profile: "full" },
      {
        env: processingApproval(
          root,
          workspace,
          attached.attachment.asset.digest,
          "compact",
        ),
      },
    );
    assert.equal(response.result.isError, true);
    assert.equal(
      JSON.parse(response.result.content[0].text).error.code,
      "host_processing_consent_invalid",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a private process authorization file enables an exact protected workspace load", { skip: !cliSupportsDeferredAuthorization() && "requires CLI --defer-password-authorization" }, () => {
  const root = temporaryRoot("protected-adoption");
  const password = "protected-adoption-test-password";
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const protectedAsset = makeProtectedKdnaContainer(workspace, password);
    const attached = attach(workspace, protectedAsset, {
      role: "article-writing",
      appliesTo: "draft",
      doesNotApplyTo: "code",
    });
    const recordPath = path.join(workspace, ".kdna", "attachments.json");
    const recordBefore = fs.readFileSync(recordPath);
    const authorizationFile = writeAuthorizationFile(root, password);
    const environment = {
      KDNA_MCP_AUTHORIZATION_FILE: authorizationFile,
      NODE_OPTIONS: authorizationEnvironmentGuard(root),
      ...processingApproval(
        root,
        workspace,
        attached.attachment.asset.digest,
      ),
    };

    const adopted = callTool(
      "kdna.workspace-load",
      { cwd: workspace, task: "Please draft the article.", profile: "compact" },
      { env: environment },
    );

    assert.equal(adopted.adoption, "load");
    assert.equal(
      adopted.resolution.selected.attachment_id,
      attached.attachment.attachment_id,
    );
    assert.equal(adopted.resolution.authorization, "satisfied");
    assert.equal(adopted.resolution.integrity, "verified");
    assert.equal(adopted.load_plan.state, "needs_password");
    assert.equal(adopted.load_plan.can_load_now, false);
    assert.equal(adopted.runtime_capsule.type, "kdna.runtime-capsule");
    assert.equal(
      adopted.runtime_capsule.digests.asset.value,
      attached.attachment.asset.digest,
    );
    assert.doesNotMatch(JSON.stringify(adopted), new RegExp(password, "u"));
    assert.deepEqual(fs.readFileSync(recordPath), recordBefore);
    assert.equal(fs.readFileSync(authorizationFile, "utf8"), `${password}\n`);

  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("protected workspace authorization preserves password bytes and rejects invalid or oversized UTF-8", { skip: !cliSupportsDeferredAuthorization() && "requires CLI --defer-password-authorization" }, () => {
  const root = temporaryRoot("authorization-bytes");
  const password = "  leading and trailing spaces  ";
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const asset = makeProtectedKdnaContainer(root, password);
    const attached = attach(workspace, asset);
    const processing = processingApproval(
      root,
      workspace,
      attached.attachment.asset.digest,
    );
    const crlf = path.join(root, "authorization-crlf");
    fs.writeFileSync(crlf, Buffer.from(`${password}\r\n`, "utf8"), {
      mode: 0o600,
    });
    const adopted = callTool(
      "kdna.workspace-load",
      { cwd: workspace, task: "Draft this article.", profile: "compact" },
      {
        env: {
          ...processing,
          KDNA_MCP_AUTHORIZATION_FILE: crlf,
        },
      },
    );
    assert.equal(adopted.adoption, "load");
    assert.equal(adopted.runtime_capsule.type, "kdna.runtime-capsule");
    assert.doesNotMatch(JSON.stringify(adopted), /leading and trailing/u);

    for (const [label, bytes] of [
      ["invalid", Buffer.from([0xff])],
      ["oversized", Buffer.alloc(16 * 1024 + 1, 0x61)],
    ]) {
      const authorizationFile = path.join(root, `authorization-${label}`);
      fs.writeFileSync(authorizationFile, bytes, { mode: 0o600 });
      bytes.fill(0);
      const response = invoke(
        "kdna.workspace-load",
        { cwd: workspace, task: "Draft this article.", profile: "compact" },
        {
          env: {
            ...processing,
            KDNA_MCP_AUTHORIZATION_FILE: authorizationFile,
          },
        },
      );
      assert.equal(response.result.isError, true, label);
      assert.equal(
        JSON.parse(response.result.content[0].text).error.code,
        "authorization_source_invalid",
        label,
      );
      assert.doesNotMatch(response.result.content[0].text, /aaaa|password/u);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test(
  "process authorization rejects non-private files, symlinks, and wrong values without a capsule",
  { skip: process.platform === "win32" || !cliSupportsDeferredAuthorization() },
  () => {
    const root = temporaryRoot("authorization-hostile");
    const password = "authorization-hostile-test-password";
    try {
      const workspace = path.join(root, "project");
      fs.mkdirSync(workspace);
      const attached = attach(
        workspace,
        makeProtectedKdnaContainer(root, password),
      );
      const task = {
        cwd: workspace,
        task: "Please draft the article.",
        profile: "compact",
      };

      const exposed = writeAuthorizationFile(root, password, 0o644);
      const exposedResponse = invoke("kdna.workspace-load", task, {
        env: { KDNA_MCP_AUTHORIZATION_FILE: exposed },
      });
      assert.equal(exposedResponse.result.isError, true);
      assert.deepEqual(
        JSON.parse(exposedResponse.result.content[0].text).error,
        {
          code: "authorization_source_invalid",
          message: "The process authorization source is invalid.",
        },
      );

      const privateFile = writeAuthorizationFile(root, password);
      const linked = path.join(root, "linked-authorization");
      fs.symlinkSync(privateFile, linked);
      const linkedResponse = invoke("kdna.workspace-load", task, {
        env: { KDNA_MCP_AUTHORIZATION_FILE: linked },
      });
      assert.equal(linkedResponse.result.isError, true);
      assert.equal(
        JSON.parse(linkedResponse.result.content[0].text).error.code,
        "authorization_source_invalid",
      );

      const wrong = writeAuthorizationFile(root, "wrong-test-value");
      const wrongResponse = invoke("kdna.workspace-load", task, {
        env: {
          KDNA_MCP_AUTHORIZATION_FILE: wrong,
          ...processingApproval(
            root,
            workspace,
            attached.attachment.asset.digest,
          ),
        },
      });
      assert.equal(wrongResponse.result.isError, true);
      assert.equal(
        JSON.parse(wrongResponse.result.content[0].text).error.code,
        "authorization_rejected",
      );
      assert.doesNotMatch(
        wrongResponse.result.content[0].text,
        /wrong-test-value|authorization-hostile-test-password/u,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  },
);

test("authorization source replacement after resolve fails closed before runtime load", { skip: !cliSupportsDeferredAuthorization() && "requires CLI --defer-password-authorization" }, () => {
  const root = temporaryRoot("authorization-replacement");
  const password = "authorization-replacement-test-password";
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const attached = attach(
      workspace,
      makeProtectedKdnaContainer(root, password),
    );
    const authorizationFile = writeAuthorizationFile(root, password);
    const guard = authorizationReplacementEnvironmentGuard(
      root,
      authorizationFile,
    );
    const response = invoke(
      "kdna.workspace-load",
      {
        cwd: workspace,
        task: "Please draft the article.",
        profile: "compact",
      },
      {
        env: {
          KDNA_MCP_AUTHORIZATION_FILE: authorizationFile,
          NODE_OPTIONS: guard.nodeOptions,
          ...processingApproval(
            root,
            workspace,
            attached.attachment.asset.digest,
          ),
        },
      },
    );
    assert.equal(response.result.isError, true);
    assert.deepEqual(JSON.parse(response.result.content[0].text), {
      error: {
        code: "authorization_source_invalid",
        message: "The process authorization source is invalid.",
      },
    });
    assert.equal(fs.existsSync(guard.loadMarker), false);
    assert.doesNotMatch(
      response.result.content[0].text,
      new RegExp(password, "u"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("workspace load binds one exact workspace attachment through result delivery", () => {
  const root = temporaryRoot("bound-delivery");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const attached = attach(
      workspace,
      makeKdnaContainer(root, "bound-delivery"),
    );
    const recordPath = path.join(workspace, ".kdna", "attachments.json");
    const recordBefore = fs.readFileSync(recordPath);

    const adopted = callTool(
      "kdna.workspace-load",
      {
        cwd: workspace,
        task: "Draft this article.",
      },
      {
        env: processingApproval(
          root,
          workspace,
          attached.attachment.asset.digest,
        ),
      },
    );

    assert.equal(
      adopted.resolution.selected.attachment_id,
      attached.attachment.attachment_id,
    );
    assert.equal(
      adopted.runtime_capsule.digests.asset.value,
      attached.attachment.asset.digest,
    );
    assert.deepEqual(fs.readFileSync(recordPath), recordBefore);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("workspace load rejects a selected attachment that changes before runtime load", () => {
  const root = temporaryRoot("binding-change");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const attached = attach(
      workspace,
      makeKdnaContainer(root, "binding-change"),
    );
    const hook = writeCliMutationHook(root, {
      trigger: "plan-load",
      mutation: "disable",
      recordPath: path.join(workspace, ".kdna", "attachments.json"),
    });

    const response = invoke(
      "kdna.workspace-load",
      { cwd: workspace, task: "Draft this article." },
      {
        env: {
          ...hook.env,
          ...processingApproval(
            root,
            workspace,
            attached.attachment.asset.digest,
          ),
        },
      },
    );

    assert.equal(response.result.isError, true);
    assert.deepEqual(JSON.parse(response.result.content[0].text), {
      error: {
        code: "workspace_binding_changed",
        message: "The approved workspace attachment changed during loading.",
      },
    });
    assert.equal(fs.existsSync(hook.loadMarker), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("workspace load never falls through to a record outside the Host root", () => {
  const root = temporaryRoot("outer-workspace");
  try {
    const parent = path.join(root, "parent");
    const hostRoot = path.join(parent, "host-root");
    fs.mkdirSync(hostRoot, { recursive: true });
    attach(parent, makeKdnaContainer(root, "outside-host"));
    attach(hostRoot, makeKdnaContainer(root, "inside-host"));
    const hook = writeCliMutationHook(root, {
      trigger: "resolve",
      mutation: "remove-record",
      recordPath: path.join(hostRoot, ".kdna", "attachments.json"),
    });

    const response = invoke(
      "kdna.workspace-load",
      { cwd: hostRoot, task: "Draft this article." },
      { cwd: hostRoot, env: hook.env },
    );

    assert.equal(response.result.isError, true);
    assert.deepEqual(JSON.parse(response.result.content[0].text), {
      error: {
        code: "workspace_binding_changed",
        message: "The approved workspace attachment changed during loading.",
      },
    });
    assert.equal(fs.existsSync(hook.loadMarker), false);
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
    assert.equal(outside.resolution.reason_code, "explicitly_outside_scope");
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

test("ask receipt continues one explicit user selection through exact workspace load", () => {
  const root = temporaryRoot("selection-continuation");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const first = attach(
      workspace,
      makeKdnaContainer(root, "selection-first"),
      {
        role: "article-writing-one",
      },
    );
    attach(workspace, makeKdnaContainer(root, "selection-second"), {
      role: "article-writing-two",
    });
    const task = "Please draft this article.";
    const initial = callTool("kdna.workspace-load", {
      cwd: workspace,
      task,
    });
    assert.equal(initial.adoption, "ask");
    assert.equal(initial.runtime_capsule, null);
    assert.match(
      initial.resolution.selection_plan.task_digest,
      /^sha256:[0-9a-f]{64}$/u,
    );

    const selection = {
      attachment_id: first.attachment.attachment_id,
      task_digest: initial.resolution.selection_plan.task_digest,
      plan_digest: initial.resolution.selection_plan.plan_digest,
      approved: true,
    };
    const adopted = callTool(
      "kdna.workspace-load",
      {
        cwd: workspace,
        task,
        selection,
        profile: "compact",
      },
      {
        env: processingApproval(
          root,
          workspace,
          first.attachment.asset.digest,
        ),
      },
    );
    assert.equal(adopted.adoption, "load");
    assert.equal(
      adopted.resolution.reason_code,
      "explicit_task_attachment_selection",
    );
    assert.equal(
      adopted.resolution.selected.attachment_id,
      first.attachment.attachment_id,
    );
    assert.equal(
      adopted.runtime_capsule.digests.asset.value,
      first.attachment.asset.digest,
    );
    assert.deepEqual(adopted.one_task_selection, {
      attachment_id: first.attachment.attachment_id,
      task_digest: selection.task_digest,
      persisted: false,
    });

    const unrelated = callTool("kdna.workspace-load", {
      cwd: workspace,
      task: "Review this code.",
    });
    assert.equal(unrelated.adoption, "skip");
    assert.equal(unrelated.one_task_selection, null);
    const replay = callTool("kdna.workspace-load", {
      cwd: workspace,
      task: "Review this code.",
      selection,
    });
    assert.equal(replay.adoption, "block");
    assert.equal(replay.resolution.reason_code, "selection_binding_changed");
    assert.equal(replay.runtime_capsule, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("one-task selection rejects candidate, task, and asset drift", () => {
  const makeAsk = (label) => {
    const workspace = path.join(root, label);
    fs.mkdirSync(workspace);
    const first = attach(workspace, makeKdnaContainer(root, `${label}-first`), {
      role: `${label}-one`,
    });
    attach(workspace, makeKdnaContainer(root, `${label}-second`), {
      role: `${label}-two`,
    });
    const task = "Draft this article.";
    const initial = callTool("kdna.workspace-resolve", {
      cwd: workspace,
      task,
    });
    return {
      workspace,
      task,
      first,
      initial,
      selection: {
        attachment_id: first.attachment.attachment_id,
        task_digest: initial.selection_plan.task_digest,
        plan_digest: initial.selection_plan.plan_digest,
        approved: true,
      },
    };
  };
  const root = temporaryRoot("selection-drift");
  try {
    const taskDrift = makeAsk("task");
    let result = callTool("kdna.workspace-load", {
      cwd: taskDrift.workspace,
      task: "Draft a different article.",
      selection: taskDrift.selection,
    });
    assert.equal(result.adoption, "block");
    assert.equal(result.resolution.reason_code, "selection_binding_changed");

    const candidateDrift = makeAsk("candidate");
    attach(
      candidateDrift.workspace,
      makeKdnaContainer(root, "candidate-third"),
      { role: "candidate-three" },
    );
    result = callTool("kdna.workspace-load", {
      cwd: candidateDrift.workspace,
      task: candidateDrift.task,
      selection: candidateDrift.selection,
    });
    assert.equal(result.adoption, "block");
    assert.equal(result.resolution.reason_code, "selection_binding_changed");

    const assetDrift = makeAsk("asset");
    const snapshot = path.join(
      assetDrift.workspace,
      ".kdna",
      assetDrift.first.attachment.asset.snapshot,
    );
    fs.appendFileSync(snapshot, "drift");
    result = callTool("kdna.workspace-load", {
      cwd: assetDrift.workspace,
      task: assetDrift.task,
      selection: assetDrift.selection,
    });
    assert.equal(result.adoption, "block");
    assert.equal(result.resolution.reason_code, "snapshot_digest_mismatch");
    assert.equal(result.runtime_capsule, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an exact attachment ID in the task is a one-task selection without a prior ask receipt", () => {
  const root = temporaryRoot("selection-exact-name");
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const first = attach(workspace, makeKdnaContainer(root, "named-first"), {
      role: "named-one",
    });
    attach(workspace, makeKdnaContainer(root, "named-second"), {
      role: "named-two",
    });
    const task = `Use attachment ${first.attachment.attachment_id} for this task.`;
    const selection = {
      attachment_id: first.attachment.attachment_id,
      task_digest: `sha256:${crypto.createHash("sha256").update(task).digest("hex")}`,
      approved: true,
    };
    const adopted = callTool(
      "kdna.workspace-load",
      {
        cwd: workspace,
        task,
        selection,
      },
      {
        env: processingApproval(
          root,
          workspace,
          first.attachment.asset.digest,
        ),
      },
    );
    assert.equal(adopted.adoption, "load");
    assert.equal(
      adopted.resolution.reason_code,
      "explicit_task_attachment_selection",
    );
    assert.equal(
      adopted.resolution.selected.attachment_id,
      first.attachment.attachment_id,
    );
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

    const childResolution = callTool(
      "kdna.workspace-resolve",
      {
        cwd: child,
        task: "Draft this article.",
      },
      { cwd: parent },
    );
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

    for (const escapedPath of [parent, sibling]) {
      const escaped = invoke(
        "kdna.workspace-status",
        { cwd: escapedPath },
        { cwd: hostRoot },
      );
      assert.equal(escaped.result.isError, true);
      assert.deepEqual(JSON.parse(escaped.result.content[0].text), {
        error: {
          code: "workspace_outside_host_root",
          message: "The requested workspace is outside the current Host root.",
        },
      });
    }

    const linked = path.join(hostRoot, "linked-workspace");
    fs.symlinkSync(sibling, linked);
    const symlinked = invoke(
      "kdna.workspace-status",
      { cwd: linked },
      { cwd: hostRoot },
    );
    assert.equal(symlinked.result.isError, true);
    assert.deepEqual(JSON.parse(symlinked.result.content[0].text), {
      error: {
        code: "workspace_unavailable",
        message: "The requested Host workspace is unavailable.",
      },
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("MCP passes one exact Host root to every workspace CLI lookup", () => {
  const root = temporaryRoot("boundary-forwarding");
  try {
    const workspace = path.join(root, "project");
    const nested = path.join(workspace, "nested");
    fs.mkdirSync(nested, { recursive: true });
    const attached = attach(
      workspace,
      makeKdnaContainer(root, "boundary-forwarding"),
    );
    const nodeOptions = workspaceBoundaryEnvironmentGuard(
      root,
      fs.realpathSync(workspace),
    );
    const processingEnv = processingApproval(
      root,
      workspace,
      attached.attachment.asset.digest,
    );

    const status = callTool(
      "kdna.workspace-status",
      { cwd: nested },
      {
        cwd: workspace,
        env: { NODE_OPTIONS: nodeOptions },
      },
    );
    assert.equal(status.attachments.attachments.length, 1);
    const resolution = callTool(
      "kdna.workspace-resolve",
      { cwd: nested, task: "Draft this article." },
      { cwd: workspace, env: { NODE_OPTIONS: nodeOptions } },
    );
    assert.equal(resolution.decision, "load");
    assert.equal(resolution.selected.asset_id, "kdna:test:boundary-forwarding");
    const adoption = callTool(
      "kdna.workspace-load",
      { cwd: nested, task: "Draft this article.", profile: "compact" },
      {
        cwd: workspace,
        env: { NODE_OPTIONS: nodeOptions, ...processingEnv },
      },
    );
    assert.equal(adoption.adoption, "load");
    assert.equal(
      adoption.resolution.selected.attachment_id,
      status.attachments.attachments[0].attachment_id,
    );
    assert.equal(
      adoption.resolution.selected.digest,
      status.attachments.attachments[0].asset.digest,
    );
    assert.equal(
      adoption.runtime_capsule.digests.asset.value,
      status.attachments.attachments[0].asset.digest,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an immutable Host root is explicit and independent of the server launch directory", () => {
  const root = temporaryRoot("launch-root");
  try {
    const workspace = path.join(root, "project");
    const nested = path.join(workspace, "nested");
    fs.mkdirSync(nested, { recursive: true });
    attach(workspace, makeKdnaContainer(root, "launch-root"));
    for (const launchCwd of [
      path.dirname(server),
      os.homedir(),
      workspace,
      nested,
    ]) {
      const status = callTool(
        "kdna.workspace-status",
        { cwd: nested },
        { cwd: launchCwd, hostRoot: workspace },
      );
      assert.equal(status.attachments.attachments.length, 1);
    }

    for (const configured of [
      "",
      "relative/project",
      os.homedir(),
      path.parse(workspace).root,
      path.join(root, "linked-root"),
    ]) {
      if (configured.endsWith("linked-root")) {
        fs.symlinkSync(workspace, configured);
      }
      const result = rawServer(
        { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
        {
          cwd: path.dirname(server),
          env: { KDNA_MCP_WORKSPACE_ROOT: configured },
        },
      );
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Host workspace root is invalid/u);
      assert.equal(result.stdout, "");
    }

    const nodeOptions = hostRootDriftEnvironmentGuard(root, workspace);
    const drift = invoke(
      "kdna.workspace-status",
      { cwd: nested },
      {
        cwd: path.dirname(server),
        hostRoot: workspace,
        env: { NODE_OPTIONS: nodeOptions },
      },
    );
    assert.equal(drift.result.isError, true, JSON.stringify(drift));
    assert.deepEqual(JSON.parse(drift.result.content[0].text), {
      error: {
        code: "host_workspace_root_changed",
        message: "The Host workspace root changed after MCP startup.",
      },
    });

    const forged = invoke(
      "kdna.workspace-status",
      { cwd: nested, workspace_root: root },
      { cwd: path.dirname(server), hostRoot: workspace },
    );
    assert.equal(forged.error.code, -32602);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("HOME cannot be a Host root and symlinked .kdna records are never project authority", () => {
  const root = temporaryRoot("home-boundary");
  try {
    attach(root, makeKdnaContainer(root, "home-record"));
    const homeStart = spawnSync(process.execPath, [server], {
      input: `${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      })}\n`,
      encoding: "utf8",
      cwd: root,
      env: {
        ...process.env,
        HOME: root,
        KDNA_MCP_WORKSPACE_ROOT: root,
      },
    });
    assert.notEqual(homeStart.status, 0);
    assert.match(homeStart.stderr, /Host workspace root is invalid/u);
    assert.equal(homeStart.stdout, "");

    const hostRoot = path.join(root, "host");
    const project = path.join(hostRoot, "project");
    fs.mkdirSync(project, { recursive: true });
    fs.symlinkSync(path.join(root, ".kdna"), path.join(project, ".kdna"));
    const linkedRecord = invoke(
      "kdna.workspace-status",
      { cwd: project },
      { cwd: path.dirname(server), hostRoot },
    );
    assert.equal(linkedRecord.result.isError, true);
    assert.deepEqual(JSON.parse(linkedRecord.result.content[0].text), {
      error: {
        code: "workspace_contract_invalid",
        message: "The workspace attachment directory is invalid.",
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
    const attached = attach(
      workspace,
      makeKdnaContainer(root, "immutable"),
    );
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
    callTool(
      "kdna.workspace-load",
      {
        cwd: workspace,
        task: "Draft this article.",
      },
      {
        env: processingApproval(
          root,
          workspace,
          attached.attachment.asset.digest,
        ),
      },
    );
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
    "missing-workspace",
  );
  const response = invoke(
    "kdna.workspace-status",
    { cwd: missing },
    { cwd: process.cwd() },
  );
  assert.equal(response.result.isError, true);
  const text = response.result.content[0].text;
  assert.doesNotMatch(text, /private-customer-path|missing-workspace/u);
  assert.deepEqual(JSON.parse(text), {
    error: {
      code: "workspace_unavailable",
      message: "The requested Host workspace is unavailable.",
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
  assert.equal(
    invoke("kdna.workspace-load", {
      cwd: ".",
      task: "draft",
      processing_consent: { approved: true },
    }).error.code,
    -32602,
  );
  for (const selection of [
    {
      attachment_id: "att_000000000000000000000000",
      task_digest: `sha256:${"0".repeat(64)}`,
      approved: false,
    },
    {
      attachment_id: "att_000000000000000000000000",
      task_digest: `sha256:${"0".repeat(64)}`,
      approved: true,
      extra: true,
    },
  ]) {
    assert.equal(
      invoke("kdna.workspace-load", {
        cwd: ".",
        task: "draft",
        selection,
      }).error.code,
      -32602,
    );
  }
});

test("notifications produce no response", () => {
  const response = rpc({
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {},
  });
  assert.equal(response, null);
});
