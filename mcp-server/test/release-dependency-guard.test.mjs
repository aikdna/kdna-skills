import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const {
  CBOR,
  CLI,
  CORE,
  READ,
  REQUIRED,
  guardReleaseDependency,
  officialTarball,
  registryLookup,
  validateRegistryDependency,
} = require("../../scripts/release-dependency-guard");
const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const INTEGRITIES = Object.freeze({
  [CLI]: "sha512-yAnAS1ch" + "1sRj+OwlTiw1I8AbzU0N+qLOv26klM/9SSPlHWxwHexCz3X/jP6DidHix4gz7o1I0zBX7W2guAvPFA==",
  [CORE]: "sha512-HVXILcxX" + "W2qaSUm6MatgrFMjUhUynqlmHHdsPo8yBbHT3kuvucdp4te06Spawa4oOpWsN+059jw07IGsbfIq8A==",
  [READ]: "sha512-HQXjkjYL" + "l20LnBn8ykjTgyAtZRZffrzuQEtruyKwG7iGKtgpIFexiFevp3yLM2vHpUEfUBoo5DupDpQgPfPa1g==",
  [CBOR]: "sha512-TCT9XHLb" + "4iPGQ99fpQjcTRncbus6cXHvSD/RY+bPrDACBCJKiQLmAM6r7/BgQcI5i+8h4gwp4vjfb6S6T8bPGw==",
});
const SHASUM = "a".repeat(40);

function formalFacts() {
  return {
    packageJson: { dependencies: { ...REQUIRED } },
    lock: {
      packages: {
        "": { dependencies: { ...REQUIRED } },
        [`node_modules/${CLI}`]: {
          version: REQUIRED[CLI],
          resolved: officialTarball(CLI, REQUIRED[CLI]),
          integrity: INTEGRITIES[CLI],
          dependencies: { [CORE]: REQUIRED[CORE], [READ]: REQUIRED[READ] },
        },
        [`node_modules/${CORE}`]: {
          version: REQUIRED[CORE],
          resolved: officialTarball(CORE, REQUIRED[CORE]),
          integrity: INTEGRITIES[CORE],
        },
        [`node_modules/${READ}`]: {
          version: REQUIRED[READ],
          resolved: officialTarball(READ, REQUIRED[READ]),
          integrity: INTEGRITIES[READ],
        },
        [`node_modules/${CBOR}`]: {
          version: REQUIRED[CBOR],
          resolved: officialTarball(CBOR, REQUIRED[CBOR]),
          integrity: INTEGRITIES[CBOR],
        },
      },
    },
  };
}

function metadata(packageName, overrides = {}) {
  return {
    name: packageName,
    version: REQUIRED[packageName],
    "dist.integrity": INTEGRITIES[packageName],
    "dist.shasum": SHASUM,
    ...overrides,
  };
}

test("release dependency guard accepts the exact official-registry or packed-vendor 0.8.2 CLI/Core/Read graph when registry metadata matches", () => {
  assert.deepEqual(
    guardReleaseDependency({
      ...formalFacts(),
      lookup: (name) => metadata(name),
    }),
    [CLI, CORE, READ, CBOR].map((name) => ({
      package: name,
      version: REQUIRED[name],
      integrity: INTEGRITIES[name],
      shasum: SHASUM,
    })),
  );
  const packageJson = require(path.join(packageRoot, "package.json"));
  const lock = require(path.join(packageRoot, "package-lock.json"));
  assert.equal(
    guardReleaseDependency({ packageJson, lock, lookup: (name) => metadata(name) }).length,
    4,
  );
});

test("committed manifest is rejected when companion packages are not yet published on registry", () => {
  const packageJson = require(path.join(packageRoot, "package.json"));
  const lock = require(path.join(packageRoot, "package-lock.json"));
  assert.throws(
    () =>
      guardReleaseDependency({
        packageJson,
        lock,
        lookup: (name, ver) => {
          throw new Error(`${name}@${ver} is not available from the official registry`);
        },
      }),
    /not available from the official registry/u,
  );
});

test("release dependency guard rejects unbundled file candidates, ranges, shadows, and edge drift", async (t) => {
  const cases = [
    ["dependency range", (facts) => { facts.packageJson.dependencies[CLI] = "^0.45.1"; }],
    ["root lock drift", (facts) => { facts.lock.packages[""].dependencies[CLI] = "0.43.5"; }],
    ["CLI unbundled file resolution", (facts) => { facts.lock.packages[`node_modules/${CLI}`].resolved = "file:test/cli.tgz"; }],
    ["Core unbundled file resolution", (facts) => { facts.lock.packages[`node_modules/${CORE}`].resolved = "file:test/core.tgz"; }],
    ["CLI to Core edge drift", (facts) => { facts.lock.packages[`node_modules/${CLI}`].dependencies[CORE] = "0.37.9"; }],
    ["CLI Eval dependency reintroduced", (facts) => { facts.lock.packages[`node_modules/${CLI}`].dependencies["@aikdna/kdna-eval"] = "0.3.2"; }],
    ["shadow copy", (facts) => { facts.lock.packages[`node_modules/other/node_modules/${CLI}`] = { version: REQUIRED[CLI] }; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const facts = formalFacts();
      mutate(facts);
      assert.throws(() =>
        guardReleaseDependency({
          ...facts,
          lookup: (packageName) => metadata(packageName),
        }),
      );
    });
  }

  for (const drift of [
    { name: "@other/cli" },
    { version: "0.43.5" },
    { "dist.integrity": `sha512-${Buffer.alloc(64, 1).toString("base64")}` },
    { "dist.shasum": "not-a-shasum" },
  ]) {
    await t.test(`registry drift ${Object.keys(drift)[0]}`, () => {
      assert.throws(() =>
        validateRegistryDependency(metadata(CLI, drift), {
          package: CLI,
          version: REQUIRED[CLI],
          integrity: INTEGRITIES[CLI],
        }),
      );
    });
  }
});

test("release dependency registry lookup fails closed on timeout and malformed output", () => {
  assert.throws(
    () =>
      registryLookup(CLI, REQUIRED[CLI], () => ({
        status: null,
        error: new Error("ETIMEDOUT"),
      })),
    /not available from the official registry/u,
  );
  assert.throws(
    () =>
      registryLookup(CLI, REQUIRED[CLI], () => ({
        status: 0,
        stdout: "not-json",
      })),
    /metadata is invalid/u,
  );
});
