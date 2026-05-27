#!/usr/bin/env node
import fs from 'node:fs';
import readline from 'node:readline';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  inspectKDNA,
  loadKDNA,
  matchDomain,
  renderForAgent,
  verifyAsset,
} = require('@aikdna/kdna-core');

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
    description: 'Verify a .kdna asset digest/signature.',
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
    description: 'List assets from a local Registry domains.json file.',
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

function listRegistry(registryFile) {
  const file = registryFile || process.env.KDNA_REGISTRY_FILE;
  if (!file) return [];
  const registry = JSON.parse(fs.readFileSync(file, 'utf8'));
  const domains = Array.isArray(registry.domains) ? registry.domains : Object.values(registry.domains || {});
  return domains.map((d) => ({
    name: d.name,
    version: d.version,
    asset_url: d.asset_url,
    asset_digest: d.asset_digest,
    quality_badge: d.quality_badge,
    risk_level: d.risk_level,
    release_status: d.release_status,
  }));
}

async function callTool(name, args = {}) {
  if (name === 'kdna.inspect') {
    return textResult(await inspectKDNA(args.assetPath, { verify: args.verify !== false }));
  }
  if (name === 'kdna.verify') {
    return textResult(await verifyAsset(args.assetPath, {
      asset_digest: args.asset_digest,
      content_digest: args.content_digest,
      requireSignature: Boolean(args.requireSignature),
    }));
  }
  if (name === 'kdna.load') {
    const loaded = await loadKDNA(args.assetPath, { profile: args.profile || 'compact', input: args.input || '' });
    const context = args.profile === 'index'
      ? null
      : await renderForAgent(args.assetPath, { profile: args.profile || 'compact', input: args.input || '' });
    return textResult({ ...loaded, context });
  }
  if (name === 'kdna.match') {
    return textResult(await matchDomain(args.input || '', args.assetPaths || []));
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
