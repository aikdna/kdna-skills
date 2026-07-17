import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(packageRoot, '..');
const { validateCurrentReleaseBinding } = require('../../scripts/current-release-binding');
const { validateReleaseContext } = require('../../scripts/release-policy');
const { parseTarFiles, validateEvidenceArtifact, validatePackReport } = require('../../scripts/release-evidence');
const { publishArguments, publishCandidate } = require('../../scripts/publish-verified-artifact');
const { guardCandidate } = require('../../scripts/registry-duplicate-guard');
const { evaluateRegistryResult, expectedE404 } = require('../../scripts/registry-duplicate-policy');

const HASH = 'a'.repeat(40);
const CHECKOUT_ACTION_SHA = '9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0';
const SETUP_NODE_ACTION_SHA = '249970729cb0ef3589644e2896645e5dc5ba9c38';

function writeTarString(header, offset, length, value) {
  const bytes = Buffer.from(value);
  assert.ok(bytes.length <= length, `tar field is too long: ${value}`);
  bytes.copy(header, offset);
}

function writeTarOctal(header, offset, length, value) {
  const octal = value.toString(8).padStart(length - 1, '0');
  assert.ok(octal.length < length, `tar numeric field is too large: ${value}`);
  header.write(octal, offset, length - 1, 'ascii');
  header[offset + length - 1] = 0;
}

function tarEntry({ name, content = Buffer.alloc(0), type = '0' }) {
  const data = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const header = Buffer.alloc(512);
  writeTarString(header, 0, 100, name);
  writeTarOctal(header, 100, 8, 0o644);
  writeTarOctal(header, 108, 8, 0);
  writeTarOctal(header, 116, 8, 0);
  writeTarOctal(header, 124, 12, data.length);
  writeTarOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header[156] = type.charCodeAt(0);
  writeTarString(header, 257, 6, 'ustar');
  writeTarString(header, 263, 2, '00');
  const checksum = header.reduce((total, byte) => total + byte, 0);
  header.write(checksum.toString(8).padStart(6, '0'), 148, 6, 'ascii');
  header[154] = 0;
  header[155] = 0x20;
  return Buffer.concat([header, data, Buffer.alloc((512 - (data.length % 512)) % 512)]);
}

function tarGzip(entries, { endBlocks = 2, trailing = Buffer.alloc(0) } = {}) {
  return zlib.gzipSync(
    Buffer.concat([
      ...entries.map((entry) => tarEntry(entry)),
      Buffer.alloc(512 * endBlocks),
      trailing,
    ]),
  );
}

function paxRecord(key, value) {
  const body = `${key}=${value}\n`;
  let length = Buffer.byteLength(`0 ${body}`);
  while (true) {
    const record = `${length} ${body}`;
    const actual = Buffer.byteLength(record);
    if (actual === length) return Buffer.from(record);
    length = actual;
  }
}

function releaseTarball() {
  return tarGzip([{ name: 'package/package.json', content: '{"name":"mcp-release"}\n' }]);
}

function packReport(bytes, files = parseTarFiles(bytes)) {
  return [{
    name: '@aikdna/kdna-mcp-server',
    version: '1.2.3',
    filename: 'aikdna-kdna-mcp-server-1.2.3.tgz',
    integrity: `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`,
    shasum: crypto.createHash('sha1').update(bytes).digest('hex'),
    size: bytes.length,
    unpackedSize: files.reduce((total, file) => total + file.size, 0),
    entryCount: files.length,
    files,
  }];
}

function evidenceForBytes(bytes) {
  return evidence({
    artifact: {
      filename: 'aikdna-kdna-mcp-server-1.2.3.tgz',
      integrity: `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`,
      shasum: crypto.createHash('sha1').update(bytes).digest('hex'),
      packed_size: bytes.length,
      unpacked_size: 200,
      file_count: 1,
      files: [{ path: 'package.json', size: 200 }],
    },
  });
}

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

