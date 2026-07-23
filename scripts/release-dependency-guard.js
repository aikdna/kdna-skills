#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PACKAGE_ROOT = path.join(ROOT, "mcp-server");
const CLI = "@aikdna/kdna-cli";
const CORE = "@aikdna/kdna-core";
const CBOR = "cbor-x";
const REGISTRY = "https://registry.npmjs.org/";
const REQUIRED = Object.freeze({
  [CLI]: "0.36.0",
  [CORE]: "0.21.0",
  [CBOR]: "1.6.4",
});

function officialTarball(packageName, version) {
  const leaf = packageName.slice(packageName.lastIndexOf("/") + 1);
  return `${REGISTRY}${packageName}/-/${leaf}-${version}.tgz`;
}

function validateLocalReleaseDependencies({ packageJson, lock }) {
  assert.deepEqual(packageJson.dependencies, { [CLI]: REQUIRED[CLI] });
  assert.deepEqual(lock.packages?.[""]?.dependencies, { [CLI]: REQUIRED[CLI] });

  const cli = lock.packages?.[`node_modules/${CLI}`];
  assert.equal(cli?.version, REQUIRED[CLI]);
  assert.deepEqual(cli?.dependencies, {
    [CORE]: REQUIRED[CORE],
    [CBOR]: REQUIRED[CBOR],
  });

  const packages = [CLI, CORE, CBOR].map((packageName) => {
    const locked = lock.packages?.[`node_modules/${packageName}`];
    const version = REQUIRED[packageName];
    assert.equal(locked?.version, version);
    assert.equal(
      locked?.resolved,
      officialTarball(packageName, version),
      `${packageName} must resolve to the official registry`,
    );
    assert.match(locked?.integrity || "", /^sha512-[A-Za-z0-9+/]+={0,2}$/u);
    const copies = Object.keys(lock.packages || {}).filter((entry) =>
      entry.toLowerCase().endsWith(`node_modules/${packageName}`),
    );
    assert.deepEqual(
      copies,
      [`node_modules/${packageName}`],
      `release lock must contain one ${packageName} copy`,
    );
    return { package: packageName, version, integrity: locked.integrity };
  });

  for (const [entry, locked] of Object.entries(lock.packages || {})) {
    if (entry === "" || !locked?.resolved) continue;
    assert.ok(
      locked.resolved.startsWith(REGISTRY),
      `release lock contains a non-registry resolution: ${entry}`,
    );
  }
  return packages;
}

function validateRegistryDependency(metadata, local) {
  assert.equal(metadata?.name, local.package);
  assert.equal(metadata?.version, local.version);
  assert.equal(metadata?.["dist.integrity"], local.integrity);
  assert.match(metadata?.["dist.shasum"] || "", /^[a-f0-9]{40}$/u);
  return {
    package: metadata.name,
    version: metadata.version,
    integrity: metadata["dist.integrity"],
    shasum: metadata["dist.shasum"],
  };
}

function registryLookup(packageName, version, spawn = spawnSync) {
  const result = spawn(
    "npm",
    [
      "view",
      `${packageName}@${version}`,
      "name",
      "version",
      "dist.integrity",
      "dist.shasum",
      "--json",
      "--ignore-scripts",
      `--registry=${REGISTRY}`,
    ],
    {
      cwd: PACKAGE_ROOT,
      encoding: "utf8",
      shell: false,
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0) {
    throw new Error(
      `${packageName}@${version} is not available from the official registry`,
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`${packageName}@${version} registry metadata is invalid`);
  }
}

function guardReleaseDependency({
  packageJson,
  lock,
  lookup = registryLookup,
}) {
  const local = validateLocalReleaseDependencies({ packageJson, lock });
  return local.map((candidate) =>
    validateRegistryDependency(
      lookup(candidate.package, candidate.version),
      candidate,
    ),
  );
}

function main() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
  );
  const lock = JSON.parse(
    fs.readFileSync(path.join(PACKAGE_ROOT, "package-lock.json"), "utf8"),
  );
  try {
    const result = guardReleaseDependency({ packageJson, lock });
    console.log(
      `Release dependencies verified: ${result.map(({ package: name, version }) => `${name}@${version}`).join(", ")}`,
    );
  } catch (error) {
    console.error(`Release dependency rejected: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  CBOR,
  CLI,
  CORE,
  REGISTRY,
  REQUIRED,
  guardReleaseDependency,
  officialTarball,
  registryLookup,
  validateLocalReleaseDependencies,
  validateRegistryDependency,
};
