import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const script = join(fileURLToPath(import.meta.url), '..', '..', 'scripts', 'check-orphan-lockfile.mjs');

function runScript(rootDir) {
  try {
    execFileSync(process.execPath, [script, rootDir], { stdio: 'pipe', timeout: 10000 });
    return { pass: true };
  } catch (e) {
    return { pass: false, stderr: e.stderr?.toString() || '' };
  }
}

test('passes when repo root has no package-lock.json', () => {
  const dir = join(tmpdir(), 'kdna-test-no-lock-' + process.pid);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(result.pass, 'should pass with no lockfile');
});

test('passes when lockfile has matching package.json', () => {
  const dir = join(tmpdir(), 'kdna-test-with-both-' + process.pid);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(result.pass, 'should pass when both exist');
});

test('fails when lockfile has no matching package.json', () => {
  const dir = join(tmpdir(), 'kdna-test-orphan-' + process.pid);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(!result.pass, 'should fail with orphan lockfile');
});

test('detects orphan lockfile in nested package', () => {
  const dir = join(tmpdir(), 'kdna-test-nested-' + process.pid);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'packages', 'orphan'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  writeFileSync(join(dir, 'packages', 'orphan', 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(!result.pass, 'should detect orphan in nested dir');
});
