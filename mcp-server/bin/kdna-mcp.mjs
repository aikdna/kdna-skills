#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageInfo = require("../package.json");
const cliPackagePath = require.resolve("@aikdna/kdna-cli/package.json");
const cliPackageInfo = require(cliPackagePath);

const ADAPTER_SCHEMA = "0.3.0";
const MAX_TASK_BYTES = 64 * 1024;
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;
const MAX_PATH_LENGTH = 4096;
const MAX_SECRET_BYTES = 16 * 1024;
const MAX_AUTHORIZATION_BYTES = MAX_SECRET_BYTES + 2;
const MAX_CONTROL_DOCUMENT_BYTES = 16 * 1024;
const AUTHORIZATION_FILE_ENV = "KDNA_MCP_AUTHORIZATION_FILE";
const WORKSPACE_ROOT_ENV = "KDNA_MCP_WORKSPACE_ROOT";
const HOST_ID_ENV = "KDNA_MCP_HOST_ID";
const HOST_PROCESSING_CONSENT_ENV = "KDNA_MCP_HOST_PROCESSING_CONSENT_FILE";
const CLI_VERSION = packageInfo.kdna_runtime?.cli;
const CORE_VERSION = packageInfo.kdna_runtime?.core;
const CLI_ENTRY = path.resolve(
  path.dirname(cliPackagePath),
  cliPackageInfo.bin?.kdna || "",
);
const HOME_ROOT = fs.realpathSync(os.homedir());
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const ATTACHMENT_ID_PATTERN = /^att_[0-9a-f]{24}$/u;
const HOST_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/u;

function bindHostWorkspaceRoot() {
  const configured = process.env[WORKSPACE_ROOT_ENV];
  if (
    !validBoundedString(configured) ||
    !path.isAbsolute(configured) ||
    path.resolve(configured) !== configured
  ) {
    throw new Error("The KDNA MCP Host workspace root is invalid.");
  }
  try {
    const before = fs.lstatSync(configured);
    const resolved = fs.realpathSync(configured);
    const opened = fs.statSync(resolved);
    if (
      !before.isDirectory() ||
      before.isSymbolicLink() ||
      !opened.isDirectory() ||
      resolved !== configured ||
      resolved === HOME_ROOT ||
      resolved === path.parse(resolved).root
    ) {
      throw new Error("Host root policy");
    }
    return Object.freeze({
      path: resolved,
      dev: opened.dev,
      ino: opened.ino,
    });
  } catch {
    throw new Error("The KDNA MCP Host workspace root is invalid.");
  }
}

const HOST_ROOT_BINDING = bindHostWorkspaceRoot();
const HOST_WORKSPACE_ROOT = HOST_ROOT_BINDING.path;

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

const selectionInputSchema = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["attachment_id", "task_digest", "approved"],
  properties: Object.freeze({
    attachment_id: Object.freeze({
      type: "string",
      pattern: "^att_[0-9a-f]{24}$",
    }),
    task_digest: Object.freeze({
      type: "string",
      pattern: "^sha256:[0-9a-f]{64}$",
    }),
    plan_digest: Object.freeze({
      type: "string",
      pattern: "^sha256:[0-9a-f]{64}$",
    }),
    approved: Object.freeze({ const: true }),
  }),
});

