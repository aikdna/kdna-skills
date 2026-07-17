import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cbor = require('cbor-x');
const {
  HOST_PROTOCOL,
  HOST_PROTOCOL_VERSION,
  buildChecksums,
  pack,
  planLoad,
} = require('@aikdna/kdna-core');
const packageInfo = require('../package.json');

const server = path.join(process.cwd(), 'bin', 'kdna-mcp.mjs');

function callTool(name, args, options = {}) {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name, arguments: args },
  };
  const r = spawnSync(process.execPath, [server], {
    input: `${JSON.stringify(request)}\n`,
    encoding: 'utf8',
    env: options.env || process.env,
  });
  assert.equal(r.status, 0, r.stderr);
  const response = JSON.parse(r.stdout.trim());
  assert.ok(!response.error, response.error && response.error.message);
  return JSON.parse(response.result.content[0].text);
}

function callToolRaw(name, args, options = {}) {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name, arguments: args },
  };
  const r = spawnSync(process.execPath, [server], {
    input: `${JSON.stringify(request)}\n`,
    encoding: 'utf8',
    env: options.env || process.env,
  });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim());
}

function sendRawLineText(line) {
  const r = spawnSync(process.execPath, [server], {
    input: `${line}\n`,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

function sendRawLine(line) {
  const output = sendRawLineText(line);
  assert.notEqual(output, '', 'request must produce a response');
  return JSON.parse(output);
}

function initialize() {
  const request = { jsonrpc: '2.0', id: 1, method: 'initialize' };
  const r = spawnSync(process.execPath, [server], {
    input: `${JSON.stringify(request)}\n`,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim());
}

function listTools() {
  const request = { jsonrpc: '2.0', id: 1, method: 'tools/list' };
  const r = spawnSync(process.execPath, [server], {
    input: `${JSON.stringify(request)}\n`,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  const response = JSON.parse(r.stdout.trim());
  assert.ok(!response.error, response.error && response.error.message);
  return response.result.tools;
}

function makeKdnaSource(root) {
  const dir = path.join(root, 'writing');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
  fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({
    format_version: '0.1.0',
    asset_id: 'kdna:test:writing',
    asset_uid: 'urn:uuid:11111111-1111-4111-8111-111111111111',
    asset_type: 'domain',
    title: 'Test Writing',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-06-18T00:00:00.000Z',
    updated_at: '2026-06-18T00:00:00.000Z',
    creator: { name: 'MCP Test', id: 'mcp-test' },
    lineage: { type: 'original', fork_of: null, derived_from: null },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    compatibility: {
      min_loader_version: '0.20.0',
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
    },
    load_contract: {
      default_profile: 'compact',
      profiles: {
        index: { requires_decryption: false, max_tokens_hint: 200 },
        compact: { requires_decryption: false, max_tokens_hint: 2000 },
        scenario: { requires_decryption: false, selection: 'triggered_sections_only' },
        full: { requires_decryption: false, intended_for: ['audit'] },
      },
    },
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'payload.kdnab'), cbor.encode({
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      highest_question: 'What makes this writing judgment useful?',
      axioms: [{ id: 'ax1', one_sentence: 'Structure before wording.' }],
      boundaries: [{ type: 'stance_boundary', stance: 'Do not polish before diagnosis.' }],
      risk_model: {},
    },
    patterns: [],
    scenarios: [],
    cases: [],
    reasoning: { self_check: ['Did I diagnose before editing?'], failure_modes: [] },
  }));
  fs.writeFileSync(path.join(dir, 'checksums.json'), JSON.stringify(buildChecksums(dir), null, 2));
  return dir;
}

function makeKdnaContainer(root, name = 'writing.kdna') {
  const sourceDir = makeKdnaSource(root);
  const assetPath = path.join(root, name);
  pack(sourceDir, assetPath);
  return assetPath;
}

function makeRemoteKdnaContainer(root, name = 'remote.kdna') {
  const sourceDir = makeKdnaSource(root);
  const manifestPath = path.join(sourceDir, 'kdna.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.access = 'remote';
  manifest.runtime = { endpoint: 'https://runtime.example.test/project' };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(
    path.join(sourceDir, 'checksums.json'),
    JSON.stringify(buildChecksums(sourceDir), null, 2),
  );
  const assetPath = path.join(root, name);
  pack(sourceDir, assetPath);
  return assetPath;
}

test('available-local discovers .kdna files and load returns a Runtime Capsule', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-runtime-'));
  try {
    const assetPath = makeKdnaContainer(root);
    const available = callTool('kdna.available-local', { root, maxDepth: 1 });
    assert.equal(available.length, 1);
    assert.equal(available[0].asset_id, 'kdna:test:writing');
    assert.equal(available[0].kind, 'kdna_asset');
    assert.equal(available[0].loadable, true, JSON.stringify(available[0]));
    assert.equal(Object.prototype.hasOwnProperty.call(available[0], 'quality_badge'), false);

    const loaded = callTool('kdna.load', { assetPath, profile: 'compact' });
    assert.equal(loaded.type, 'kdna.runtime-capsule');
    assert.equal(loaded.contract_version, '0.1.0');
    assert.equal(loaded.asset.asset_id, 'kdna:test:writing');
    assert.match(JSON.stringify(loaded.context), /Structure before wording/);
    assert.match(JSON.stringify(loaded.context), /Do not polish before diagnosis/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('available-local treats maxDepth 0 as root-only and declares a non-negative integer', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-depth-zero-'));
  try {
    const rootAsset = makeKdnaContainer(root, 'root.kdna');
    const nested = path.join(root, 'nested');
    fs.mkdirSync(nested);
    const nestedAsset = makeKdnaContainer(nested, 'nested.kdna');

    const rootOnly = callTool('kdna.available-local', { root, maxDepth: 0 });
    assert.deepEqual(rootOnly.map((asset) => asset.path), [rootAsset]);
    assert.equal(rootOnly.some((asset) => asset.path === nestedAsset), false);

    const withNested = callTool('kdna.available-local', { root, maxDepth: 1 });
    assert.deepEqual(new Set(withNested.map((asset) => asset.path)), new Set([rootAsset, nestedAsset]));

    const availableTool = listTools().find((tool) => tool.name === 'kdna.available-local');
    assert.deepEqual(availableTool.inputSchema.properties.maxDepth, {
      type: 'integer',
      minimum: 0,
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('available-local does not list source directories as loadable assets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-source-dir-'));
  try {
    makeKdnaSource(root);
    const available = callTool('kdna.available-local', { root, maxDepth: 1 });
    assert.deepEqual(available, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('available-local isolates a malformed packaged neighbor', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-malformed-neighbor-'));
  try {
    const validPath = makeKdnaContainer(root, 'valid.kdna');
    const invalidRoot = path.join(root, 'invalid-source-root');
    fs.mkdirSync(invalidRoot);
    const invalidSource = makeKdnaSource(invalidRoot);
    fs.writeFileSync(path.join(invalidSource, 'kdna.json'), '{not-json');
    const invalidPath = path.join(root, 'invalid.kdna');
    pack(invalidSource, invalidPath);

    const available = callTool('kdna.available-local', { root, maxDepth: 0 });
    const valid = available.find(({ path: candidate }) => candidate === validPath);
    const invalid = available.find(({ path: candidate }) => candidate === invalidPath);
    assert.ok(valid);
    assert.equal(valid.loadable, true);
    assert.ok(invalid);
    assert.equal(invalid.loadable, false);
    assert.deepEqual(invalid.problems, ['KDNA_ASSET_INVALID']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('available-local defaults to ~/.kdna/packages', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-home-'));
  try {
    const packagesRoot = path.join(home, '.kdna', 'packages');
    const legacyAssetsRoot = path.join(home, '.kdna', 'assets');
    fs.mkdirSync(packagesRoot, { recursive: true });
    fs.mkdirSync(legacyAssetsRoot, { recursive: true });
    makeKdnaContainer(packagesRoot);

    const available = callTool('kdna.available-local', {}, {
      env: {
        ...process.env,
        HOME: home,
        KDNA_ASSET_DIR: '',
        KDNA_PACKAGE_DIR: '',
      },
    });
    assert.equal(available.length, 1);
    assert.equal(available[0].asset_id, 'kdna:test:writing');
    assert.ok(available[0].path.startsWith(packagesRoot));
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('initialize reports the package version', () => {
  const response = initialize();
  assert.equal(response.result.serverInfo.version, packageInfo.version);
  assert.equal(HOST_PROTOCOL, 'kdna.agent-host');
  assert.equal(HOST_PROTOCOL_VERSION, '0.1.0');
  assert.equal(response.result.protocolVersion, '2024-11-05');
});

test('tools/list exposes only current local-asset tools and load credentials', () => {
  const tools = listTools();
  assert.equal(tools.length, 6);
  assert.equal(tools.some((tool) => tool.name === 'kdna.available'), false);
  const loadTool = tools.find((tool) => tool.name === 'kdna.load');
  assert.ok(loadTool);
  assert.equal(loadTool.inputSchema.properties.password.type, 'string');
  assert.ok(loadTool.inputSchema.properties.entitlementStatus);
});

test('tool execution errors preserve the request id and use MCP isError results', () => {
  const response = callToolRaw('kdna.load', { assetPath: '/not/a/current/asset.kdna' });
  assert.equal(response.id, 1);
  assert.equal(response.error, undefined);
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /not a current KDNA asset/);
});

test('JSON-RPC reports unknown methods, parse failures, and invalid tool params canonically', async (t) => {
  const unknown = sendRawLine(JSON.stringify({ jsonrpc: '2.0', id: 71, method: 'kdna.unknown' }));
  assert.equal(unknown.id, 71);
  assert.deepEqual(unknown.error, { code: -32601, message: 'Method not found' });

  const parse = sendRawLine('{"jsonrpc":"2.0","id":');
  assert.equal(parse.id, null);
  assert.deepEqual(parse.error, { code: -32700, message: 'Parse error' });

  const invalidMcpParams = sendRawLine(JSON.stringify({
    jsonrpc: '2.0', id: 72, method: 'tools/list', params: [],
  }));
  assert.equal(invalidMcpParams.id, 72);
  assert.deepEqual(invalidMcpParams.error, { code: -32602, message: 'Invalid params' });

  const invalidCases = [
    ['missing required assetPath', 'kdna.load', {}],
    ['negative maxDepth', 'kdna.available-local', { maxDepth: -1 }],
    ['fractional maxDepth', 'kdna.available-local', { maxDepth: 0.5 }],
    ['unknown load argument', 'kdna.load', { assetPath: '/tmp/asset.kdna', surprise: true }],
    ['password value is not a plan-load argument', 'kdna.plan-load', { assetPath: '/tmp/asset.kdna', password: 'ignored' }],
    ['non-object arguments', 'kdna.available-local', []],
    ['unknown tool', 'kdna.not-a-tool', {}],
  ];
  for (const [name, tool, args] of invalidCases) {
    await t.test(name, () => {
      const response = callToolRaw(tool, args);
      assert.equal(response.id, 1);
      assert.deepEqual(response.error, { code: -32602, message: 'Invalid params' });
    });
  }
});

test('JSON-RPC rejects every invalid MCP request envelope instead of silently dropping it', async (t) => {
  const invalidRequests = [
    ['null', 'null'],
    ['empty array', '[]'],
    ['empty object', '{}'],
    ['wrong protocol version', JSON.stringify({ jsonrpc: '1.0', id: 1, method: 'tools/list' })],
    ['non-string method', JSON.stringify({ jsonrpc: '2.0', id: 1, method: 3 })],
    ['null MCP request id', JSON.stringify({ jsonrpc: '2.0', id: null, method: 'tools/list' })],
    ['boolean MCP request id', JSON.stringify({ jsonrpc: '2.0', id: true, method: 'tools/list' })],
    ['single-message transport batch', JSON.stringify([
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    ])],
  ];

  for (const [name, line] of invalidRequests) {
    await t.test(name, () => {
      const response = sendRawLine(line);
      assert.equal(response.id, null);
      assert.deepEqual(response.error, { code: -32600, message: 'Invalid Request' });
    });
  }
});

test('finite numeric and string request ids are preserved exactly', async (t) => {
  const validIds = [1.5, -7.25, Number.MAX_VALUE, '', 'request-id'];
  for (const id of validIds) {
    await t.test(JSON.stringify(id), () => {
      const response = sendRawLine(JSON.stringify({ jsonrpc: '2.0', id, method: 'kdna.unknown' }));
      assert.equal(response.id, id);
      assert.deepEqual(response.error, { code: -32601, message: 'Method not found' });
    });
  }

  for (const token of ['NaN', 'Infinity', '-Infinity']) {
    await t.test(`non-JSON numeric token ${token}`, () => {
      const response = sendRawLine(`{"jsonrpc":"2.0","id":${token},"method":"tools/list"}`);
      assert.equal(response.id, null);
      assert.deepEqual(response.error, { code: -32700, message: 'Parse error' });
    });
  }
});

test('valid known and unknown notifications never produce JSON-RPC responses', async (t) => {
  const notifications = [
    ['known request method without id', { jsonrpc: '2.0', method: 'tools/list' }],
    ['known MCP notification', { jsonrpc: '2.0', method: 'notifications/initialized' }],
    ['unknown notification', { jsonrpc: '2.0', method: 'kdna.unknown' }],
  ];

  for (const [name, notification] of notifications) {
    await t.test(name, () => {
      assert.equal(sendRawLineText(JSON.stringify(notification)), '');
    });
  }
});

test('kdna.load refuses an asset when LoadPlan cannot load now', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-load-denied-'));
  const secret = 'MCP_SECRET_PAYLOAD_SHOULD_NOT_LEAK';
  try {
    const sourceDir = makeKdnaSource(root);
    const manifestPath = path.join(sourceDir, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.access = 'remote';
    manifest.runtime = { endpoint: 'https://runtime.example.test/project' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    const payloadPath = path.join(sourceDir, 'payload.kdnab');
    const payload = cbor.decode(fs.readFileSync(payloadPath));
    payload.core.axioms = [{ id: 'secret', one_sentence: secret }];
    fs.writeFileSync(payloadPath, cbor.encode(payload));
    fs.writeFileSync(path.join(sourceDir, 'checksums.json'), JSON.stringify(buildChecksums(sourceDir), null, 2));
    const assetPath = path.join(root, 'remote.kdna');
    pack(sourceDir, assetPath);

    const plan = callTool('kdna.plan-load', { assetPath });
    assert.equal(plan.can_load_now, false);
    assert.equal(plan.state, 'needs_runtime');

    const response = callToolRaw('kdna.load', { assetPath, profile: 'compact' });
    assert.equal(response.error, undefined, JSON.stringify(response));
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /LoadPlan denied loading/);
    assert.ok(!response.result.content[0].text.includes(secret));
    assert.ok(!JSON.stringify(response).includes(secret));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('plan-load uses the Core API when available', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-plan-core-'));
  try {
    const assetPath = makeKdnaContainer(root);
    const tools = listTools();
    assert.ok(tools.some((tool) => tool.name === 'kdna.plan-load'));

    const plan = callTool('kdna.plan-load', { assetPath });

    assert.equal(plan.state, 'ready');
    assert.equal(plan.required_action, 'load');
    assert.equal(plan.can_load_now, true);
    assert.equal(plan.asset.asset_id, 'kdna:test:writing');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('plan-load can fall back to the official CLI when Core API is unavailable', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-plan-'));
  try {
    const assetPath = makeKdnaContainer(root);
    const binDir = path.join(root, 'bin');
    const argvFile = path.join(root, 'argv.json');
    const expectedPlan = planLoad(assetPath);
    fs.mkdirSync(binDir);
    const kdnaBin = path.join(binDir, 'kdna');
    fs.writeFileSync(kdnaBin, `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync(${JSON.stringify(argvFile)}, JSON.stringify(process.argv.slice(2)));
console.log(${JSON.stringify(JSON.stringify(expectedPlan))});
`);
    fs.chmodSync(kdnaBin, 0o755);

    const tools = listTools();
    assert.ok(tools.some((tool) => tool.name === 'kdna.plan-load'));

    const plan = callTool('kdna.plan-load', { assetPath, hasPassword: true, entitlementStatus: 'active' }, {
      env: {
        ...process.env,
        KDNA_MCP_FORCE_CLI_PLAN_LOAD: '1',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
      },
    });

    assert.equal(plan.state, 'ready');
    assert.equal(plan.required_action, 'load');
    assert.equal(plan.can_load_now, true);
    assert.deepEqual(JSON.parse(fs.readFileSync(argvFile, 'utf8')), [
      'plan-load',
      assetPath,
      '--json',
      '--has-password',
      '--entitlement-status',
      'active',
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('plan-load CLI fallback preserves non-loadable LoadPlans from exit code 3', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-plan-denied-'));
  try {
    const assetPath = makeRemoteKdnaContainer(root);
    const expectedPlan = planLoad(assetPath);
    const binDir = path.join(root, 'bin');
    fs.mkdirSync(binDir);
    const kdnaBin = path.join(binDir, 'kdna');
    fs.writeFileSync(kdnaBin, `#!/usr/bin/env node
console.log(${JSON.stringify(JSON.stringify(expectedPlan))});
process.exit(3);
`);
    fs.chmodSync(kdnaBin, 0o755);

    const plan = callTool('kdna.plan-load', { assetPath }, {
      env: {
        ...process.env,
        KDNA_MCP_FORCE_CLI_PLAN_LOAD: '1',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
      },
    });

    assert.equal(plan.state, 'needs_runtime');
    assert.equal(plan.required_action, 'connect_runtime');
    assert.equal(plan.can_load_now, false);
    assert.equal(plan.issues[0].code, 'KDNA_AUTH_REMOTE_RUNTIME_REQUIRED');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('plan-load CLI fallback rejects success-shaped JSON from an unexpected exit', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-plan-hostile-exit-'));
  try {
    const assetPath = makeKdnaContainer(root);
    const expectedPlan = planLoad(assetPath);
    const binDir = path.join(root, 'bin');
    fs.mkdirSync(binDir);
    const kdnaBin = path.join(binDir, 'kdna');
    fs.writeFileSync(kdnaBin, `#!/usr/bin/env node
console.log(${JSON.stringify(JSON.stringify(expectedPlan))});
process.exit(1);
`);
    fs.chmodSync(kdnaBin, 0o755);

    const response = callToolRaw('kdna.plan-load', { assetPath }, {
      env: {
        ...process.env,
        KDNA_MCP_FORCE_CLI_PLAN_LOAD: '1',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
      },
    });
    assert.equal(response.error, undefined);
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /kdna CLI exited 1/);
    assert.doesNotMatch(response.result.content[0].text, /can_load_now/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('plan-load CLI fallback rejects malformed LoadPlan JSON at allowed exits', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-plan-invalid-base-'));
  const ready = planLoad(makeKdnaContainer(root));
  const remoteRoot = path.join(root, 'remote-root');
  fs.mkdirSync(remoteRoot);
  const denied = planLoad(makeRemoteKdnaContainer(remoteRoot));
  const cases = [
    ['success with missing issues', 0, (value) => { delete value.issues; }],
    ['success marked non-loadable', 0, (value) => { value.can_load_now = false; }],
    ['denial marked loadable', 3, (value) => { value.can_load_now = true; }],
    ['unknown state and action', 0, (value) => { value.state = 'invented'; value.required_action = 'invented'; }],
    ['additional top-level field', 0, (value) => { value.untrusted = true; }],
  ];

  for (const [name, status, mutate] of cases) {
    await t.test(name, () => {
      const caseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-plan-invalid-'));
      try {
        const assetPath = status === 3 ? makeRemoteKdnaContainer(caseRoot) : makeKdnaContainer(caseRoot);
        const output = structuredClone(status === 3 ? denied : ready);
        output.source.path = assetPath;
        mutate(output);
        const binDir = path.join(caseRoot, 'bin');
        fs.mkdirSync(binDir);
        const kdnaBin = path.join(binDir, 'kdna');
        fs.writeFileSync(kdnaBin, `#!/usr/bin/env node\nconsole.log(${JSON.stringify(JSON.stringify(output))});\nprocess.exit(${status});\n`);
        fs.chmodSync(kdnaBin, 0o755);
        const response = callToolRaw('kdna.plan-load', { assetPath }, {
          env: {
            ...process.env,
            KDNA_MCP_FORCE_CLI_PLAN_LOAD: '1',
            PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
          },
        });
        assert.equal(response.result.isError, true);
        assert.match(response.result.content[0].text, /invalid LoadPlan|non-loadable success|loadable denial/);
      } finally {
        fs.rmSync(caseRoot, { recursive: true, force: true });
      }
    });
  }
  fs.rmSync(root, { recursive: true, force: true });
});
