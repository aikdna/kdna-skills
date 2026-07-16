#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = '@aikdna/kdna-core';
const VERSION = '0.19.0';
const ARTIFACT = 'test/fixtures/runtime-candidates/kdna-core-0.19.0.tgz';
const SOURCE = Object.freeze({
  repository: 'aikdna/kdna',
  commit: '556f8cec37c94fc9c006035b0bdeefc80d04d9c2',
  tree: 'd8cd795ba12045217f413f40cbf89f910d50c31d',
  package_root: 'packages/kdna-core',
  package_subtree: '0131c843649ac2899180acb1ae70bc398171a1fe',
});
const ARTIFACT_FACTS = Object.freeze({
  size: 114267,
  sha1: '358e33e009399379775335ef6ad35ff565cca57f',
  sha256: '8b3938405b60cf611623dd5496e5e7334b2b5545fb6b8c84f56c48dae8cfbf62',
  integrity: 'sha512-Ewm+Lx1VEAf9hjIeoulwZNNC3/TnnOzgW59lQNNguleKBnCf+2cptdBjM0oAOQe8oPKneTWE5owmZpI1Lmdgxg==',
  entry_count: 42,
  source_pack_equivalence: 'strict_install_equivalent',
});
const UPSTREAM_EVIDENCE = Object.freeze({
  repo: 'aikdna/kdna-cli',
  commit: '220d95aa8640ccce52701173a5a8b14de60fda44',
  path: 'tests/fixtures/core-0.19-candidate-evidence.json',
  sha256: '4ad002d84addd99e29cb25863bf5771ca2a5bd6d0006d2734ce7e7a5db59de8e',
});

function hash(algorithm, bytes, encoding = 'hex') {
  return crypto.createHash(algorithm).update(bytes).digest(encoding);
}

