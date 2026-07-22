#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageInfo = require("../package.json");
const cliPackagePath = require.resolve("@aikdna/kdna-cli/package.json");
const cliPackageInfo = require(cliPackagePath);

const ADAPTER_SCHEMA = "0.1.0";
const MAX_TASK_BYTES = 64 * 1024;
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;
const MAX_PATH_LENGTH = 4096;
const CLI_VERSION = packageInfo.kdna_runtime?.cli;
const CORE_VERSION = packageInfo.kdna_runtime?.core;
const CLI_ENTRY = path.resolve(
  path.dirname(cliPackagePath),
  cliPackageInfo.bin?.kdna || "",
);
const HOST_WORKSPACE_ROOT = fs.realpathSync(process.cwd());
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const ATTACHMENT_ID_PATTERN = /^att_[0-9a-f]{24}$/u;

if (
  CLI_VERSION !== "0.36.0" ||
  CORE_VERSION !== "0.21.0" ||
  packageInfo.kdna_runtime?.workspace_schema !== ADAPTER_SCHEMA ||
  cliPackageInfo.name !== "@aikdna/kdna-cli" ||
  cliPackageInfo.version !== CLI_VERSION ||
  !cliPackageInfo.bin?.kdna ||
  !fs.existsSync(CLI_ENTRY)
) {
  throw new Error("The KDNA MCP runtime binding is invalid.");
}

const tools = [
  {
    name: "kdna.inspect",
    description:
      "Inspect one explicitly selected .kdna file through the pinned KDNA CLI.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
      },
    },
  },
  {
    name: "kdna.verify",
    description:
      "Validate one explicitly selected .kdna file through the pinned KDNA CLI.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
      },
    },
  },
  {
    name: "kdna.plan-load",
    description:
      "Return the official LoadPlan for one explicitly selected .kdna file.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
      },
    },
  },
  {
    name: "kdna.load",
    description:
      "Load one explicitly selected .kdna file after official authorization checks.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
        profile: {
          type: "string",
          enum: ["index", "compact", "scenario", "full"],
        },
      },
    },
  },
  {
    name: "kdna.workspace-status",
    description:
      "Show only the approved attachments for the current workspace; never scan globally.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["cwd"],
      properties: {
        cwd: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
      },
    },
  },
  {
    name: "kdna.workspace-resolve",
    description:
      "Resolve one task only against approved attachments in the current workspace.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["cwd", "task"],
      properties: {
        cwd: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
        task: { type: "string", minLength: 1, maxLength: MAX_TASK_BYTES },
      },
    },
  },
  {
    name: "kdna.workspace-load",
    description:
      "Resolve, plan, authorize, and load one approved workspace attachment when applicable.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["cwd", "task"],
      properties: {
        cwd: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
        task: { type: "string", minLength: 1, maxLength: MAX_TASK_BYTES },
        profile: {
          type: "string",
          enum: ["index", "compact", "scenario", "full"],
        },
      },
    },
  },
];

const toolDefinitions = new Map(tools.map((tool) => [tool.name, tool]));

class JsonRpcError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

class AdapterError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function validatedJsonRpcMessage(message) {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    throw new JsonRpcError(-32600, "Invalid Request");
  }
  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    throw new JsonRpcError(-32600, "Invalid Request");
  }

  const hasId = Object.prototype.hasOwnProperty.call(message, "id");
  if (hasId) {
    const validId =
      typeof message.id === "string" ||
      (typeof message.id === "number" && Number.isFinite(message.id));
    if (!validId) throw new JsonRpcError(-32600, "Invalid Request");
  }

  return {
    id: message.id,
    method: message.method,
    params: message.params === undefined ? {} : message.params,
    paramsValid:
      message.params === undefined ||
      (message.params !== null &&
        typeof message.params === "object" &&
        !Array.isArray(message.params)),
    isNotification: !hasId,
  };
}

