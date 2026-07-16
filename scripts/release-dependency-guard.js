#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_ROOT = path.join(ROOT, 'mcp-server');
const CORE = '@aikdna/kdna-core';
const REGISTRY = 'https://registry.npmjs.org/';

function officialTarball(version) {
  return `https://registry.npmjs.org/@aikdna/kdna-core/-/kdna-core-${version}.tgz`;
}

function validateLocalReleaseDependency({ packageJson, lock }) {
  const version = packageJson.dependencies?.[CORE];
  assert.match(version || '', /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/, 'Core release dependency must be one exact SemVer');
  assert.equal(lock.packages?.['']?.dependencies?.[CORE], version);
  const locked = lock.packages?.[`node_modules/${CORE}`];
  assert.equal(locked?.version, version);
  assert.equal(
    locked?.resolved,
    officialTarball(version),
    'Core release dependency must resolve to the official registry, not a source candidate',
  );
  assert.match(locked?.integrity || '', /^sha512-[A-Za-z0-9+/]+={0,2}$/);
  const copies = Object.keys(lock.packages || {}).filter((entry) =>
    entry.toLowerCase().endsWith(`node_modules/${CORE}`),
  );
  assert.deepEqual(copies, [`node_modules/${CORE}`], 'release lock must contain exactly one Core copy');
  return { version, integrity: locked.integrity };
}

function validateRegistryDependency(metadata, local) {
  assert.equal(metadata?.name, CORE);
  assert.equal(metadata?.version, local.version);
  assert.equal(metadata?.['dist.integrity'], local.integrity);
  assert.match(metadata?.['dist.shasum'] || '', /^[a-f0-9]{40}$/);
  return {
    package: metadata.name,
    version: metadata.version,
    integrity: metadata['dist.integrity'],
    shasum: metadata['dist.shasum'],
  };
}

function registryLookup(version, spawn = spawnSync) {
  const result = spawn(
    'npm',
    [
      'view',
      `${CORE}@${version}`,
      'name',
      'version',
      'dist.integrity',
      'dist.shasum',
      '--json',
      '--ignore-scripts',
      `--registry=${REGISTRY}`,
    ],
    {
      cwd: PACKAGE_ROOT,
      encoding: 'utf8',
      shell: false,
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0) {
    throw new Error('Core release dependency is not available from the official registry');
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error('Core release dependency registry metadata is invalid');
  }
}

function guardReleaseDependency({ packageJson, lock, lookup = registryLookup }) {
  const local = validateLocalReleaseDependency({ packageJson, lock });
  return validateRegistryDependency(lookup(local.version), local);
}

function main() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package-lock.json'), 'utf8'));
  try {
    const result = guardReleaseDependency({ packageJson, lock });
    console.log(`Release dependency verified: ${result.package}@${result.version}`);
  } catch (error) {
    console.error(`Release dependency rejected: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  CORE,
  REGISTRY,
  guardReleaseDependency,
  officialTarball,
  registryLookup,
  validateLocalReleaseDependency,
  validateRegistryDependency,
};
