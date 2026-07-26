import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, symlinkSync, chmodSync } from 'node:fs';
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

function makeTmp() {
  const dir = join(tmpdir(), 'kdna-test-' + process.pid + '-' + Math.random().toString(36).slice(2, 8));
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  return dir;
}

test('passes when repo root has no package-lock.json', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(result.pass);
});

test('passes when lockfile has matching package.json', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(result.pass);
});

test('fails when lockfile has no matching package.json', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(!result.pass);
});

test('detects orphan lockfile in nested directory below legal package root', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  mkdirSync(join(dir, 'packages', 'orphan'), { recursive: true });
  writeFileSync(join(dir, 'packages', 'orphan', 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(!result.pass);
});

test('detects orphan in dotted directory', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package.json'), '{}');
  mkdirSync(join(dir, '.config', 'orphan-pkg'), { recursive: true });
  writeFileSync(join(dir, '.config', 'orphan-pkg', 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(!result.pass, 'should detect orphan inside dotted source dir');
});

test('passes with multiple nested legal package roots', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package.json'), '{}');
  mkdirSync(join(dir, 'packages', 'legal'), { recursive: true });
  writeFileSync(join(dir, 'packages', 'legal', 'package.json'), '{}');
  writeFileSync(join(dir, 'packages', 'legal', 'package-lock.json'), '{}');
  mkdirSync(join(dir, 'packages', 'legal', 'sub'), { recursive: true });
  writeFileSync(join(dir, 'packages', 'legal', 'sub', 'package.json'), '{}');
  writeFileSync(join(dir, 'packages', 'legal', 'sub', 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(result.pass);
});

test('does not follow symlinks into external paths', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package.json'), '{}');
  const external = makeTmp();
  writeFileSync(join(external, 'package-lock.json'), '{}');
  symlinkSync(external, join(dir, 'link-ext'));
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  rmSync(external, { recursive: true, force: true });
  assert.ok(result.pass);
});

test('excludes node_modules directory from checks', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package.json'), '{}');
  mkdirSync(join(dir, 'node_modules', 'some-pkg'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', 'some-pkg', 'package-lock.json'), '{}');
  const result = runScript(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(result.pass);
});

test('fails closed on unreadable directory', () => {
  const dir = makeTmp();
  writeFileSync(join(dir, 'package.json'), '{}');
  mkdirSync(join(dir, 'unreadable'), { recursive: true });
  writeFileSync(join(dir, 'unreadable', 'package-lock.json'), '{}');
  chmodSync(join(dir, 'unreadable'), 0);
  const result = runScript(dir);
  chmodSync(join(dir, 'unreadable'), 0o755);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(!result.pass, 'should fail on unreadable directory');
});