const tools = [
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
      "Resolve one task against approved attachments, including a receipt-bound one-task user selection.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["cwd", "task"],
      properties: {
        cwd: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
        task: { type: "string", minLength: 1, maxLength: MAX_TASK_BYTES },
        selection: selectionInputSchema,
      },
    },
  },
  {
    name: "kdna.workspace-load",
    description:
      "Resolve, plan, authorize, and load one approved workspace attachment, including a receipt-bound one-task user selection.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["cwd", "task"],
      properties: {
        cwd: { type: "string", minLength: 1, maxLength: MAX_PATH_LENGTH },
        task: { type: "string", minLength: 1, maxLength: MAX_TASK_BYTES },
        selection: selectionInputSchema,
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

function bindRotatingPrivateControlSource(environmentName) {
  const configured = process.env[environmentName];
  if (configured === undefined) return null;
  if (
    !validBoundedString(configured) ||
    !path.isAbsolute(configured) ||
    path.resolve(configured) !== configured
  ) {
    throw new Error("control coordinate policy");
  }
  const parent = path.dirname(configured);
  const parentBefore = fs.lstatSync(parent);
  if (
    !parentBefore.isDirectory() ||
    parentBefore.isSymbolicLink() ||
    (process.platform !== "win32" &&
      (parentBefore.mode & 0o077) !== 0) ||
    (typeof process.getuid === "function" &&
      parentBefore.uid !== process.getuid())
  ) {
    throw new Error("control source policy");
  }
  return Object.freeze({
    environmentName,
    path: configured,
    parent,
    parentDev: parentBefore.dev,
    parentIno: parentBefore.ino,
  });
}

function readRotatingPrivateControlDocument(source, code, message) {
  if (!source) {
    throw new AdapterError(code, message);
  }
  let descriptor;
  let bytes;
  try {
    if (process.env[source.environmentName] !== source.path) {
      throw new Error("control environment changed");
    }
    const parent = fs.lstatSync(source.parent);
    const before = fs.lstatSync(source.path);
    if (
      parent.isSymbolicLink() ||
      !parent.isDirectory() ||
      parent.dev !== source.parentDev ||
      parent.ino !== source.parentIno ||
      before.isSymbolicLink() ||
      !before.isFile() ||
      before.size < 1 ||
      before.size > MAX_CONTROL_DOCUMENT_BYTES ||
      (process.platform !== "win32" && (before.mode & 0o077) !== 0) ||
      (typeof process.getuid === "function" && before.uid !== process.getuid())
    ) {
      throw new Error("control source changed");
    }
    descriptor = fs.openSync(
      source.path,
      fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0),
    );
    const opened = fs.fstatSync(descriptor);
    if (
      !opened.isFile() ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino ||
      opened.size !== before.size ||
      opened.mtimeMs !== before.mtimeMs ||
      opened.ctimeMs !== before.ctimeMs
    ) {
      throw new Error("control source changed");
    }
    bytes = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor);
    const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (
      after.dev !== opened.dev ||
      after.ino !== opened.ino ||
      after.size !== opened.size ||
      after.mtimeMs !== opened.mtimeMs ||
      after.ctimeMs !== opened.ctimeMs
    ) {
      throw new Error("control source changed");
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { document: JSON.parse(text), digest };
  } catch {
    throw new AdapterError(code, message);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    bytes?.fill(0);
  }
}

let hostProcessingSource;
try {
  hostProcessingSource = bindRotatingPrivateControlSource(
    HOST_PROCESSING_CONSENT_ENV,
  );
} catch {
  hostProcessingSource = null;
}
const HOST_PROCESSING_SOURCE = hostProcessingSource;

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
  if (name === "kdna.workspace-status") {
    return hasExactKeys(args, ["cwd"]) && validBoundedString(args.cwd);
  }
  if (["kdna.workspace-resolve", "kdna.workspace-load"].includes(name)) {
    const optional =
      name === "kdna.workspace-load"
        ? ["profile", "selection"]
        : ["selection"];
    const selectionValid =
      args.selection === undefined ||
      (hasExactKeys(
        args.selection,
        ["attachment_id", "task_digest", "approved"],
        ["plan_digest"],
      ) &&
        ATTACHMENT_ID_PATTERN.test(args.selection.attachment_id) &&
        DIGEST_PATTERN.test(args.selection.task_digest) &&
        (args.selection.plan_digest === undefined ||
          DIGEST_PATTERN.test(args.selection.plan_digest)) &&
        args.selection.approved === true);
    return (
      hasExactKeys(args, ["cwd", "task"], optional) &&
      validBoundedString(args.cwd) &&
      validBoundedString(args.task, MAX_TASK_BYTES) &&
      Buffer.byteLength(args.task, "utf8") <= MAX_TASK_BYTES &&
      selectionValid &&
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

function cliEnvironment() {
  const environment = { ...process.env };
  delete environment[AUTHORIZATION_FILE_ENV];
  delete environment[WORKSPACE_ROOT_ENV];
  delete environment[HOST_ID_ENV];
  delete environment[HOST_PROCESSING_CONSENT_ENV];
  return environment;
}

function runCliJson(args, options = {}) {
  const result = spawnSync(process.execPath, [CLI_ENTRY, ...args], {
    cwd: options.cwd || HOST_WORKSPACE_ROOT,
    env: cliEnvironment(),
    input: options.input,
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: MAX_OUTPUT_BYTES,
    shell: false,
    stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
  return parseCliJson(result, new Set(options.acceptedStatuses || [0]));
}

function authorizationSourceConfigured() {
  return validBoundedString(process.env[AUTHORIZATION_FILE_ENV]);
}

function bindAuthorizationSource() {
  const configured = process.env[AUTHORIZATION_FILE_ENV];
  if (!validBoundedString(configured) || !path.isAbsolute(configured)) {
    throw new AdapterError(
      "authorization_source_invalid",
      "The process authorization source is invalid.",
    );
  }

  try {
    const before = fs.lstatSync(configured);
    if (
      !before.isFile() ||
      before.isSymbolicLink() ||
      before.size < 1 ||
      before.size > MAX_AUTHORIZATION_BYTES ||
      (process.platform !== "win32" && (before.mode & 0o077) !== 0) ||
      (typeof process.getuid === "function" && before.uid !== process.getuid())
    ) {
      throw new Error("authorization source policy");
    }
    return {
      path: configured,
      dev: before.dev,
      ino: before.ino,
      size: before.size,
      mtimeMs: before.mtimeMs,
      ctimeMs: before.ctimeMs,
    };
  } catch {
    throw new AdapterError(
      "authorization_source_invalid",
      "The process authorization source is invalid.",
    );
  }
}

function authorizationFactsMatch(stat, binding) {
  return (
    stat.dev === binding.dev &&
    stat.ino === binding.ino &&
    stat.size === binding.size &&
    stat.mtimeMs === binding.mtimeMs &&
    stat.ctimeMs === binding.ctimeMs
  );
}

function readAuthorizationInput(binding) {
  const configured = process.env[AUTHORIZATION_FILE_ENV];
  if (!binding || configured !== binding.path) {
    throw new AdapterError(
      "authorization_source_invalid",
      "The process authorization source is invalid.",
    );
  }

  let descriptor;
  let bytes;
  try {
    const before = fs.lstatSync(configured);
    if (
      before.isSymbolicLink() ||
      !before.isFile() ||
      !authorizationFactsMatch(before, binding)
    ) {
      throw new Error("authorization source changed");
    }
    descriptor = fs.openSync(
      configured,
      fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0),
    );
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile() || !authorizationFactsMatch(opened, binding)) {
      throw new Error("authorization source changed");
    }
    bytes = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor);
    if (
      !authorizationFactsMatch(after, binding) ||
      !authorizationFactsMatch(opened, binding)
    ) {
      throw new Error("authorization source changed");
    }
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    let end = bytes.length;
    if (end >= 2 && bytes[end - 2] === 0x0d && bytes[end - 1] === 0x0a) {
      end -= 2;
    } else if (end >= 1 && bytes[end - 1] === 0x0a) {
      end -= 1;
    }
    if (end < 1 || end > MAX_SECRET_BYTES) {
      throw new Error("authorization source is empty");
    }
    return Buffer.from(bytes.subarray(0, end));
  } catch {
    throw new AdapterError(
      "authorization_source_invalid",
      "The process authorization source is invalid.",
    );
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    bytes?.fill(0);
  }
}

function passwordRequiredByPlan(loadPlan) {
  return (
    loadPlan?.state === "needs_password" &&
    loadPlan?.issues?.some(
      (issue) => issue?.code === "KDNA_AUTH_PASSWORD_REQUIRED",
    )
  );
}

function loadRuntimeCapsule(
  assetPath,
  profile,
  loadPlan,
  authorizationBinding = null,
) {
  let authorizationInput;
  if (loadPlan?.can_load_now !== true && passwordRequiredByPlan(loadPlan)) {
    if (!authorizationSourceConfigured()) {
      throw new AdapterError(
        "authorization_required",
        "The selected asset is not authorized for loading.",
      );
    }
    authorizationInput = readAuthorizationInput(authorizationBinding);
  } else if (loadPlan?.can_load_now !== true) {
    throw new AdapterError(
      "authorization_required",
      "The selected asset is not authorized for loading.",
    );
  }

  try {
    const loadArguments = [
      "load",
      assetPath,
      `--profile=${profile || "compact"}`,
      "--as=json",
    ];
    if (authorizationInput) loadArguments.push("--password-stdin");
    return runCliJson(loadArguments, { input: authorizationInput });
  } catch (error) {
    if (
      authorizationInput &&
      error instanceof AdapterError &&
      error.code === "runtime_rejected"
    ) {
      throw new AdapterError(
        "authorization_rejected",
        "The process authorization source did not authorize the load.",
      );
    }
    throw error;
  } finally {
    authorizationInput?.fill(0);
  }
}

function digestText(value) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function hostProcessingConsent(assetDigest, profile, expectedUseBoundary) {
  if (!HOST_PROCESSING_SOURCE) {
    throw new AdapterError(
      "host_processing_consent_required",
      "Host processing consent is required before any Runtime Capsule delivery.",
    );
  }
  const { document, digest } = readRotatingPrivateControlDocument(
    HOST_PROCESSING_SOURCE,
    "host_processing_consent_invalid",
    "The Host processing consent is invalid or unavailable.",
  );
  const hostId = process.env[HOST_ID_ENV];
  const boundary = document?.processing_boundary;
  if (
    !HOST_ID_PATTERN.test(hostId || "") ||
    !hasExactKeys(document, [
      "document_type",
      "schema_version",
      "nonce",
      "host_id",
      "workspace_root_digest",
      "asset_digest",
      "use_boundary",
      "processing_boundary",
      "capsule_profile",
      "approval_source",
      "approved",
    ]) ||
    document.document_type !== "kdna.mcp.host-processing-consent" ||
    document.schema_version !== "0.1.0" ||
    !/^[0-9a-f]{32}$/u.test(document.nonce) ||
    document.host_id !== hostId ||
    document.workspace_root_digest !== digestText(HOST_WORKSPACE_ROOT) ||
    document.asset_digest !== assetDigest ||
    JSON.stringify(document.use_boundary) !==
      JSON.stringify(expectedUseBoundary) ||
    document.capsule_profile !== (profile || "compact") ||
    document.approval_source !== "user_explicit_natural_language" ||
    document.approved !== true ||
    !boundary ||
    typeof boundary !== "object" ||
    Array.isArray(boundary)
  ) {
    throw new AdapterError(
      "host_processing_consent_invalid",
      "The Host processing consent is invalid.",
    );
  }
  if (boundary.kind === "verified_local_only") {
    throw new AdapterError(
      "local_processing_attestation_required",
      "This adapter cannot accept a Host's unverified local-only claim.",
    );
  }
  if (
    !hasExactKeys(boundary, ["kind", "processor"]) ||
    boundary.kind !== "named_remote" ||
    !validBoundedString(boundary.processor, 256)
  ) {
    throw new AdapterError(
      "host_processing_destination_unknown",
      "The Host processing destination is unknown.",
    );
  }
  return Object.freeze({
    document_type: "kdna.mcp.host-processing-binding",
    schema_version: "0.1.0",
    host_id: document.host_id,
    processing_boundary: Object.freeze({
      kind: boundary.kind,
      processor: boundary.processor,
    }),
    capsule_profile: document.capsule_profile,
    asset_digest: document.asset_digest,
    use_boundary: Object.freeze({ ...document.use_boundary }),
    workspace_root_digest: document.workspace_root_digest,
    approval_source: document.approval_source,
    consent_digest: digest,
  });
}

function assertHostRootBinding() {
  try {
    const current = fs.lstatSync(HOST_WORKSPACE_ROOT);
    const resolved = fs.realpathSync(HOST_WORKSPACE_ROOT);
    const opened = fs.statSync(resolved);
    if (
      current.isSymbolicLink() ||
      !current.isDirectory() ||
      !opened.isDirectory() ||
      resolved !== HOST_WORKSPACE_ROOT ||
      opened.dev !== HOST_ROOT_BINDING.dev ||
      opened.ino !== HOST_ROOT_BINDING.ino
    ) {
      throw new Error("Host root changed");
    }
  } catch {
    throw new AdapterError(
      "host_workspace_root_changed",
      "The Host workspace root changed after MCP startup.",
    );
  }
}

function withinHostRoot(candidate) {
  assertHostRootBinding();
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
    const requested = path.resolve(value);
    const requestedStat = fs.lstatSync(requested);
    if (requestedStat.isSymbolicLink() || !requestedStat.isDirectory()) {
      throw new Error("not a regular directory");
    }
    resolved = fs.realpathSync(requested);
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

function bindingChanged() {
  throw new AdapterError(
    "workspace_binding_changed",
    "The approved workspace attachment changed during loading.",
  );
}

function readRecordBytes(recordPath, changed = false) {
  let descriptor;
  try {
    descriptor = fs.openSync(
      recordPath,
      fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0),
    );
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile() || stat.size > MAX_OUTPUT_BYTES) {
      throw new Error("invalid attachment record");
    }
    return fs.readFileSync(descriptor);
  } catch {
    if (changed) bindingChanged();
    throw new AdapterError(
      "workspace_contract_invalid",
      "The workspace attachment record is invalid.",
    );
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function recordDigest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function findWorkspaceBinding(cwd) {
  const safeCwd = workspaceCwd(cwd);
  let current = safeCwd;
  while (true) {
    const recordPath = path.join(current, ".kdna", "attachments.json");
    let recordExists = false;
    try {
      const kdnaStat = fs.lstatSync(path.dirname(recordPath));
      if (kdnaStat.isSymbolicLink() || !kdnaStat.isDirectory()) {
        throw new AdapterError(
          "workspace_contract_invalid",
          "The workspace attachment directory is invalid.",
        );
      }
      const stat = fs.lstatSync(recordPath);
      if (stat.isSymbolicLink() || !stat.isFile()) {
        throw new AdapterError(
          "workspace_contract_invalid",
          "The workspace attachment record is invalid.",
        );
      }
      recordExists = true;
    } catch (error) {
      if (error instanceof AdapterError) throw error;
      if (error?.code !== "ENOENT") {
        throw new AdapterError(
          "workspace_contract_invalid",
          "The workspace attachment record is invalid.",
        );
      }
    }
    if (recordExists) {
      if (current === HOME_ROOT) {
        throw new AdapterError(
          "workspace_home_ambiguous",
          "The home-level .kdna directory cannot act as project attachment authority.",
        );
      }
      const bytes = readRecordBytes(recordPath);
      return {
        safeCwd,
        workspaceRoot: current,
        recordPath,
        recordDigest: recordDigest(bytes),
      };
    }
    if (current === HOST_WORKSPACE_ROOT) return null;
    const parent = path.dirname(current);
    if (parent === current || !withinHostRoot(parent)) return null;
    current = parent;
  }
}

function assertRecordBinding(binding) {
  const bytes = readRecordBytes(binding.recordPath, true);
  if (recordDigest(bytes) !== binding.recordDigest) bindingChanged();
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
      "authorization",
      "integrity",
    ]) &&
    ATTACHMENT_ID_PATTERN.test(candidate.attachment_id) &&
    validBoundedString(candidate.asset_id, 512) &&
    validBoundedString(candidate.version, 128) &&
    DIGEST_PATTERN.test(candidate.digest) &&
    validBoundedString(candidate.role, 512) &&
    ["not_checked", "required", "satisfied"].includes(
      candidate.authorization,
    ) &&
    ["not_checked", "verified", "failed"].includes(candidate.integrity)
  );
}

