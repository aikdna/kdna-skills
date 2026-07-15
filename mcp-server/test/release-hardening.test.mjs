import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(packageRoot, '..');
const { validateCurrentReleaseBinding } = require('../../scripts/current-release-binding');
const { validateReleaseContext } = require('../../scripts/release-policy');
const { validateEvidenceArtifact, validatePackReport } = require('../../scripts/release-evidence');
const { publishArguments, publishCandidate } = require('../../scripts/publish-verified-artifact');
const { guardCandidate } = require('../../scripts/registry-duplicate-guard');
const { evaluateRegistryResult, expectedE404 } = require('../../scripts/registry-duplicate-policy');

const HASH = 'a'.repeat(40);
const CHECKOUT_V7_SHA = '9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0';
const SETUP_NODE_V6_SHA = '249970729cb0ef3589644e2896645e5dc5ba9c38';

function releaseInput(overrides = {}) {
  const version = overrides.pkg?.version || '1.2.3';
  return {
    pkg: { name: '@aikdna/kdna-mcp-server', version, ...overrides.pkg },
    changelog: overrides.changelog ?? `# Changelog\n\n## ${version} (2026-07-15)\n`,
    env: {
      GITHUB_EVENT_NAME: 'release',
      RELEASE_EVENT_ACTION: 'published',
      RELEASE_TAG_NAME: `v${version}`,
      RELEASE_IS_DRAFT: 'false',
      RELEASE_IS_PRERELEASE: 'false',
      GITHUB_REF: `refs/tags/v${version}`,
      GITHUB_SHA: HASH,
      ...overrides.env,
    },
    git: { status: '', head: HASH, tagCommit: HASH, ...overrides.git },
  };
}

function evidence(overrides = {}) {
  const base = {
    schema: 'kdna.mcp.release-evidence',
    version: '1.0',
    source: { ref: 'refs/tags/v1.2.3', commit: HASH },
    package: { name: '@aikdna/kdna-mcp-server', version: '1.2.3' },
    artifact: {
      filename: 'aikdna-kdna-mcp-server-1.2.3.tgz',
      integrity: `sha512-${Buffer.alloc(64).toString('base64')}`,
      shasum: 'b'.repeat(40),
      packed_size: 100,
      unpacked_size: 200,
      file_count: 1,
      files: [{ path: 'package.json', size: 200 }],
    },
  };
  return {
    ...base,
    ...overrides,
    source: { ...base.source, ...overrides.source },
    package: { ...base.package, ...overrides.package },
    artifact: { ...base.artifact, ...overrides.artifact },
  };
}

function e404Result(candidate = evidence()) {
  const expected = expectedE404(candidate);
  return { status: 1, stdout: JSON.stringify({ error: { code: 'E404', ...expected } }), stderr: '' };
}

function registryMetadata(candidate = evidence(), overrides = {}) {
  return JSON.stringify({
    name: candidate.package.name,
    version: candidate.package.version,
    'dist.integrity': candidate.artifact.integrity,
    'dist.shasum': candidate.artifact.shasum,
    ...overrides,
  });
}

test('formal Runtime pair resolves exactly one Core 0.18.0 copy', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package-lock.json'), 'utf8'));
  const installed = JSON.parse(fs.readFileSync(path.join(packageRoot, 'node_modules/@aikdna/kdna-core/package.json'), 'utf8'));
  assert.equal(pkg.version, '0.4.2');
  assert.equal(pkg.dependencies['@aikdna/kdna-core'], '0.18.0');
  assert.equal(lock.packages[''].dependencies['@aikdna/kdna-core'], '0.18.0');
  assert.equal(lock.packages['node_modules/@aikdna/kdna-core'].version, '0.18.0');
  assert.equal(installed.version, '0.18.0');
  const coreEntries = Object.keys(lock.packages).filter((entry) => entry.endsWith('node_modules/@aikdna/kdna-core'));
  assert.deepEqual(coreEntries, ['node_modules/@aikdna/kdna-core']);
});

test('publish workflow is stable release-only and publishes only the verified tarball', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/publish.yml'), 'utf8');
  assert.doesNotMatch(workflow, /workflow_dispatch/);
  assert.match(workflow, /release:\n\s+types: \[published\]/);
  assert.match(workflow, /release\.draft == false/);
  assert.match(workflow, /release\.prerelease == false/);
  assert.match(workflow, new RegExp(`actions/checkout@${CHECKOUT_V7_SHA}`));
  assert.match(workflow, new RegExp(`actions/setup-node@${SETUP_NODE_V6_SHA}`));
  assert.match(workflow, /npm@11\.17\.0/);
  assert.match(workflow, /registry-duplicate-guard\.js/);
  assert.match(workflow, /publish-verified-artifact\.js/);
  assert.match(workflow, /--artifact "\$RUNNER_TEMP\/kdna-mcp-release\.tgz"/);
  assert.doesNotMatch(workflow, /npm publish --provenance/);
});

