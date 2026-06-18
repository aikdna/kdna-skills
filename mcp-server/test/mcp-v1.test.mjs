import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildChecksumsV1 } = require('@aikdna/kdna-core/v1');

const server = path.join(process.cwd(), 'bin', 'kdna-mcp.mjs');

function callTool(name, args) {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name, arguments: args },
  };
  const r = spawnSync(process.execPath, [server], {
    input: `${JSON.stringify(request)}\n`,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  const response = JSON.parse(r.stdout.trim());
  assert.ok(!response.error, response.error && response.error.message);
  return JSON.parse(response.result.content[0].text);
}

function makeV1Source(root) {
  const dir = path.join(root, 'writing');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
  fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({
    kdna_version: '1.0',
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
    payload: { path: 'payload.kdnab', encoding: 'json', encrypted: false },
    compatibility: { min_loader_version: '1.0.0', profile: 'judgment-profile-v1' },
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
  fs.writeFileSync(path.join(dir, 'payload.kdnab'), JSON.stringify({
    profile: 'judgment-profile-v1',
    core: {
      highest_question: 'What makes this writing judgment useful?',
      axioms: [{ id: 'ax1', one_sentence: 'Structure before wording.' }],
      boundaries: [{ type: 'stance_boundary', stance: 'Do not polish before diagnosis.' }],
      risk_model: {},
    },
    patterns: [],
    scenarios: [],
    cases: [],
    reasoning: { self_checks: ['Did I diagnose before editing?'], failure_modes: [] },
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'checksums.json'), JSON.stringify(buildChecksumsV1(dir), null, 2));
  return dir;
}

test('available-local discovers v1 source dirs and load returns prompt context', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-v1-'));
  try {
    makeV1Source(root);
    const available = callTool('kdna.available-local', { root, maxDepth: 1 });
    assert.equal(available.length, 1);
    assert.equal(available[0].asset_id, 'kdna:test:writing');
    assert.equal(available[0].loadable, true, JSON.stringify(available[0]));
    assert.equal(Object.prototype.hasOwnProperty.call(available[0], 'quality_badge'), false);

    const loaded = callTool('kdna.load', { assetPath: path.join(root, 'writing'), profile: 'compact' });
    assert.equal(loaded.asset_id, 'kdna:test:writing');
    assert.match(loaded.context, /Structure before wording/);
    assert.match(loaded.context, /Do not polish before diagnosis/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