function validSelectionPlan(plan) {
  return (
    hasExactKeys(plan, [
      "document_type",
      "schema_version",
      "workspace_root",
      "task_digest",
      "record_digest",
      "candidate_set_digest",
      "plan_digest",
    ]) &&
    plan.document_type === "kdna.workspace-selection-plan" &&
    plan.schema_version === ADAPTER_SCHEMA &&
    validBoundedString(plan.workspace_root) &&
    !path.isAbsolute(plan.workspace_root) &&
    DIGEST_PATTERN.test(plan.task_digest) &&
    DIGEST_PATTERN.test(plan.record_digest) &&
    DIGEST_PATTERN.test(plan.candidate_set_digest) &&
    DIGEST_PATTERN.test(plan.plan_digest)
  );
}

function validateResolution(resolution, options = {}) {
  const reasons = new Set([
    "single_approved_attachment_clearly_applies",
    "explicit_task_attachment_selection",
    "no_approved_attachment",
    "explicitly_outside_scope",
    "closed_world_no_match",
    "no_applicable_attachment",
    "applicability_unresolved",
    "ambiguous_scope",
    "attachment_conflict",
    "adapter_incompatible",
    "attachment_schema_unsupported",
    "snapshot_missing",
    "snapshot_digest_mismatch",
    "asset_invalid",
    "authorization_required",
    "selection_binding_changed",
    "selection_not_current_candidate",
    "selection_receipt_required",
  ]);
  const exact = hasExactKeys(
    resolution,
    [
      "document_type",
      "schema_version",
      "decision",
      "reason_code",
      "workspace_root",
      "selected",
      "candidates",
      "authorization",
      "integrity",
    ],
    ["selection_plan"],
  );
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
    ["not_checked", "not_selected", "required", "satisfied"].includes(
      resolution.authorization,
    ) &&
    ["not_checked", "verified", "failed"].includes(resolution.integrity) &&
    (resolution.selected === null || validCandidate(resolution.selected));

  if (
    !valid ||
    (resolution.decision === "load") !== (resolution.selected !== null) ||
    (resolution.decision === "ask") !==
      Object.prototype.hasOwnProperty.call(resolution, "selection_plan") ||
    (resolution.decision === "ask" &&
      !validSelectionPlan(resolution.selection_plan))
  ) {
    throw new AdapterError(
      "resolver_contract_invalid",
      "The official resolver returned an invalid contract.",
    );
  }
  if (
    resolution.decision === "load" &&
    (!(
      resolution.authorization === "satisfied" ||
      (options.allowDeferredPasswordAuthorization === true &&
        resolution.authorization === "required")
    ) ||
      resolution.integrity !== "verified")
  ) {
    throw new AdapterError(
      "resolver_contract_invalid",
      "The official resolver returned an invalid contract.",
    );
  }
  return resolution;
}