function assertExactKeys(value, keys, label) {
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} keys must be exact`);
}

function tarEntries(bytes) {
  const tar = zlib.gunzipSync(bytes);
  const entries = [];
  let offset = 0;
  let endBlocks = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    offset += 512;
    if (header.every((byte) => byte === 0)) {
      endBlocks += 1;
      if (endBlocks === 2) break;
      continue;
    }
    endBlocks = 0;
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/s, '');
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/s, '').trim();
    const size = Number.parseInt(sizeText || '0', 8);
    assert.ok(Number.isSafeInteger(size) && size >= 0, 'candidate tar entry size is invalid');
    assert.ok(offset + size <= tar.length, 'candidate tar entry is truncated');
    const content = tar.subarray(offset, offset + size);
    entries.push({ name, content });
    offset += Math.ceil(size / 512) * 512;
  }
  assert.equal(endBlocks, 2, 'candidate tar must end with two zero blocks');
  return entries;
}

export function validateCandidateFacts({
  binding,
  artifactBytes,
  packageJson,
  lock,
  installed,
  packedFiles,
}) {
  assertExactKeys(
    binding,
    [
      'schema',
      'schema_version',
      'package',
      'version',
      'source',
      'artifact',
      'upstream_evidence',
      'registry_boundary',
    ],
    'candidate binding',
  );
  assert.equal(binding.schema, 'kdna.core.source-candidate-binding');
  assert.equal(binding.schema_version, '1.0.0');
  assert.equal(binding.package, CORE);
  assert.equal(binding.version, VERSION);
  assertExactKeys(binding.source, Object.keys(SOURCE), 'source authority');
  assert.deepEqual(binding.source, SOURCE);
  assertExactKeys(
    binding.artifact,
    ['path', ...Object.keys(ARTIFACT_FACTS)],
    'artifact authority',
  );
  assert.equal(binding.artifact.path, ARTIFACT);
  assert.deepEqual(
    {
      size: binding.artifact.size,
      sha1: binding.artifact.sha1,
      sha256: binding.artifact.sha256,
      integrity: binding.artifact.integrity,
      entry_count: binding.artifact.entry_count,
      source_pack_equivalence: binding.artifact.source_pack_equivalence,
    },
    ARTIFACT_FACTS,
  );
  assertExactKeys(binding.upstream_evidence, Object.keys(UPSTREAM_EVIDENCE), 'upstream evidence');
  assert.deepEqual(binding.upstream_evidence, UPSTREAM_EVIDENCE);
  assert.deepEqual(binding.registry_boundary, {
    published: true,
    observed_at: '2026-07-16T15:23:00Z',
    http_status: 200,
  });

  assert.equal(artifactBytes.length, ARTIFACT_FACTS.size);
  assert.equal(hash('sha1', artifactBytes), ARTIFACT_FACTS.sha1);
  assert.equal(hash('sha256', artifactBytes), ARTIFACT_FACTS.sha256);
  assert.equal(`sha512-${hash('sha512', artifactBytes, 'base64')}`, ARTIFACT_FACTS.integrity);
  const entries = tarEntries(artifactBytes);
  assert.equal(entries.length, ARTIFACT_FACTS.entry_count);
  const packagedJson = entries.filter(({ name }) => name === 'package/package.json');
  assert.equal(packagedJson.length, 1, 'candidate tar must contain one package.json');
  const packaged = JSON.parse(packagedJson[0].content.toString('utf8'));
  assert.equal(packaged.name, CORE);
  assert.equal(packaged.version, VERSION);

  assert.equal(packageJson.dependencies[CORE], VERSION);
  assert.equal(lock.packages[''].dependencies[CORE], VERSION);
  const locked = lock.packages[`node_modules/${CORE}`];
  assert.equal(locked.version, VERSION);
  const allowedResolutions = new Set([
    `file:${ARTIFACT}`,
    `https://registry.npmjs.org/${CORE}/-/kdna-core-${VERSION}.tgz`,
  ]);
  assert.ok(
    allowedResolutions.has(locked.resolved),
    `Core lock resolution must be the checked-in artifact or the canonical registry artifact: ${locked.resolved}`,
  );
  assert.equal(locked.integrity, ARTIFACT_FACTS.integrity);
  assert.equal(installed.name, CORE);
  assert.equal(installed.version, VERSION);
  const coreEntries = Object.keys(lock.packages).filter((entry) =>
    entry.toLowerCase().endsWith(`node_modules/${CORE}`),
  );
  assert.deepEqual(coreEntries, [`node_modules/${CORE}`], 'lock must contain exactly one Core copy');
  assert.equal(
    packedFiles.some(({ path: packedPath }) =>
      packedPath.endsWith('.tgz') || packedPath.startsWith('test/') || packedPath.startsWith('scripts/'),
    ),
    false,
    'published MCP pack must exclude candidate, tests, and source-only scripts',
  );
  return { entry_count: entries.length, packed_file_count: packedFiles.length };
}

function npmPackFiles() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-candidate-pack-'));
  try {
    const result = spawnSync(
      'npm',
      ['pack', '--dry-run', '--json', '--ignore-scripts', '--pack-destination', temporary],
      { cwd: PACKAGE_ROOT, encoding: 'utf8', shell: false, maxBuffer: 16 * 1024 * 1024 },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.length, 1);
    return report[0].files;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

export function verifyCoreCandidate(root = PACKAGE_ROOT) {
  const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const binding = readJson('test/fixtures/runtime-candidates/binding.json');
  const result = validateCandidateFacts({
    binding,
    artifactBytes: fs.readFileSync(path.join(root, binding.artifact.path)),
    packageJson: readJson('package.json'),
    lock: readJson('package-lock.json'),
    installed: readJson('node_modules/@aikdna/kdna-core/package.json'),
    packedFiles: npmPackFiles(),
  });
  return { ...result, commit: binding.source.commit, sha256: binding.artifact.sha256 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = verifyCoreCandidate();
  console.log(
    `Core registry artifact verified: ${CORE}@${VERSION} ${result.commit.slice(0, 12)} ${result.sha256.slice(0, 12)} (${result.entry_count} Core entries; ${result.packed_file_count} MCP pack files)`,
  );
}
