#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const loadPlanSchema = require('@aikdna/kdna-core/schema/load-plan.schema.json');
const packageInfo = require('../package.json');
const {
  detectContainerFormat,
  inspect,
  load,
  matchDomain,
  planLoad,
  validate,
} = require('@aikdna/kdna-core');

const tools = [
  {
    name: 'kdna.inspect',
    description: 'Inspect a .kdna asset without extracting it.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['assetPath'],
      properties: { assetPath: { type: 'string' }, verify: { type: 'boolean' } },
    },
  },
  {
    name: 'kdna.verify',
    description: 'Verify a .kdna asset integrity state.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['assetPath'],
      properties: {
        assetPath: { type: 'string' },
        asset_digest: { type: 'string' },
        content_digest: { type: 'string' },
        requireSignature: { type: 'boolean' },
      },
    },
  },
  {
    name: 'kdna.load',
    description: 'Load a .kdna profile and return agent context.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['assetPath'],
      properties: {
        assetPath: { type: 'string' },
        profile: { type: 'string', enum: ['index', 'compact', 'scenario', 'full'] },
        input: { type: 'string' },
        password: { type: 'string' },
        entitlementStatus: { type: 'string', enum: ['active', 'expired', 'revoked', 'offline_grace'] },
      },
    },
  },
  {
    name: 'kdna.plan-load',
    description: 'Return the Core LoadPlan for a .kdna asset before loading.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['assetPath'],
      properties: {
        assetPath: { type: 'string' },
        hasPassword: { type: 'boolean' },
        entitlementStatus: { type: 'string', enum: ['active', 'expired', 'revoked', 'offline_grace'] },
      },
    },
  },
  {
    name: 'kdna.available-local',
    description: 'List local .kdna files without using a registry.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        root: { type: 'string' },
        maxDepth: { type: 'integer', minimum: 0 },
      },
    },
  },
  {
    name: 'kdna.match',
    description: 'Rank .kdna assets for a task string.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['input', 'assetPaths'],
      properties: {
        input: { type: 'string' },
        assetPaths: { type: 'array', items: { type: 'string' } },
      },
    },
  },
];

const ajv = new Ajv({ allErrors: true, strict: false });
const toolValidators = new Map(tools.map((tool) => [tool.name, ajv.compile(tool.inputSchema)]));
const contractAjv = new Ajv2020({ allErrors: true, strict: false });
addFormats(contractAjv);
const validateLoadPlan = contractAjv.compile(loadPlanSchema);

class JsonRpcError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function validatedJsonRpcMessage(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new JsonRpcError(-32600, 'Invalid Request');
  }
  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    throw new JsonRpcError(-32600, 'Invalid Request');
  }

  const hasId = Object.prototype.hasOwnProperty.call(message, 'id');
  if (hasId) {
    const validId =
      typeof message.id === 'string' ||
      (typeof message.id === 'number' && Number.isFinite(message.id));
    if (!validId) throw new JsonRpcError(-32600, 'Invalid Request');
  }

  return {
    id: message.id,
    method: message.method,
    params: message.params === undefined ? {} : message.params,
    paramsValid:
      message.params === undefined ||
      (message.params !== null && typeof message.params === 'object' && !Array.isArray(message.params)),
    isNotification: !hasId,
  };
}

