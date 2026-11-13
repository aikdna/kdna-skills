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

const EXCLUDED_CREATOR_FILES = [
  ['references', 'current-studio-binding.json'],
  ['references', 'component-creation-draft.md'],
  ['references', 'studio-protected-host.md'],
  ['references', 'terminal-session.md'],
  ['scripts', 'check-studio-cli-binding.mjs'],
  ['scripts', 'studio-local-launcher.cjs'],
  ['scripts', 'studio-local-launcher.test.cjs'],
  ['scripts', 'studio-protected-host.cjs'],
  ['scripts', 'studio-protected-host.test.cjs'],
  ['scripts', 'native-asset-review.test.mjs'],
  ['scripts', 'fixtures', 'partial-write-preload.cjs'],
];

test('install.sh --dir installs kdna-loader and active kdna-creator files without dead Studio/test files', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-install-sh-'));
  const targetDir = path.join(tmpRoot, 'skills');

  try {
    const first = runInstall(['--dir', targetDir]);
    assert.equal(first.status, 0, first.stdout + first.stderr);
    assert.equal(fs.existsSync(path.join(targetDir, 'kdna-loader', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'references', 'authoring-and-protection.md')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'references', 'co-creation-craft.md')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'references', 'native-asset-authoring.md')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'scripts', 'native-asset-review.mjs')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'kdna-creator', 'agents', 'openai.yaml')), true);

    for (const segments of EXCLUDED_CREATOR_FILES) {
      assert.equal(
        fs.existsSync(path.join(targetDir, 'kdna-creator', ...segments)),
        false,
        `expected excluded file not to be installed: ${segments.join('/')}`
      );
    }

    // Re-running with identical files exits 0 without error
    const second = runInstall(['--dir', targetDir]);
    assert.equal(second.status, 0, second.stdout + second.stderr);
    assert.match(second.stdout, /already has the exact selected KDNA Skill files/);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('install.sh refuses modified destination files with exit 2 until --force is given', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-install-conflict-'));
  const targetDir = path.join(tmpRoot, 'skills');

  try {
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
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('install.sh supports all 6 Host flags under isolated HOME, --only filter, and rejects multiple Hosts', () => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-install-home-'));
  try {
    const hostTargets = [
      ['--claude', ['.claude', 'skills']],
      ['--codex', ['.codex', 'skills']],
      ['--cursor', ['.cursor', 'skills']],
      ['--opencode', ['.agents', 'skills']],
      ['--copilot', ['.agents', 'skills']],
      ['--antigravity', ['.gemini', 'antigravity', 'skills']],
    ];
    for (const [flag, relSegments] of hostTargets) {
      const res = runInstall([flag], { HOME: fakeHome });
      assert.equal(res.status, 0, `${flag}: ${res.stdout}${res.stderr}`);
      const base = path.join(fakeHome, ...relSegments);
      assert.equal(fs.existsSync(path.join(base, 'kdna-loader', 'SKILL.md')), true, `${flag} loader`);
      assert.equal(fs.existsSync(path.join(base, 'kdna-creator', 'SKILL.md')), true, `${flag} creator`);
      assert.equal(fs.existsSync(path.join(base, 'kdna-creator', 'references', 'authoring-and-protection.md')), true, `${flag} protection ref`);
    }

    const onlyHome = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-install-only-'));
    try {
      const agy = runInstall(['--antigravity', '--only', 'loader'], { HOME: onlyHome });
      assert.equal(agy.status, 0, agy.stdout + agy.stderr);
      assert.equal(fs.existsSync(path.join(onlyHome, '.gemini', 'antigravity', 'skills', 'kdna-loader', 'SKILL.md')), true);
      assert.equal(fs.existsSync(path.join(onlyHome, '.gemini', 'antigravity', 'skills', 'kdna-creator', 'SKILL.md')), false);
    } finally {
      fs.rmSync(onlyHome, { recursive: true, force: true });
    }

    const multi = runInstall(['--claude', '--codex'], { HOME: fakeHome });
    assert.equal(multi.status, 1);
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});
