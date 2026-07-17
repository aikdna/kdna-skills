import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  CORE,
  guardReleaseDependency,
  officialTarball,
  registryLookup,
  validateRegistryDependency,
} = require('../../scripts/release-dependency-guard');
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INTEGRITY = `sha512-${Buffer.alloc(64, 7).toString('base64')}`;
const SHASUM = 'a'.repeat(40);

function formalFacts() {
  return {
    packageJson: { dependencies: { [CORE]: '0.20.0' } },
    lock: {
      packages: {
        '': { dependencies: { [CORE]: '0.20.0' } },
        [`node_modules/${CORE}`]: {
          version: '0.20.0',
          resolved: officialTarball('0.20.0'),
          integrity: INTEGRITY,
        },
      },
    },
  };
}

function metadata(overrides = {}) {
  return {
    name: CORE,
    version: '0.20.0',
    'dist.integrity': INTEGRITY,
    'dist.shasum': SHASUM,
    ...overrides,
  };
}

test('release dependency guard accepts only an exact official-registry Core artifact', () => {
  assert.deepEqual(
    guardReleaseDependency({ ...formalFacts(), lookup: () => metadata() }),
    { package: CORE, version: '0.20.0', integrity: INTEGRITY, shasum: SHASUM },
  );
});

test('release dependency guard accepts the real registry-bound lock', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package-lock.json'), 'utf8'));
  const localIntegrity = lock.packages[`node_modules/${CORE}`].integrity;
  assert.doesNotThrow(() =>
    guardReleaseDependency({
      packageJson,
      lock,
      lookup: () => metadata({ 'dist.integrity': localIntegrity, 'dist.shasum': SHASUM }),
    }),
  );
});

test('release dependency guard rejects local and registry ambiguity', async (t) => {
  const cases = [
    ['dependency range', (facts) => { facts.packageJson.dependencies[CORE] = '^0.20.0'; }],
    ['root lock drift', (facts) => { facts.lock.packages[''].dependencies[CORE] = '0.18.0'; }],
    ['file resolution', (facts) => { facts.lock.packages[`node_modules/${CORE}`].resolved = 'file:test/core.tgz'; }],
    ['shadow copy', (facts) => { facts.lock.packages[`node_modules/other/node_modules/${CORE}`] = { version: '0.20.0' }; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const facts = formalFacts();
      mutate(facts);
      assert.throws(() => guardReleaseDependency({ ...facts, lookup: () => metadata() }));
    });
  }

  for (const drift of [
    { name: '@other/core' },
    { version: '0.18.0' },
    { 'dist.integrity': `sha512-${Buffer.alloc(64, 8).toString('base64')}` },
    { 'dist.shasum': 'not-a-shasum' },
  ]) {
    await t.test(`registry drift ${Object.keys(drift)[0]}`, () => {
      assert.throws(() => validateRegistryDependency(metadata(drift), {
        version: '0.20.0',
        integrity: INTEGRITY,
      }));
    });
  }
});

test('release dependency registry lookup fails closed on timeout and malformed output', () => {
  assert.throws(
    () => registryLookup('0.20.0', () => ({ status: null, error: new Error('ETIMEDOUT') })),
    /not available from the official registry/,
  );
  assert.throws(
    () => registryLookup('0.20.0', () => ({ status: 0, stdout: 'not-json' })),
    /metadata is invalid/,
  );
});