function sendResult(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

function sendError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } })}\n`);
}

function textResult(value) {
  return {
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
  };
}

function toolErrorResult(error) {
  return {
    content: [{ type: 'text', text: error?.message || String(error) }],
    isError: true,
  };
}

function validatedToolCall(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new JsonRpcError(-32602, 'Invalid params');
  }
  if (typeof params.name !== 'string' || !toolValidators.has(params.name)) {
    throw new JsonRpcError(-32602, 'Invalid params');
  }
  const args = params.arguments === undefined ? {} : params.arguments;
  const validateInput = toolValidators.get(params.name);
  if (!validateInput(args)) throw new JsonRpcError(-32602, 'Invalid params');
  return { name: params.name, args };
}

function isKdnaAsset(assetPath) {
  if (!assetPath) return false;
  try {
    if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) return false;
    return assetPath.endsWith('.kdna') && detectContainerFormat(assetPath) === 'kdna';
  } catch {
    return false;
  }
}

function defaultAssetRoot() {
  return process.env.KDNA_ASSET_DIR || process.env.KDNA_PACKAGE_DIR || path.join(os.homedir(), '.kdna', 'packages');
}

function findLocalAssets(root = defaultAssetRoot(), maxDepth = 3) {
  if (!root || !fs.existsSync(root)) return [];
  const found = [];

  function visit(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith('.kdna')) {
        try {
          if (detectContainerFormat(full) !== 'kdna') continue;
          const inspection = inspect(full);
          const validation = validate(full);
          found.push({
            path: full,
            kind: 'kdna_asset',
            asset_id: inspection.asset_id,
            title: inspection.title,
            version: inspection.version,
            judgment_version: inspection.judgment_version,
            checksums_present: Boolean(inspection.checksums_present),
            loadable: Boolean(validation.overall_valid),
            problems: validation.overall_valid ? [] : validation.problems || [],
          });
        } catch {
          found.push({
            path: full,
            kind: 'kdna_asset',
            asset_id: null,
            title: null,
            version: null,
            judgment_version: null,
            checksums_present: false,
            loadable: false,
            problems: ['KDNA_ASSET_INVALID'],
          });
        }
      }
    }
  }

  visit(path.resolve(root), 0);
  return found;
}

function runCliPlanLoad(args = {}) {
  const cliArgs = ['plan-load', args.assetPath, '--json'];
  if (args.hasPassword) cliArgs.push('--has-password');
  if (args.entitlementStatus) cliArgs.push('--entitlement-status', args.entitlementStatus);

  const result = spawnSync('kdna', cliArgs, {
    encoding: 'utf8',
    timeout: 30_000,
  });

  if (result.error) {
    throw new Error(`Core planLoad is unavailable and kdna CLI failed: ${result.error.message}`);
  }
  if (result.status !== 0 && result.status !== 3) {
    throw new Error(`Core planLoad is unavailable and kdna CLI exited ${result.status}`);
  }
  let plan;
  try {
    if (result.stdout && result.stdout.trim()) plan = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Core planLoad is unavailable and kdna CLI returned non-JSON output: ${error.message}`);
  }
  if (!validateLoadPlan(plan)) {
    throw new Error('Core planLoad is unavailable and kdna CLI returned an invalid LoadPlan');
  }
  if (
    plan.source.kind !== 'file' ||
    path.resolve(plan.source.path) !== path.resolve(args.assetPath)
  ) {
    throw new Error('Core planLoad is unavailable and kdna CLI returned an uncorrelated LoadPlan');
  }
  if (result.status === 0 && plan.can_load_now !== true) {
    throw new Error('Core planLoad is unavailable and kdna CLI returned a non-loadable success');
  }
  if (result.status === 3 && plan.can_load_now !== false) {
    throw new Error('Core planLoad is unavailable and kdna CLI returned a loadable denial');
  }
  return plan;
}

function planLoadThroughCoreOrCli(args = {}) {
  if (!args.assetPath) throw new Error('assetPath is required');

  if (typeof planLoad === 'function' && process.env.KDNA_MCP_FORCE_CLI_PLAN_LOAD !== '1') {
    return planLoad(args.assetPath, {
      hasPassword: Boolean(args.hasPassword),
      entitlement: args.entitlementStatus ? { status: args.entitlementStatus } : undefined,
    });
  }

  return runCliPlanLoad(args);
}

async function callTool(name, args = {}) {
  if (name === 'kdna.inspect') {
    if (!isKdnaAsset(args.assetPath)) throw new Error('assetPath is not a current KDNA asset');
    return textResult(inspect(args.assetPath, { verify: args.verify !== false }));
  }
  if (name === 'kdna.verify') {
    if (!isKdnaAsset(args.assetPath)) throw new Error('assetPath is not a current KDNA asset');
    return textResult(validate(args.assetPath, {
      asset_digest: args.asset_digest,
      content_digest: args.content_digest,
      requireSignature: Boolean(args.requireSignature),
    }));
  }
  if (name === 'kdna.load') {
    if (!isKdnaAsset(args.assetPath)) throw new Error('assetPath is not a current KDNA asset');
    return textResult(load(args.assetPath, {
      profile: args.profile || 'compact',
      as: 'json',
      input: args.input || '',
      password: args.password,
      entitlement: args.entitlementStatus ? { status: args.entitlementStatus } : undefined,
    }));
  }
  if (name === 'kdna.plan-load') {
    return textResult(planLoadThroughCoreOrCli(args));
  }
  if (name === 'kdna.match') {
    return textResult(await matchDomain(args.input || '', args.assetPaths || []));
  }
  if (name === 'kdna.available-local') {
    return textResult(findLocalAssets(args.root, args.maxDepth ?? 3));
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function handle({ id, method, params }) {
  if (method === 'initialize') {
    sendResult(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: '@aikdna/kdna-mcp-server', version: packageInfo.version },
    });
    return;
  }
  if (method === 'tools/list') {
    sendResult(id, { tools });
    return;
  }
  if (method === 'tools/call') {
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
  if (id !== undefined) sendError(id, -32601, 'Method not found');
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    sendError(null, -32700, 'Parse error');
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
    sendError(null, -32603, 'Internal error');
    return;
  }

  if (request.isNotification) return;
  if (!request.paramsValid) {
    sendError(request.id, -32602, 'Invalid params');
    return;
  }
  try {
    await handle(request);
  } catch {
    sendError(request.id, -32603, 'Internal error');
  }
});