function resolvedWorkspaceRoot(binding, resolution) {
  const candidate = path.resolve(binding.safeCwd, resolution.workspace_root);
  if (!withinHostRoot(candidate)) bindingChanged();
  let resolved;
  try {
    resolved = fs.realpathSync(candidate);
    if (!fs.statSync(resolved).isDirectory()) bindingChanged();
  } catch {
    bindingChanged();
  }
  if (resolved !== binding.workspaceRoot) bindingChanged();
  return resolved;
}

function validateWorkspaceRecord(record) {
  if (
    !hasExactKeys(record, [
      "document_type",
      "schema_version",
      "workspace",
      "attachments",
    ]) ||
    record.document_type !== "kdna.workspace-attachments" ||
    record.schema_version !== ADAPTER_SCHEMA ||
    !Array.isArray(record.attachments)
  ) {
    throw new AdapterError(
      "workspace_contract_invalid",
      "The workspace attachment record is invalid.",
    );
  }
  return record;
}

function recordAtBinding(binding) {
  assertRecordBinding(binding);
  const record = validateWorkspaceRecord(
    runCliJson([
      "attachments",
      "--cwd",
      binding.workspaceRoot,
      "--workspace-root",
      HOST_WORKSPACE_ROOT,
    ]),
  );
  assertRecordBinding(binding);
  return record;
}

