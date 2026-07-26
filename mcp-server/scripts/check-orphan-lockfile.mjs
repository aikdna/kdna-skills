import { ok } from 'node:assert/strict';
import { existsSync, readdirSync, lstatSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXCLUDE = new Set(['node_modules', '.git', 'dist', 'out',
  '.vscode-test', 'coverage', '__pycache__', 'vendor', '.DS_Store']);

function checkRoot(root) {
  const lockfile = join(root, 'package-lock.json');
  const pkg = join(root, 'package.json');
  if (existsSync(lockfile)) {
    ok(existsSync(pkg),
      `${lockfile}: package-lock.json exists without package.json at ${root}`);
  }
}

function walkAndCheck(root) {
  checkRoot(root);
  if (!existsSync(root)) return;
  let entries;
  try { entries = readdirSync(root); } catch (e) {
    throw new Error(`cannot read directory ${root}: ${e.message}`);
  }
  for (const entry of entries) {
    if (EXCLUDE.has(entry)) continue;
    const full = join(root, entry);
    let st;
    try { st = lstatSync(full); } catch (e) {
      throw new Error(`cannot stat ${full}: ${e.message}`);
    }
    if (st.isSymbolicLink()) continue;
    if (!st.isDirectory()) continue;
    walkAndCheck(full);
  }
}

const repoRoot = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
walkAndCheck(repoRoot);
