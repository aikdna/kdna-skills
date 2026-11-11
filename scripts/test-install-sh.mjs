import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const INSTALL_SH = path.join(REPO_ROOT, 'install.sh');

function runInstall(args, envOverrides = {}) {
  return spawnSync('bash', [INSTALL_SH, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...envOverrides },
  });
}

test('install.sh --dir installs both kdna-loader and full kdna-creator tree idempotently', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-install-sh-'));
  const targetDir = path.join(tmpRoot, 'skills');

  const first = runInstall(['--dir', targetDir]);
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.equal(fs.existsSync(path.join(targetDir, 'kdna-loader', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'references', 'co-creation-craft.md')), true);
  assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'references', 'native-asset-authoring.md')), true);
  assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'scripts', 'native-asset-review.mjs')), true);
  assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'agents', 'openai.yaml')), true);

  // Re-running with identical files exits 0 without error
  const second = runInstall(['--dir', targetDir]);
  assert.equal(second.status, 0, second.stdout + second.stderr);
  assert.match(second.stdout, /already has the exact selected KDNA Skill files/);
});

test('install.sh refuses modified destination files with exit 2 until --force is given', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-install-conflict-'));
  const targetDir = path.join(tmpRoot, 'skills');

  assert.equal(runInstall(['--dir', targetDir]).status, 0);
  const craftFile = path.join(targetDir, 'kdna-creator', 'references', 'co-creation-craft.md');
  const originalContent = fs.readFileSync(craftFile, 'utf8');
  fs.writeFileSync(craftFile, originalContent + '\n<!-- local edit -->\n', 'utf8');

  const refused = runInstall(['--dir', targetDir]);
  assert.equal(refused.status, 2, refused.stdout + refused.stderr);
  assert.match(refused.stderr, /diff -u/);
  assert.match(fs.readFileSync(craftFile, 'utf8'), /<!-- local edit -->/);

  const forced = runInstall(['--dir', targetDir, '--force']);
  assert.equal(forced.status, 0, forced.stdout + forced.stderr);
  assert.equal(fs.readFileSync(craftFile, 'utf8'), originalContent);
});

test('install.sh supports --antigravity under isolated HOME, --only filter, and rejects multiple Hosts', () => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-install-home-'));
  const agy = runInstall(['--antigravity', '--only', 'loader'], { HOME: fakeHome });
  assert.equal(agy.status, 0, agy.stdout + agy.stderr);
  assert.equal(fs.existsSync(path.join(fakeHome, '.gemini', 'antigravity', 'skills', 'kdna-loader', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(fakeHome, '.gemini', 'antigravity', 'skills', 'kdna-creator', 'SKILL.md')), false);

  const multi = runInstall(['--claude', '--codex'], { HOME: fakeHome });
  assert.equal(multi.status, 1);
});