function bindSelectedAttachment(binding, selected) {
  const record = recordAtBinding(binding);
  const attachment = record.attachments.find(
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
    !["task_hints", "all_workspace"].includes(attachment.scope.application) ||
    attachment.scope.authority !== "user_approved_routing_hint" ||
    !["open_world_ask", "closed_world_skip", "all_workspace"].includes(
      attachment.scope.matching_policy,
    ) ||
    !["user_explicit", "preview_confirmed"].includes(
      attachment.scope.approval_source,
    ) ||
    !Array.isArray(attachment.scope.applies_to) ||
    !Array.isArray(attachment.scope.does_not_apply_to) ||
    !validBoundedString(attachment.asset?.snapshot)
  ) {
    bindingChanged();
  }

  const protectedRoot = path.join(binding.workspaceRoot, ".kdna", "assets");
  const snapshot = path.resolve(
    binding.workspaceRoot,
    ".kdna",
    attachment.asset.snapshot,
  );
  const relative = path.relative(protectedRoot, snapshot);
  if (
    relative === "" ||
    relative.startsWith(`..${path.sep}`) ||
    relative === ".." ||
    path.isAbsolute(relative)
  ) {
    bindingChanged();
  }

  return {
    ...binding,
    selected,
    scope: attachment.scope,
    snapshot,
  };
}

