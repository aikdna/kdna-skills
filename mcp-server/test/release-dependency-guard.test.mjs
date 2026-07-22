import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const {
  CLI,
  CORE,
  EVAL,
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
  [CLI]: `sha512-${Buffer.alloc(64, 7).toString("base64")}`,
  [CORE]: `sha512-${Buffer.alloc(64, 8).toString("base64")}`,
  [EVAL]: `sha512-${Buffer.alloc(64, 9).toString("base64")}`,
});
const SHASUM = "a".repeat(40);

function formalFacts() {
  return {
    packageJson: { dependencies: { [CLI]: REQUIRED[CLI] } },
    lock: {
      packages: {
        "": { dependencies: { [CLI]: REQUIRED[CLI] } },
        [`node_modules/${CLI}`]: {
          version: REQUIRED[CLI],
          resolved: officialTarball(CLI, REQUIRED[CLI]),
          integrity: INTEGRITIES[CLI],
          dependencies: { [CORE]: REQUIRED[CORE], [EVAL]: REQUIRED[EVAL] },
        },
        [`node_modules/${CORE}`]: {
          version: REQUIRED[CORE],
          resolved: officialTarball(CORE, REQUIRED[CORE]),
          integrity: INTEGRITIES[CORE],
        },
        [`node_modules/${EVAL}`]: {
          version: REQUIRED[EVAL],
          resolved: officialTarball(EVAL, REQUIRED[EVAL]),
          integrity: INTEGRITIES[EVAL],
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

test("release dependency guard accepts only the exact official-registry CLI graph", () => {
  assert.deepEqual(
    guardReleaseDependency({
      ...formalFacts(),
      lookup: (name) => metadata(name),
    }),
    [CLI, CORE, EVAL].map((name) => ({
      package: name,
      version: REQUIRED[name],
      integrity: INTEGRITIES[name],
      shasum: SHASUM,
    })),
  );
});

test("candidate lock is intentionally rejected until upstream registry releases exist", () => {
  const packageJson = require(path.join(packageRoot, "package.json"));
  const lock = require(path.join(packageRoot, "package-lock.json"));
  assert.throws(
    () =>
      guardReleaseDependency({
        packageJson,
        lock,
        lookup: (name) => metadata(name),
      }),
    /official registry|non-registry resolution/u,
  );
});

test("release dependency guard rejects source candidates, ranges, shadows, and edge drift", async (t) => {
  const cases = [
    [
      "dependency range",
      (facts) => {
        facts.packageJson.dependencies[CLI] = "^0.36.0";
      },
    ],
    [
      "root lock drift",
      (facts) => {
        facts.lock.packages[""].dependencies[CLI] = "0.35.0";
      },
    ],
    [
      "CLI file resolution",
      (facts) => {
        facts.lock.packages[`node_modules/${CLI}`].resolved =
          "file:test/cli.tgz";
      },
    ],
    [
      "Core file resolution",
      (facts) => {
        facts.lock.packages[`node_modules/${CORE}`].resolved =
          "file:test/core.tgz";
      },
    ],
    [
      "CLI to Core edge drift",
      (facts) => {
        facts.lock.packages[`node_modules/${CLI}`].dependencies[CORE] =
          "0.20.0";
      },
    ],
    [
      "shadow copy",
      (facts) => {
        facts.lock.packages[`node_modules/other/node_modules/${CLI}`] = {
          version: REQUIRED[CLI],
        };
      },
    ],
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
    { version: "0.35.0" },
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