test('release context binds event, stable package, tag, ref, SHA, HEAD, clean tree, and changelog', async (t) => {
  assert.equal(validateReleaseContext(releaseInput()).commit, HASH);
  const cases = [
    releaseInput({ pkg: { name: '@other/name' } }),
    releaseInput({ pkg: { version: '1.2.3-rc.1' } }),
    releaseInput({ env: { GITHUB_EVENT_NAME: 'workflow_dispatch' } }),
    releaseInput({ env: { RELEASE_IS_DRAFT: 'true' } }),
    releaseInput({ env: { RELEASE_IS_PRERELEASE: 'true' } }),
    releaseInput({ env: { GITHUB_REF: 'refs/heads/main' } }),
    releaseInput({ env: { GITHUB_SHA: 'c'.repeat(40) } }),
    releaseInput({ git: { status: '?? artifact.tgz' } }),
    releaseInput({ git: { tagCommit: 'c'.repeat(40) } }),
    releaseInput({ changelog: '# Changelog\n\nnotes for 1.2.3 only\n' }),
    releaseInput({ changelog: '# Changelog\n\n## 1.2.2\n\n## 1.2.3\n' }),
  ];
  for (const candidate of cases) await t.test('rejects ambiguous input', () => assert.throws(() => validateReleaseContext(candidate)));
});

test('pack evidence independently verifies identity, file list, sizes, SHA-1, and SHA-512', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-pack-test-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const packed = spawnSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temp], {
    cwd: packageRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
  });
  assert.equal(packed.status, 0, packed.stderr);
  const report = JSON.parse(packed.stdout)[0];
  const tarball = fs.readFileSync(path.join(temp, report.filename));
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const candidate = validatePackReport({
    reportText: packed.stdout,
    tarball,
    pkg,
    source: { ref: `refs/tags/v${pkg.version}`, commit: HASH },
  });
  assert.equal(candidate.artifact.shasum, crypto.createHash('sha1').update(tarball).digest('hex'));
  assert.equal(candidate.artifact.files.length, candidate.artifact.file_count);
  assert.equal(validateEvidenceArtifact(candidate, tarball), candidate);
  const tampered = Buffer.from(tarball);
  tampered[tampered.length - 1] ^= 1;
  assert.throws(() => validateEvidenceArtifact(candidate, tampered), /shasum|integrity|tar/i);
});

test('stale release evidence blocks lookup and publish before either side effect', () => {
  let calls = 0;
  const stale = () => { throw new Error('stale binding'); };
  assert.throws(() => guardCandidate({ evidence: evidence(), tarball: Buffer.from('x'), bindCurrent: stale, lookup: () => { calls += 1; } }));
  assert.throws(() => publishCandidate({ evidence: evidence(), tarball: Buffer.from('x'), artifactPath: '/tmp/x.tgz', bindCurrent: stale, publish: () => { calls += 1; } }));
  assert.equal(calls, 0);
  assert.throws(() => validateCurrentReleaseBinding({ evidence: evidence(), ...releaseInput({ git: { status: ' M package.json' } }) }));
});

test('only an exact target-bound registry E404 permits new publication', async (t) => {
  assert.deepEqual(evaluateRegistryResult(e404Result(), evidence()), { decision: 'publish', shouldPublish: true });
  const base = e404Result();
  const wrongTarget = JSON.parse(base.stdout);
  wrongTarget.error.detail = wrongTarget.error.detail.replace('1.2.3', '9.9.9');
  const cases = [
    { ...base, stdout: `notice\n${base.stdout}` },
    { ...base, stdout: JSON.stringify(wrongTarget) },
    { ...base, stderr: 'npm error code E401\n' },
    { status: 2, stdout: '', stderr: 'network unavailable' },
    { status: null, stdout: '', stderr: '', error: new Error('ETIMEDOUT') },
  ];
  for (const result of cases) await t.test('rejects registry ambiguity', () => assert.throws(() => evaluateRegistryResult(result, evidence())));
});

test('existing version skips only for exact identity and artifact hashes', async (t) => {
  const candidate = evidence();
  assert.deepEqual(
    evaluateRegistryResult({ status: 0, stdout: registryMetadata(candidate), stderr: '' }, candidate),
    { decision: 'skip-identical', shouldPublish: false },
  );
  for (const changes of [
    { name: '@other/name' },
    { version: '1.2.4' },
    { 'dist.integrity': `sha512-${Buffer.alloc(64, 1).toString('base64')}` },
    { 'dist.shasum': 'c'.repeat(40) },
  ]) {
    await t.test('rejects collision', () => assert.throws(() => evaluateRegistryResult({ status: 0, stdout: registryMetadata(candidate, changes), stderr: '' }, candidate)));
  }
});

test('publisher is fixed to the exact tarball, official registry, scripts off, and provenance on', () => {
  assert.deepEqual(publishArguments('/tmp/exact.tgz'), [
    'publish', '/tmp/exact.tgz', '--ignore-scripts', '--provenance', '--access', 'public',
    '--registry=https://registry.npmjs.org/',
  ]);
});