function snapshotDigest(snapshot) {
  let descriptor;
  try {
    descriptor = fs.openSync(
      snapshot,
      fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0),
    );
    if (!fs.fstatSync(descriptor).isFile()) bindingChanged();
    const hash = createHash("sha256");
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let bytesRead;
    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
    return `sha256:${hash.digest("hex")}`;
  } catch {
    bindingChanged();
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function assertWorkspaceBinding(binding) {
  assertRecordBinding(binding);
  const record = recordAtBinding(binding);
  const attachment = record.attachments.find(
    (item) => item?.attachment_id === binding.selected.attachment_id,
  );
  if (
    !attachment ||
    attachment.state !== "enabled" ||
    attachment.role !== binding.selected.role ||
    attachment.asset?.id !== binding.selected.asset_id ||
    attachment.asset?.version !== binding.selected.version ||
    attachment.asset?.digest !== binding.selected.digest ||
    attachment.asset?.snapshot === undefined ||
    path.resolve(binding.workspaceRoot, ".kdna", attachment.asset.snapshot) !==
      binding.snapshot ||
    JSON.stringify(attachment.scope) !== JSON.stringify(binding.scope) ||
    snapshotDigest(binding.snapshot) !== binding.selected.digest
  ) {
    bindingChanged();
  }
}

function resolveWorkspaceContext(cwd, task, selection = undefined) {
  const binding = findWorkspaceBinding(cwd);
  if (binding === null) {
    return { resolution: noAttachmentResolution(), binding: null };
  }
  const taskInput = Buffer.from(task, "utf8");
  if (taskInput.toString("utf8") !== task) {
    taskInput.fill(0);
    throw new AdapterError(
      "task_input_invalid",
      "The task input is not valid UTF-8.",
    );
  }
  try {
    const deferredPasswordAuthorization = authorizationSourceConfigured();
    const resolveArguments = [
      "resolve",
      "--cwd",
      binding.safeCwd,
      "--workspace-root",
      HOST_WORKSPACE_ROOT,
      "--task-stdin",
      "--adapter-schema",
      ADAPTER_SCHEMA,
    ];
    if (deferredPasswordAuthorization) {
      resolveArguments.push("--defer-password-authorization");
    }
    if (selection !== undefined) {
      resolveArguments.push(
        "--select-attachment",
        selection.attachment_id,
        "--selection-task-digest",
        selection.task_digest,
      );
      if (selection.plan_digest !== undefined) {
        resolveArguments.push("--selection-plan-digest", selection.plan_digest);
      }
      resolveArguments.push("--selection-approved");
    }
    const resolution = validateResolution(
      runCliJson(resolveArguments, { input: taskInput }),
      {
        allowDeferredPasswordAuthorization: deferredPasswordAuthorization,
      },
    );
    resolvedWorkspaceRoot(binding, resolution);
    assertRecordBinding(binding);
    return {
      resolution,
      binding:
        resolution.decision === "load"
          ? bindSelectedAttachment(binding, resolution.selected)
          : binding,
    };
  } finally {
    taskInput.fill(0);
  }
}

function resolveWorkspace(cwd, task, selection = undefined) {
  return resolveWorkspaceContext(cwd, task, selection).resolution;
}

function workspaceStatus(cwd) {
  const binding = findWorkspaceBinding(cwd);
  const record = binding === null ? null : recordAtBinding(binding);
  return {
    document_type: "kdna.mcp.workspace-status",
    schema_version: ADAPTER_SCHEMA,
    attachments: record,
  };
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
    switch: `kdna switch ${selected.attachment_id} <new-file.kdna> --cwd <workspace> --retain-scope --preview`,
    rollback: `kdna rollback ${selected.attachment_id} --cwd <workspace>`,
  };
}

