import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, symlinkSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const script = join(fileURLToPath(import.meta.url), '..', '..', 'scripts', 'check-orphan-lockfile.mjs');

function runScript(rootDir) {
  try { execFileSync(process.execPath, [script, rootDir], { stdio: 'pipe', timeout: 10000 }); return { pass: true }; }
  catch (e) { return { pass: false, stderr: e.stderr?.toString() || '' }; }
}
function makeTmp() {
  const dir = join(tmpdir(), 'kdna-test-' + process.pid + '-' + Math.random().toString(36).slice(2, 8));
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); return dir;
}

test('passes without lockfile', () => { const d = makeTmp(); writeFileSync(join(d,'package.json'),'{}'); assert.ok(runScript(d).pass); rmSync(d,{recursive:true,force:true}); });
test('passes with lockfile+pkg', () => { const d = makeTmp(); writeFileSync(join(d,'package.json'),'{}'); writeFileSync(join(d,'package-lock.json'),'{}'); assert.ok(runScript(d).pass); rmSync(d,{recursive:true,force:true}); });
test('fails orphan root', () => { const d = makeTmp(); writeFileSync(join(d,'package-lock.json'),'{}'); assert.ok(!runScript(d).pass); rmSync(d,{recursive:true,force:true}); });
test('fails orphan below legal root', () => { const d = makeTmp(); writeFileSync(join(d,'package.json'),'{}'); writeFileSync(join(d,'package-lock.json'),'{}'); mkdirSync(join(d,'pkgs','orphan'),{recursive:true}); writeFileSync(join(d,'pkgs','orphan','package-lock.json'),'{}'); assert.ok(!runScript(d).pass); rmSync(d,{recursive:true,force:true}); });
test('fails orphan in dotted dir', () => { const d = makeTmp(); writeFileSync(join(d,'package.json'),'{}'); mkdirSync(join(d,'.cfg','orph'),{recursive:true}); writeFileSync(join(d,'.cfg','orph','package-lock.json'),'{}'); assert.ok(!runScript(d).pass); rmSync(d,{recursive:true,force:true}); });
test('passes nested legal roots', () => { const d = makeTmp(); writeFileSync(join(d,'package.json'),'{}'); mkdirSync(join(d,'legal'),{recursive:true}); writeFileSync(join(d,'legal','package.json'),'{}'); writeFileSync(join(d,'legal','package-lock.json'),'{}'); assert.ok(runScript(d).pass); rmSync(d,{recursive:true,force:true}); });
test('skips symlinks', () => { const d = makeTmp(); writeFileSync(join(d,'package.json'),'{}'); const e = makeTmp(); writeFileSync(join(e,'package-lock.json'),'{}'); symlinkSync(e, join(d,'link')); assert.ok(runScript(d).pass); rmSync(d,{recursive:true,force:true}); rmSync(e,{recursive:true,force:true}); });
test('skips node_modules', () => { const d = makeTmp(); writeFileSync(join(d,'package.json'),'{}'); mkdirSync(join(d,'node_modules','pkg'),{recursive:true}); writeFileSync(join(d,'node_modules','pkg','package-lock.json'),'{}'); assert.ok(runScript(d).pass); rmSync(d,{recursive:true,force:true}); });
test('fails unreadable dir', () => { const d = makeTmp(); writeFileSync(join(d,'package.json'),'{}'); mkdirSync(join(d,'ur'),{recursive:true}); writeFileSync(join(d,'ur','package-lock.json'),'{}'); chmodSync(join(d,'ur'),0); const r = runScript(d); chmodSync(join(d,'ur'),0o755); rmSync(d,{recursive:true,force:true}); assert.ok(!r.pass); });