test('source Runtime pair resolves exactly one Core 0.20.0 candidate copy', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package-lock.json'), 'utf8'));
  const installed = JSON.parse(fs.readFileSync(path.join(packageRoot, 'node_modules/@aikdna/kdna-core/package.json'), 'utf8'));
  assert.equal(pkg.version, '0.4.2');
  assert.equal(pkg.dependencies['@aikdna/kdna-core'], '0.20.0');
  assert.equal(lock.packages[''].dependencies['@aikdna/kdna-core'], '0.20.0');
  assert.equal(lock.packages['node_modules/@aikdna/kdna-core'].version, '0.20.0');
  assert.equal(
    lock.packages['node_modules/@aikdna/kdna-core'].resolved,
    'file:test/fixtures/runtime-candidates/kdna-core-0.20.0.tgz',
  );
  assert.equal(installed.version, '0.20.0');
  const coreEntries = Object.keys(lock.packages).filter((entry) => entry.endsWith('node_modules/@aikdna/kdna-core'));
  assert.deepEqual(coreEntries, ['node_modules/@aikdna/kdna-core']);
});

test('publish workflow is stable release-only and publishes only the verified tarball', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/publish.yml'), 'utf8');
  assert.doesNotMatch(workflow, /workflow_dispatch/);
  assert.match(workflow, /release:\n\s+types: \[published\]/);
  assert.match(workflow, /release\.draft == false/);
  assert.match(workflow, /release\.prerelease == false/);
  assert.match(workflow, new RegExp(`actions/checkout@${CHECKOUT_ACTION_SHA}`));
  assert.match(workflow, new RegExp(`actions/setup-node@${SETUP_NODE_ACTION_SHA}`));
  assert.match(workflow, /npm@11\.17\.0/);
  assert.match(workflow, /release:dependency-guard/);
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
    env: {
      ...process.env,
      npm_config_dry_run: 'false',
      NPM_CONFIG_DRY_RUN: 'false',
    },
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

test('independent tar parser supports strict PAX paths and GNU long names', () => {
  const paxPath = `package/nested/${'p'.repeat(96)}.js`;
  const paxBytes = tarGzip([
    { name: 'PaxHeader', type: 'x', content: paxRecord('path', paxPath) },
    { name: 'package/placeholder', content: 'pax' },
  ]);
  assert.deepEqual(parseTarFiles(paxBytes), [{ path: paxPath.slice('package/'.length), size: 3 }]);

  const longPath = `package/nested/${'g'.repeat(96)}.js`;
  const longNameBytes = tarGzip([
    { name: '././@LongLink', type: 'L', content: `${longPath}\0` },
    { name: 'package/placeholder', content: 'gnu' },
  ]);
  assert.deepEqual(parseTarFiles(longNameBytes), [{ path: longPath.slice('package/'.length), size: 3 }]);
});

test('independent tar parser rejects hostile archive structure and paths', () => {
  const valid = releaseTarball();
  const tar = zlib.gunzipSync(valid);
  const checksumDamage = Buffer.from(tar);
  checksumDamage[0] ^= 1;
  const danglingPax = tarGzip([
    { name: 'PaxHeader', type: 'x', content: paxRecord('path', 'package/unbound.js') },
  ]);
  const danglingLongName = tarGzip([
    { name: '././@LongLink', type: 'L', content: 'package/unbound.js\0' },
  ]);
  const paxSizeMismatch = tarGzip([
    { name: 'PaxHeader', type: 'x', content: paxRecord('size', '99') },
    { name: 'package/package.json', content: '{}' },
  ]);
  const cases = [
    ['non-gzip', Buffer.from('ordinary bytes'), /gzip/],
    ['truncated gzip', valid.subarray(0, valid.length - 8), /gzip/],
    ['truncated tar entry', zlib.gzipSync(tar.subarray(0, 520)), /truncated tar entry/],
    ['header checksum', zlib.gzipSync(checksumDamage), /checksum/],
    [
      'single end block',
      tarGzip([{ name: 'package/package.json', content: '{}' }], { endBlocks: 1 }),
      /end marker/,
    ],
    [
      'trailing data',
      tarGzip([{ name: 'package/package.json', content: '{}' }], { trailing: Buffer.from('hidden') }),
      /data after/,
    ],
    [
      'duplicate path',
      tarGzip([
        { name: 'package/package.json', content: '{}' },
        { name: 'package/package.json', content: '[]' },
      ]),
      /duplicate/,
    ],
    ['parent traversal', tarGzip([{ name: 'package/../escape.js', content: 'x' }]), /unsafe/],
    ['dot segment', tarGzip([{ name: 'package/./escape.js', content: 'x' }]), /unsafe/],
    ['absolute-like path', tarGzip([{ name: 'package//escape.js', content: 'x' }]), /unsafe/],
    ['backslash path', tarGzip([{ name: 'package/..\\escape.js', content: 'x' }]), /unsafe/],
    ['symbolic link', tarGzip([{ name: 'package/link', type: '2' }]), /unsupported/],
    ['hard link', tarGzip([{ name: 'package/link', type: '1' }]), /unsupported/],
    ['PAX size mismatch', paxSizeMismatch, /PAX file size/],
    ['dangling PAX metadata', danglingPax, /metadata record/],
    ['dangling GNU long name', danglingLongName, /metadata record/],
  ];
  for (const [name, bytes, pattern] of cases) {
    assert.throws(() => parseTarFiles(bytes), pattern, name);
  }
});

test('npm report and retained evidence must exactly match the parsed tar manifest', () => {
  const bytes = releaseTarball();
  const report = packReport(bytes);
  report[0].files = [{ path: 'README.md', size: report[0].files[0].size }];
  assert.throws(
    () => validatePackReport({
      reportText: JSON.stringify(report),
      tarball: bytes,
      pkg: { name: '@aikdna/kdna-mcp-server', version: '1.2.3' },
      source: { ref: 'refs/tags/v1.2.3', commit: HASH },
    }),
    /file report/,
  );

  const candidate = validatePackReport({
    reportText: JSON.stringify(packReport(bytes)),
    tarball: bytes,
    pkg: { name: '@aikdna/kdna-mcp-server', version: '1.2.3' },
    source: { ref: 'refs/tags/v1.2.3', commit: HASH },
  });
  const drifted = {
    ...candidate,
    artifact: {
      ...candidate.artifact,
      files: [{ path: 'README.md', size: candidate.artifact.files[0].size }],
    },
  };
  assert.throws(() => validateEvidenceArtifact(drifted, bytes), /artifact files/);
});

test('non-tar bytes cannot reach registry lookup or npm publication with matching outer hashes', () => {
  const bytes = Buffer.from('ordinary strings are not npm tarballs');
  const candidate = evidenceForBytes(bytes);
  let lookupCalls = 0;
  let publishCalls = 0;
  assert.throws(
    () => guardCandidate({
      evidence: candidate,
      tarball: bytes,
      bindCurrent: () => candidate,
      lookup: () => {
        lookupCalls += 1;
      },
    }),
    /gzip/,
  );
  assert.throws(
    () => publishCandidate({
      evidence: candidate,
      tarball: bytes,
      artifactPath: '/tmp/not-reached.tgz',
      bindCurrent: () => candidate,
      publish: () => {
        publishCalls += 1;
      },
    }),
    /gzip/,
  );
  assert.equal(lookupCalls, 0);
  assert.equal(publishCalls, 0);
});

test(
  'npm publish --dry-run completes nested pack verification before the real release tag gate',
  { skip: process.env.KDNA_MCP_NESTED_PUBLISH_TEST === '1' },
  () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    const publishEnv = { ...process.env };
    delete publishEnv.NODE_TEST_CONTEXT;
    delete publishEnv.npm_lifecycle_event;
    delete publishEnv.npm_lifecycle_script;
    delete publishEnv.npm_command;
    const result = spawnSync(
      'npm',
      ['publish', '--dry-run', '--access', 'public', '--registry=https://registry.npmjs.org/'],
      {
        cwd: packageRoot,
        encoding: 'utf8',
        env: {
          ...publishEnv,
          KDNA_MCP_NESTED_PUBLISH_TEST: '1',
          GITHUB_EVENT_NAME: 'release',
          RELEASE_EVENT_ACTION: 'published',
          RELEASE_TAG_NAME: `v${pkg.version}.wrong`,
          RELEASE_IS_DRAFT: 'false',
          RELEASE_IS_PRERELEASE: 'false',
          GITHUB_REF: `refs/tags/v${pkg.version}.wrong`,
          GITHUB_SHA: HASH,
        },
        maxBuffer: 32 * 1024 * 1024,
        shell: false,
      },
    );
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    assert.notEqual(result.status, 0, output);
    assert.match(output, /pack evidence independently verifies identity/);
    assert.match(output, /Release context rejected:/);
    assert.match(output, new RegExp(`v${pkg.version.replaceAll('.', '\\.')}.*(?:tag|commit)|tag.*v${pkg.version.replaceAll('.', '\\.')}`, 'is'));
    assert.doesNotMatch(output, /ENOENT|no such file[^\n]*\.tgz/i);
  },
);

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