function judgmentDecisionSummary(runtimeCapsule) {
  const context = runtimeCapsule && runtimeCapsule.context;
  const axioms = context && Array.isArray(context.axioms) ? context.axioms : [];
  const decisionRules = [];
  for (const axiom of axioms) {
    if (!axiom || typeof axiom !== "object" || Array.isArray(axiom)) continue;
    const statement = axiom.statement || axiom.one_sentence || null;
    if (typeof statement !== "string" || statement.length === 0) continue;
    decisionRules.push({
      rule: statement,
      applies_when: Array.isArray(axiom.applies_when) ? axiom.applies_when : [],
      does_not_apply_when: Array.isArray(axiom.does_not_apply_when)
        ? axiom.does_not_apply_when
        : [],
      failure_risk: typeof axiom.failure_risk === "string" ? axiom.failure_risk : null,
    });
  }
  if (decisionRules.length === 0) return null;
  return {
    source: "runtime-capsule/context/axioms",
    rules: decisionRules,
  };
}

function workspaceAdoption(resolution, scope = null, additions = {}) {
  return {
    document_type: "kdna.mcp.workspace-adoption",
    schema_version: ADAPTER_SCHEMA,
    adapter: adapterInfo(),
    adoption: resolution.decision,
    resolution,
    scope,
    controls: adoptionControls(resolution.selected),
    one_task_selection: additions.oneTaskSelection || null,
    host_processing: additions.hostProcessing || null,
    load_plan: additions.loadPlan || null,
    runtime_capsule: additions.runtimeCapsule || null,
    judgment_decision: additions.runtimeCapsule
      ? judgmentDecisionSummary(additions.runtimeCapsule)
      : null,
  };
}

