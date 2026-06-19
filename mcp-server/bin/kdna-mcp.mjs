#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  inspectKDNA,
  loadKDNA,
  matchDomain,
  planLoad,
  renderForAgent,
  verifyAsset,
} = require('@aikdna/kdna-core');
const {
  detectContainerFormat,
  inspect: inspectV1,
  isV1SourceDir,
  loadV1,
  validate: validateV1,
} = require('@aikdna/kdna-core/v1');

const tools = [
  {
    name: 'kdna.inspect',
    description: 'Inspect a .kdna asset without extracting it.',
    inputSchema: {
      type: 'object',
      required: ['assetPath'],
      properties: { assetPath: { type: 'string' }, verify: { type: 'boolean' } },
    },
  },
  {
    name: 'kdna.verify',
    description: 'Verify a .kdna asset integrity state.',
    inputSchema: {
      type: 'object',
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
      required: ['assetPath'],
      properties: {
        assetPath: { type: 'string' },
        profile: { type: 'string', enum: ['index', 'compact', 'scenario', 'full'] },
        input: { type: 'string' },
      },
    },
  },
  {
    name: 'kdna.plan-load',
    description: 'Return the Core LoadPlan for a .kdna asset before loading.',
    inputSchema: {
      type: 'object',
      required: ['assetPath'],
      properties: {
        assetPath: { type: 'string' },
        hasPassword: { type: 'boolean' },
      },
    },
  },
  {
    name: 'kdna.available-local',
    description: 'List local v1 .kdna assets or v1 source directories without using a registry.',
    inputSchema: {
      type: 'object',
      properties: {
        root: { type: 'string' },
        maxDepth: { type: 'number' },
      },
    },
  },
  {
    name: 'kdna.match',
    description: 'Rank .kdna assets for a task string.',
    inputSchema: {
      type: 'object',
      required: ['input', 'assetPaths'],
      properties: {
        input: { type: 'string' },
        assetPaths: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'kdna.available',
    description: 'Legacy: list assets from a local Registry domains.json file.',
    inputSchema: {
      type: 'object',
      properties: { registryFile: { type: 'string' } },
    },
  },
];

function send(id, result, error) {
  const msg = error
    ? { jsonrpc: '2.0', id, error: { code: -32000, message: error.message || String(error) } }
    : { jsonrpc: '2.0', id, result };
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function textResult(value) {
  return {
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
  };
}

function isV1Asset(assetPath) {
  if (!assetPath) return false;
  try {
    if (fs.existsSync(assetPath) && fs.statSync(assetPath).isDirectory()) {
      return isV1SourceDir(assetPath);
    }
    return detectContainerFormat(assetPath) === 'v1';
  } catch {
    return false;
  }
}

function defaultAssetRoot() {
  return process.env.KDNA_ASSET_DIR || path.join(os.homedir(), '.kdna', 'assets');
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

    if (isV1SourceDir(dir)) {
      const inspection = inspectV1(dir);
      const validation = validateV1(dir);
      found.push({
        path: dir,
        kind: 'v1_source_dir',
        asset_id: inspection.asset_id,
        title: inspection.title,
        version: inspection.version,
        judgment_version: inspection.judgment_version,
        checksums_present: Boolean(inspection.checksums_present),
        loadable: Boolean(validation.overall_valid),
        problems: validation.overall_valid ? [] : validation.problems || [],
      });
      return;
    }

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith('.kdna') && detectContainerFormat(full) === 'v1') {
        const inspection = inspectV1(full);
        const validation = validateV1(full);
        found.push({
          path: full,
          kind: 'v1_container',
          asset_id: inspection.asset_id,
          title: inspection.title,
          version: inspection.version,
          judgment_version: inspection.judgment_version,
          checksums_present: Boolean(inspection.checksums_present),
          loadable: Boolean(validation.overall_valid),
          problems: validation.overall_valid ? [] : validation.problems || [],
        });
      }
    }
  }

  visit(path.resolve(root), 0);
  return found;
}

function listRegistry(registryFile) {
  const file = registryFile || process.env.KDNA_REGISTRY_FILE;
  if (!file) return [];
  const registry = JSON.parse(fs.readFileSync(file, 'utf8'));
  const domains = Array.isArray(registry.domains) ? registry.domains : Object.values(registry.domains || {});
  return domains.map((d) => ({
    legacy_registry: true,
    name: d.name,
    version: d.version,
    asset_url: d.asset_url,
    asset_digest: d.asset_digest,
  }));
}

function runCliPlanLoad(args = {}) {
  const cliArgs = ['plan-load', args.assetPath, '--json'];
  if (args.hasPassword) cliArgs.push('--has-password');

  const result = spawnSync('kdna', cliArgs, {
    encoding: 'utf8',
    timeout: 30_000,
  });

  if (result.error) {
    throw new Error(`Core planLoad is unavailable and kdna CLI failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Core planLoad is unavailable and kdna CLI exited ${result.status}: ${result.stderr || result.stdout}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Core planLoad is unavailable and kdna CLI returned non-JSON output: ${error.message}`);
  }
}

function planLoadThroughCoreOrCli(args = {}) {
  if (!args.assetPath) throw new Error('assetPath is required');

  if (typeof planLoad === 'function') {
    return planLoad(args.assetPath, {
      hasPassword: Boolean(args.hasPassword),
    });
  }

  return runCliPlanLoad(args);
}

async function callTool(name, args = {}) {
  if (name === 'kdna.inspect') {
    if (isV1Asset(args.assetPath)) return textResult(inspectV1(args.assetPath));
    return textResult(await inspectKDNA(args.assetPath, { verify: args.verify !== false }));
  }
  if (name === 'kdna.verify') {
    if (isV1Asset(args.assetPath)) return textResult(validateV1(args.assetPath));
    return textResult(await verifyAsset(args.assetPath, {
      asset_digest: args.asset_digest,
      content_digest: args.content_digest,
      requireSignature: Boolean(args.requireSignature),
    }));
  }
  if (name === 'kdna.load') {
    if (isV1Asset(args.assetPath)) {
      const profile = args.profile || 'compact';
      const loaded = loadV1(args.assetPath, { profile, as: 'json' });
      const prompt = profile === 'index' ? null : loadV1(args.assetPath, { profile, as: 'prompt' }).text;
      return textResult({ ...loaded, context: prompt });
    }
    const loaded = await loadKDNA(args.assetPath, { profile: args.profile || 'compact', input: args.input || '' });
    const context = args.profile === 'index'
      ? null
      : await renderForAgent(args.assetPath, { profile: args.profile || 'compact', input: args.input || '' });
    return textResult({ ...loaded, context });
  }
  if (name === 'kdna.plan-load') {
    return textResult(planLoadThroughCoreOrCli(args));
  }
  if (name === 'kdna.match') {
    return textResult(await matchDomain(args.input || '', args.assetPaths || []));
  }
  if (name === 'kdna.available-local') {
    return textResult(findLocalAssets(args.root, args.maxDepth || 3));
  }
  if (name === 'kdna.available') {
    return textResult(listRegistry(args.registryFile));
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function handle(message) {
  const { id, method, params = {} } = message;
  if (method === 'initialize') {
    send(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: '@aikdna/kdna-mcp-server', version: '0.1.0' },
    });
    return;
  }
  if (method === 'tools/list') {
    send(id, { tools });
    return;
  }
  if (method === 'tools/call') {
    send(id, await callTool(params.name, params.arguments || {}));
    return;
  }
  if (id !== undefined) send(id, {});
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    await handle(JSON.parse(line));
  } catch (e) {
    send(undefined, null, e);
  }
});
