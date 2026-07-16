#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_ROOT = path.join(ROOT, 'mcp-server');
const ALLOWLIST = 'scripts/naming-integrity-allowlist.json';
const CANDIDATE = 'mcp-server/test/fixtures/runtime-candidates/kdna-core-0.19.0.tgz';
const CANDIDATE_SHA256 = '8b3938405b60cf611623dd5496e5e7334b2b5545fb6b8c84f56c48dae8cfbf62';
const EXACT_OLD_NAMES = Object.freeze([
  ['judgment-profile', '-v1'].join(''),
  ['/v1', '/project'].join(''),
  ['mcp-', 'v1.test.mjs'].join(''),
  ['kdna.context', '.capsule'].join(''),
  ['"kdna_', 'version"'].join(''),
]);
const GENERATION_NAMES = Object.freeze([
  /\b(V[0-9]+)\b/gu,
  /\b([a-z][a-z0-9]*V[0-9]+)\b/gu,
  /\b([A-Za-z][A-Za-z0-9_.-]*(?:[-_][vV])[0-9]+)(?![0-9.])/gu,
]);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

function candidateFiles() {
  const output = run('git', [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '-z',
  ]);
  return [...new Set(output.split('\0').filter(Boolean))].sort();
}

export function findCurrentNameResiduals(entries) {
  const residuals = [];
  for (const { path: entryPath, text } of entries) {
    for (const token of EXACT_OLD_NAMES) {
      if (text.includes(token)) residuals.push({ path: entryPath, token });
    }
    for (const pattern of GENERATION_NAMES) {
      for (const match of text.matchAll(pattern)) {
        residuals.push({ path: entryPath, token: match[1] });
      }
    }
  }
  return [...new Map(residuals.map((item) => [`${item.path}\0${item.token}`, item])).values()];
}

function trackedTextEntries() {
  const entries = [];
  for (const relative of candidateFiles()) {
    const absolute = path.join(ROOT, relative);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    if (relative === CANDIDATE) {
      const bytes = fs.readFileSync(absolute);
      assert.equal(
        crypto.createHash('sha256').update(bytes).digest('hex'),
        CANDIDATE_SHA256,
        'the only binary naming-gate exception must retain its exact candidate hash',
      );
      continue;
    }
    const bytes = fs.readFileSync(absolute);
    assert.equal(bytes.includes(0), false, `unexpected binary tracked file: ${relative}`);
    entries.push({ path: relative, text: bytes.toString('utf8') });
  }
  return entries;
}

function validateAllowlist() {
  const value = JSON.parse(fs.readFileSync(path.join(ROOT, ALLOWLIST), 'utf8'));
  assert.deepEqual(Object.keys(value).sort(), ['exceptions', 'schema', 'schema_version']);
  assert.equal(value.schema, 'kdna.naming-integrity-third-party-allowlist');
  assert.equal(value.schema_version, '0.1.0');
  assert.deepEqual(value.exceptions, []);
  return value;
}

function packedTextEntries() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-current-names-'));
  try {
    const report = JSON.parse(
      run(
        'npm',
        ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
        {
          cwd: PACKAGE_ROOT,
          env: {
            ...process.env,
            npm_config_dry_run: 'false',
            NPM_CONFIG_DRY_RUN: 'false',
          },
        },
      ),
    );
    assert.equal(report.length, 1);
    const files = report[0].files.map(({ path: packedPath }) => packedPath).sort();
    assert.deepEqual(files, ['LICENSE', 'NOTICE', 'README.md', 'bin/kdna-mcp.mjs', 'package.json']);
    const artifact = path.join(temporary, report[0].filename);
    return files.map((packedPath) => ({
      path: `package/${packedPath}`,
      text: run('tar', ['-xOzf', artifact, `package/${packedPath}`]),
    }));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

export function checkCurrentNames() {
  const allowlist = validateAllowlist();
  const tracked = trackedTextEntries();
  const packed = packedTextEntries();
  const residuals = findCurrentNameResiduals([...tracked, ...packed]);
  assert.deepEqual(residuals, [], `current-name residuals: ${JSON.stringify(residuals)}`);
  return {
    tracked_file_count: tracked.length + 1,
    package_tar_file_count: packed.length,
    exact_third_party_exception_count: allowlist.exceptions.length,
    exact_binary_authority_count: 1,
    residual_count: 0,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(JSON.stringify(checkCurrentNames()));
}