function workspaceProcessingBoundary(binding) {
  return {
    kind: "workspace_attachment",
    attachment_id: binding.selected.attachment_id,
    scope_digest: digestText(JSON.stringify(binding.scope)),
  };
}

function loadWorkspace(args) {
  const { resolution, binding } = resolveWorkspaceContext(
    args.cwd,
    args.task,
    args.selection,
  );
  if (resolution.decision !== "load") return workspaceAdoption(resolution);

  const authorizationBinding =
    resolution.authorization === "required" ? bindAuthorizationSource() : null;
  const processingBinding = hostProcessingConsent(
    resolution.selected.digest,
    args.profile,
    workspaceProcessingBoundary(binding),
  );
  assertWorkspaceBinding(binding);
  const loadPlan = runCliJson(["plan-load", binding.snapshot, "--json"], {
    acceptedStatuses: [0, 1, 3],
  });
  assertWorkspaceBinding(binding);
  const runtimeCapsule = loadRuntimeCapsule(
    binding.snapshot,
    args.profile,
    loadPlan,
    authorizationBinding,
  );
  assertWorkspaceBinding(binding);
  const confirmedProcessing = hostProcessingConsent(
    resolution.selected.digest,
    args.profile,
    workspaceProcessingBoundary(binding),
  );
  if (confirmedProcessing.consent_digest !== processingBinding.consent_digest) {
    throw new AdapterError(
      "host_processing_consent_invalid",
      "The Host processing consent is invalid or changed.",
    );
  }
  const satisfiedSelected = {
    ...resolution.selected,
    authorization: "satisfied",
    integrity: "verified",
  };
  const satisfiedResolution = {
    ...resolution,
    selected: satisfiedSelected,
    candidates: resolution.candidates.map((candidate) =>
      candidate.attachment_id === satisfiedSelected.attachment_id
        ? satisfiedSelected
        : candidate,
    ),
    authorization: "satisfied",
  };
  return workspaceAdoption(satisfiedResolution, binding.scope, {
    loadPlan,
    runtimeCapsule,
    hostProcessing: confirmedProcessing,
    oneTaskSelection:
      resolution.reason_code === "explicit_task_attachment_selection"
        ? {
            attachment_id: resolution.selected.attachment_id,
            task_digest: args.selection.task_digest,
            persisted: false,
          }
        : null,
  });
}

async function callTool(name, args) {
  if (name === "kdna.workspace-status")
    return textResult(workspaceStatus(args.cwd));
  if (name === "kdna.workspace-resolve") {
    return textResult(resolveWorkspace(args.cwd, args.task, args.selection));
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
