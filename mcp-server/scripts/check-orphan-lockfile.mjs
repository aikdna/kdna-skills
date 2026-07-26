import { ok } from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rootLockfile = join(repoRoot, 'package-lock.json');
const rootPkg = join(repoRoot, 'package.json');

ok(
  !existsSync(rootLockfile) || existsSync(rootPkg),
  'repo root package-lock.json must not exist without a corresponding package.json',
);

if (existsSync(rootLockfile) && !existsSync(rootPkg)) {
  throw new Error('Orphaned package-lock.json at repo root — delete it or add a package.json');
}