function sendResult(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function sendError(id, code, message) {
  process.stdout.write(
    `${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`,
  );
}

function textResult(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

function toolErrorResult(error) {
  const safe =
    error instanceof AdapterError
      ? { code: error.code, message: error.message }
      : {
          code: "adapter_internal_error",
          message: "The KDNA adapter could not complete the request.",
        };
  return {
    content: [{ type: "text", text: JSON.stringify({ error: safe }, null, 2) }],
    isError: true,
  };
}

function validBoundedString(value, maximum = MAX_PATH_LENGTH) {
  return (
    typeof value === "string" && value.length > 0 && value.length <= maximum
  );
}

function hasExactKeys(value, required, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((key) => Object.prototype.hasOwnProperty.call(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
}

function validateToolArguments(name, args) {
  if (!toolDefinitions.has(name)) return false;
  if (["kdna.inspect", "kdna.verify", "kdna.plan-load"].includes(name)) {
    return (
      hasExactKeys(args, ["assetPath"]) && validBoundedString(args.assetPath)
    );
  }
  if (name === "kdna.load") {
    return (
      hasExactKeys(args, ["assetPath"], ["profile"]) &&
      validBoundedString(args.assetPath) &&
      (args.profile === undefined ||
        ["index", "compact", "scenario", "full"].includes(args.profile))
    );
  }
  if (name === "kdna.workspace-status") {
    return hasExactKeys(args, ["cwd"]) && validBoundedString(args.cwd);
  }
  if (["kdna.workspace-resolve", "kdna.workspace-load"].includes(name)) {
    const optional = name === "kdna.workspace-load" ? ["profile"] : [];
    return (
      hasExactKeys(args, ["cwd", "task"], optional) &&
      validBoundedString(args.cwd) &&
      validBoundedString(args.task, MAX_TASK_BYTES) &&
      Buffer.byteLength(args.task, "utf8") <= MAX_TASK_BYTES &&
      (args.profile === undefined ||
        ["index", "compact", "scenario", "full"].includes(args.profile))
    );
  }
  return false;
}

function validatedToolCall(params) {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    throw new JsonRpcError(-32602, "Invalid params");
  }
  if (typeof params.name !== "string" || !toolDefinitions.has(params.name)) {
    throw new JsonRpcError(-32602, "Invalid params");
  }
  const args = params.arguments === undefined ? {} : params.arguments;
  if (!validateToolArguments(params.name, args))
    throw new JsonRpcError(-32602, "Invalid params");
  return { name: params.name, args };
}

function parseCliJson(result, acceptedStatuses) {
  if (result.error) {
    throw new AdapterError(
      "runtime_unavailable",
      "The pinned KDNA CLI runtime is unavailable.",
    );
  }
  if (!acceptedStatuses.has(result.status)) {
    throw new AdapterError(
      "runtime_rejected",
      "The pinned KDNA CLI rejected the request.",
    );
  }
  if (
    !result.stdout ||
    Buffer.byteLength(result.stdout, "utf8") > MAX_OUTPUT_BYTES
  ) {
    throw new AdapterError(
      "runtime_output_invalid",
      "The pinned KDNA CLI returned invalid output.",
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new AdapterError(
      "runtime_output_invalid",
      "The pinned KDNA CLI returned invalid output.",
    );
  }
}

function runCliJson(args, options = {}) {
  const result = spawnSync(process.execPath, [CLI_ENTRY, ...args], {
    cwd: options.cwd || process.cwd(),
    env: process.env,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: MAX_OUTPUT_BYTES,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return parseCliJson(result, new Set(options.acceptedStatuses || [0]));
}

function writePrivateTask(task) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kdna-mcp-task-"));
  let descriptor;
  try {
    fs.chmodSync(directory, 0o700);
    const taskFile = path.join(directory, "task.txt");
    descriptor = fs.openSync(
      taskFile,
      fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL,
      0o600,
    );
    fs.writeFileSync(descriptor, task, "utf8");
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    return { directory, taskFile };
  } catch (error) {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

function withinHostRoot(candidate) {
  const relative = path.relative(HOST_WORKSPACE_ROOT, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function workspaceCwd(value) {
  let resolved;
  try {
    resolved = fs.realpathSync(path.resolve(value));
    if (!fs.statSync(resolved).isDirectory())
      throw new Error("not a directory");
  } catch {
    throw new AdapterError(
      "workspace_unavailable",
      "The requested Host workspace is unavailable.",
    );
  }
  if (!withinHostRoot(resolved)) {
    throw new AdapterError(
      "workspace_outside_host_root",
      "The requested workspace is outside the current Host root.",
    );
  }
  return resolved;
}

function hasWorkspaceRecordWithinHost(cwd) {
  let current = cwd;
  while (true) {
    if (fs.existsSync(path.join(current, ".kdna", "attachments.json")))
      return true;
    if (current === HOST_WORKSPACE_ROOT) return false;
    const parent = path.dirname(current);
    if (parent === current || !withinHostRoot(parent)) return false;
    current = parent;
  }
}

function noAttachmentResolution() {
  return {
    document_type: "kdna.workspace-resolution",
    schema_version: ADAPTER_SCHEMA,
    decision: "skip",
    reason_code: "no_approved_attachment",
    workspace_root: ".",
    selected: null,
    candidates: [],
    authorization: "not_checked",
    integrity: "not_checked",
  };
}

function validCandidate(candidate) {
  return (
    hasExactKeys(candidate, [
      "attachment_id",
      "asset_id",
      "version",
      "digest",
      "role",
    ]) &&
    ATTACHMENT_ID_PATTERN.test(candidate.attachment_id) &&
    validBoundedString(candidate.asset_id, 512) &&
    validBoundedString(candidate.version, 128) &&
    DIGEST_PATTERN.test(candidate.digest) &&
    validBoundedString(candidate.role, 512)
  );
}

function validateResolution(resolution) {
  const reasons = new Set([
    "single_approved_attachment_clearly_applies",
    "no_approved_attachment",
    "outside_scope",
    "ambiguous_scope",
    "attachment_conflict",
    "adapter_incompatible",
    "attachment_schema_unsupported",
    "snapshot_missing",
    "snapshot_digest_mismatch",
    "asset_invalid",
    "authorization_required",
  ]);
  const exact = hasExactKeys(resolution, [
    "document_type",
    "schema_version",
    "decision",
    "reason_code",
    "workspace_root",
    "selected",
    "candidates",
    "authorization",
    "integrity",
  ]);
  const valid =
    exact &&
    resolution.document_type === "kdna.workspace-resolution" &&
    resolution.schema_version === ADAPTER_SCHEMA &&
    ["load", "ask", "skip", "block"].includes(resolution.decision) &&
    reasons.has(resolution.reason_code) &&
    validBoundedString(resolution.workspace_root) &&
    !path.isAbsolute(resolution.workspace_root) &&
    !resolution.workspace_root.includes("\0") &&
    Array.isArray(resolution.candidates) &&
    resolution.candidates.length <= 64 &&
    resolution.candidates.every(validCandidate) &&
    ["not_checked", "required", "satisfied"].includes(
      resolution.authorization,
    ) &&
    ["not_checked", "verified", "failed"].includes(resolution.integrity) &&
    (resolution.selected === null || validCandidate(resolution.selected));

  if (
    !valid ||
    (resolution.decision === "load") !== (resolution.selected !== null)
  ) {
    throw new AdapterError(
      "resolver_contract_invalid",
      "The official resolver returned an invalid contract.",
    );
  }
  if (
    resolution.decision === "load" &&
    (resolution.authorization !== "satisfied" ||
      resolution.integrity !== "verified")
  ) {
    throw new AdapterError(
      "resolver_contract_invalid",
      "The official resolver returned an invalid contract.",
    );
  }
  return resolution;
}

function resolveWorkspace(cwd, task) {
  const safeCwd = workspaceCwd(cwd);
  if (!hasWorkspaceRecordWithinHost(safeCwd)) return noAttachmentResolution();
  const temporary = writePrivateTask(task);
  try {
    return validateResolution(
      runCliJson([
        "resolve",
        "--cwd",
        safeCwd,
        "--task-file",
        temporary.taskFile,
        "--adapter-schema",
        ADAPTER_SCHEMA,
      ]),
    );
  } finally {
    fs.rmSync(temporary.directory, { recursive: true, force: true });
  }
}

function workspaceStatus(cwd) {
  const safeCwd = workspaceCwd(cwd);
  const record = hasWorkspaceRecordWithinHost(safeCwd)
    ? runCliJson(["attachments", "--cwd", safeCwd])
    : null;
  if (
    record !== null &&
    (!hasExactKeys(record, [
      "document_type",
      "schema_version",
      "workspace",
      "attachments",
    ]) ||
      record.document_type !== "kdna.workspace-attachments" ||
      record.schema_version !== ADAPTER_SCHEMA ||
      !Array.isArray(record.attachments))
  ) {
    throw new AdapterError(
      "workspace_contract_invalid",
      "The workspace attachment record is invalid.",
    );
  }
  return {
    document_type: "kdna.mcp.workspace-status",
    schema_version: ADAPTER_SCHEMA,
    attachments: record,
  };
}

function selectedScope(cwd, selected) {
  const status = workspaceStatus(cwd);
  const attachment = status.attachments?.attachments?.find(
    (item) => item?.attachment_id === selected.attachment_id,
  );
  if (
    !attachment ||
    attachment.state !== "enabled" ||
    attachment.role !== selected.role ||
    attachment.asset?.id !== selected.asset_id ||
    attachment.asset?.version !== selected.version ||
    attachment.asset?.digest !== selected.digest ||
    attachment.scope?.kind !== "workspace" ||
    !Array.isArray(attachment.scope.applies_to) ||
    !Array.isArray(attachment.scope.does_not_apply_to)
  ) {
    throw new AdapterError(
      "workspace_contract_invalid",
      "The selected workspace attachment changed during resolution.",
    );
  }
  return attachment.scope;
}

function snapshotPath(cwd, resolution) {
  const start = path.resolve(cwd);
  const workspaceRoot = path.resolve(start, resolution.workspace_root);
  const digestHex = resolution.selected.digest.slice("sha256:".length);
  const snapshot = path.join(
    workspaceRoot,
    ".kdna",
    "assets",
    `sha256-${digestHex}.kdna`,
  );
  const protectedRoot = path.join(workspaceRoot, ".kdna", "assets") + path.sep;
  if (!snapshot.startsWith(protectedRoot)) {
    throw new AdapterError(
      "resolver_contract_invalid",
      "The official resolver returned an invalid contract.",
    );
  }
  return snapshot;
}

function adapterInfo() {
  return {
    name: packageInfo.name,
    version: packageInfo.version,
    cli: `${cliPackageInfo.name}@${CLI_VERSION}`,
    core: `@aikdna/kdna-core@${CORE_VERSION}`,
  };
}

function adoptionControls(selected) {
  if (!selected) return null;
  return {
    view: "kdna attachments --cwd <workspace>",
    disable: `kdna disable ${selected.attachment_id} --cwd <workspace>`,
    switch: `kdna switch ${selected.attachment_id} <new-file.kdna> --cwd <workspace> --yes`,
    rollback: `kdna rollback ${selected.attachment_id} --cwd <workspace>`,
  };
}

function workspaceAdoption(cwd, resolution, additions = {}) {
  return {
    document_type: "kdna.mcp.workspace-adoption",
    schema_version: ADAPTER_SCHEMA,
    adapter: adapterInfo(),
    adoption: resolution.decision,
    resolution,
    scope: resolution.selected ? selectedScope(cwd, resolution.selected) : null,
    controls: adoptionControls(resolution.selected),
    load_plan: additions.loadPlan || null,
    runtime_capsule: additions.runtimeCapsule || null,
  };
}

function loadWorkspace(args) {
  const resolution = resolveWorkspace(args.cwd, args.task);
  if (resolution.decision !== "load")
    return workspaceAdoption(args.cwd, resolution);

  const snapshot = snapshotPath(args.cwd, resolution);
  const loadPlan = runCliJson(["plan-load", snapshot, "--json"], {
    acceptedStatuses: [0, 1, 3],
  });
  if (loadPlan?.can_load_now !== true) {
    throw new AdapterError(
      "authorization_required",
      "The approved attachment is not authorized for loading.",
    );
  }
  const runtimeCapsule = runCliJson([
    "load",
    snapshot,
    `--profile=${args.profile || "compact"}`,
    "--as=json",
  ]);
  return workspaceAdoption(args.cwd, resolution, { loadPlan, runtimeCapsule });
}

async function callTool(name, args) {
  if (name === "kdna.inspect") {
    return textResult(runCliJson(["inspect", args.assetPath, "--json"]));
  }
  if (name === "kdna.verify") {
    return textResult(
      runCliJson(["validate", args.assetPath, "--json"], {
        acceptedStatuses: [0, 1, 2],
      }),
    );
  }
  if (name === "kdna.plan-load") {
    return textResult(
      runCliJson(["plan-load", args.assetPath, "--json"], {
        acceptedStatuses: [0, 1, 3],
      }),
    );
  }
  if (name === "kdna.load") {
    return textResult(
      runCliJson([
        "load",
        args.assetPath,
        `--profile=${args.profile || "compact"}`,
        "--as=json",
      ]),
    );
  }
  if (name === "kdna.workspace-status")
    return textResult(workspaceStatus(args.cwd));
  if (name === "kdna.workspace-resolve") {
    return textResult(resolveWorkspace(args.cwd, args.task));
  }
  if (name === "kdna.workspace-load") return textResult(loadWorkspace(args));
  throw new AdapterError(
    "tool_unknown",
    "The requested KDNA tool is unavailable.",
  );
}

async function handle({ id, method, params }) {
  if (method === "initialize") {
    sendResult(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: packageInfo.name, version: packageInfo.version },
    });
    return;
  }
  if (method === "tools/list") {
    sendResult(id, { tools });
    return;
  }
  if (method === "tools/call") {
    let call;
    try {
      call = validatedToolCall(params);
    } catch (error) {
      if (error instanceof JsonRpcError) {
        sendError(id, error.code, error.message);
        return;
      }
      throw error;
    }
    try {
      sendResult(id, await callTool(call.name, call.args));
    } catch (error) {
      sendResult(id, toolErrorResult(error));
    }
    return;
  }
  if (id !== undefined) sendError(id, -32601, "Method not found");
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    sendError(null, -32700, "Parse error");
    return;
  }

  let request;
  try {
    request = validatedJsonRpcMessage(message);
  } catch (error) {
    if (error instanceof JsonRpcError) {
      sendError(null, error.code, error.message);
      return;
    }
    sendError(null, -32603, "Internal error");
    return;
  }

  if (request.isNotification) return;
  if (!request.paramsValid) {
    sendError(request.id, -32602, "Invalid params");
    return;
  }
  try {
    await handle(request);
  } catch {
    sendError(request.id, -32603, "Internal error");
  }
});
