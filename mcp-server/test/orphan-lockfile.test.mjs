import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, symlinkSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const script = join(fileURLToPath(import.meta.url), '..', '..', 'scripts', 'check-orphan-lockfile.mjs');

function runCheck(rootDir) {
  try {
    execFileSync(process.execPath, [script, rootDir], { stdio: 'pipe', timeout: 10000 });
    return { pass: true, message: '' };
  } catch (e) {
    return { pass: false, message: (e.stderr || e.stdout || '').toString() };
  }
}

function setup() {
  const dir = join(tmpdir(), `kdna-orphan-${process.pid}-${Date.now()}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  return dir;
}

function teardown(dir) {
  rmSync(dir, { recursive: true, force: true });
}

test('passes: no package-lock.json at root', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package.json'), '{}');
  const r = runCheck(dir);
  teardown(dir);
  assert.ok(r.pass, 'should pass without any lockfile');
});

test('passes: package-lock.json has matching package.json', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  const r = runCheck(dir);
  teardown(dir);
  assert.ok(r.pass, 'should pass when both files exist');
});

test('fails: package-lock.json without package.json (orphan root)', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  const r = runCheck(dir);
  teardown(dir);
  assert.ok(!r.pass, 'should fail on orphan lockfile');
  assert.ok(r.message.includes('without package.json'), `message should mention missing package.json: ${r.message}`);
});

test('fails: orphan lockfile nested below a legal package root', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  mkdirSync(join(dir, 'packages', 'orphan'), { recursive: true });
  writeFileSync(join(dir, 'packages', 'orphan', 'package-lock.json'), '{}');
  const r = runCheck(dir);
  teardown(dir);
  assert.ok(!r.pass, 'should detect orphan inside nested directory');
});

test('fails: orphan lockfile inside dotted source directory', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package.json'), '{}');
  mkdirSync(join(dir, '.config', 'orphan-pkg'), { recursive: true });
  writeFileSync(join(dir, '.config', 'orphan-pkg', 'package-lock.json'), '{}');
  const r = runCheck(dir);
  teardown(dir);
  assert.ok(!r.pass, 'should detect orphan inside dotted directory');
});

test('passes: multiple nested legal package roots', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'package-lock.json'), '{}');
  mkdirSync(join(dir, 'packages', 'a'), { recursive: true });
  writeFileSync(join(dir, 'packages', 'a', 'package.json'), '{}');
  writeFileSync(join(dir, 'packages', 'a', 'package-lock.json'), '{}');
  mkdirSync(join(dir, 'packages', 'b'), { recursive: true });
  writeFileSync(join(dir, 'packages', 'b', 'package.json'), '{}');
  writeFileSync(join(dir, 'packages', 'b', 'package-lock.json'), '{}');
  const r = runCheck(dir);
  teardown(dir);
  assert.ok(r.pass, 'should pass with multiple legal nested roots');
});


test('passes: node_modules directory is excluded', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package.json'), '{}');
  mkdirSync(join(dir, 'node_modules', 'some-pkg'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', 'some-pkg', 'package-lock.json'), '{}');
  const r = runCheck(dir);
  teardown(dir);
  assert.ok(r.pass, 'should exclude node_modules from checks');
});

test('fails: unreadable directory fails closed', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package.json'), '{}');
  mkdirSync(join(dir, 'unreadable'), { recursive: true });
  writeFileSync(join(dir, 'unreadable', 'package-lock.json'), '{}');
  chmodSync(join(dir, 'unreadable'), 0o000);
  const r = runCheck(dir);
  chmodSync(join(dir, 'unreadable'), 0o755);
  teardown(dir);
  assert.ok(!r.pass, 'should fail on unreadable directory');
  assert.ok(r.message.toLowerCase().includes('cannot read'), `should mention cannot read: ${r.message}`);
});

test('fails: symlink cycle is not traversed', () => {
  const dir = setup();
  writeFileSync(join(dir, 'package.json'), '{}');
  mkdirSync(join(dir, 'loop'), { recursive: true });
  symlinkSync(join(dir, 'loop'), join(dir, 'loop', 'self'));
  const r = runCheck(dir);
  teardown(dir);
  assert.ok(r.pass, 'should not traverse symlink cycles');
});
