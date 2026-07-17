import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateCandidateFacts } from '../scripts/verify-core-candidate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const canonical = () => ({
  binding: readJson('test/fixtures/runtime-candidates/binding.json'),
  artifactBytes: fs.readFileSync(path.join(root, 'test/fixtures/runtime-candidates/kdna-core-0.20.0.tgz')),
  packageJson: readJson('package.json'),
  lock: readJson('package-lock.json'),
  installed: readJson('node_modules/@aikdna/kdna-core/package.json'),
  packedFiles: [
    { path: 'LICENSE' },
    { path: 'NOTICE' },
    { path: 'README.md' },
    { path: 'bin/kdna-mcp.mjs' },
    { path: 'package.json' },
  ],
});

test('Core source candidate binding accepts only the fixed install-equivalent artifact', () => {
  assert.deepEqual(validateCandidateFacts(canonical()), { entry_count: 42, packed_file_count: 5 });
});

test('Core source candidate binding rejects authority and artifact drift', async (t) => {
  const mutations = [
    ['commit drift', (facts) => { facts.binding.source.commit = '0'.repeat(40); }],
    ['tree drift', (facts) => { facts.binding.source.tree = '0'.repeat(40); }],
    ['subtree drift', (facts) => { facts.binding.source.package_subtree = '0'.repeat(40); }],
    ['artifact path drift', (facts) => { facts.binding.artifact.path = 'test/fixtures/core.tgz'; }],
    ['artifact authority extension', (facts) => { facts.binding.artifact.compatibility_exception = true; }],
    ['upstream evidence drift', (facts) => { facts.binding.upstream_evidence.path = 'missing.json'; }],
    ['registry observation drift', (facts) => { facts.binding.registry_boundary.observed_at = 'not-a-timestamp'; }],
    ['registry claim drift', (facts) => { facts.binding.registry_boundary.published = false; }],
    ['registry authority extension', (facts) => { facts.binding.registry_boundary.compatibility_exception = true; }],
    ['top-level release claim', (facts) => { facts.binding.release_authority = 'published'; }],
    ['artifact byte drift', (facts) => { facts.artifactBytes = Buffer.from(facts.artifactBytes); facts.artifactBytes[100] ^= 1; }],
    ['formal dependency drift', (facts) => { facts.packageJson.dependencies['@aikdna/kdna-core'] = '0.18.0'; }],
    ['lock dependency drift', (facts) => { facts.lock.packages[''].dependencies['@aikdna/kdna-core'] = '0.18.0'; }],
    ['lock resolution drift', (facts) => { facts.lock.packages['node_modules/@aikdna/kdna-core'].resolved = 'https://registry.invalid/core.tgz'; }],
    ['installed version drift', (facts) => { facts.installed.version = '0.18.0'; }],
    ['shadow Core copy', (facts) => { facts.lock.packages['node_modules/foreign/node_modules/@aikdna/kdna-core'] = { version: '0.20.0' }; }],
    ['candidate leaked into pack', (facts) => { facts.packedFiles.push({ path: 'test/fixtures/runtime-candidates/core.tgz' }); }],
  ];
  for (const [name, mutate] of mutations) {
    await t.test(name, () => {
      const facts = canonical();
      mutate(facts);
      assert.throws(() => validateCandidateFacts(facts));
    });
  }
});
