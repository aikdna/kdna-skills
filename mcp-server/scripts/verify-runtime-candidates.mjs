#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import zlib from "node:zlib";

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const CLI = "@aikdna/kdna-cli";
const CORE = "@aikdna/kdna-core";

const EXPECTED = Object.freeze({
  [CLI]: Object.freeze({
    version: "0.36.0",
    source: Object.freeze({
      repository: "aikdna/kdna-cli",
      commit: "f7b9cd0bcc6ac4ff4c09879a96d844f95729fad1",
      tree: "605cd4cfec00f9e57a79d26164ef13f473037de7",
      package_root: ".",
      package_subtree: "605cd4cfec00f9e57a79d26164ef13f473037de7",
    }),
    artifact: Object.freeze({
      path: "test/fixtures/runtime-candidates/aikdna-kdna-cli-0.36.0.tgz",
      size: 70711,
      unpacked_size: 278946,
      sha1: "166c96f2933c139c4f6d61e78c13dc6bd182a0dc",
      sha256:
        "df8eeee0e905ca2713d8a8e450471ccacab2a1eb8e2c2e928b4d53fb58290cfb",
      integrity:
        "sha512-Uz7tIpGpNE5O3X2oFQTHKHKSI23TlquBcr0O9ybwfoaAcCmdtrPCQMbDj6fOdC7VMNWNx8Fty9LugvaIZKd4rQ==",
      entry_count: 33,
      source_pack_equivalence: "strict_install_equivalent",
    }),
  }),
  [CORE]: Object.freeze({
    version: "0.21.0",
    source: Object.freeze({
      repository: "aikdna/kdna",
      commit: "32aa3ff8e633291d4bb9e01de5a70181c8415d93",
      tree: "b36460ec0545c44036fd122e3e9b090abfde98d7",
      package_root: "packages/kdna-core",
      package_subtree: "b36460ec0545c44036fd122e3e9b090abfde98d7",
    }),
    artifact: Object.freeze({
      path: "test/fixtures/runtime-candidates/aikdna-kdna-core-0.21.0.tgz",
      size: 118029,
      unpacked_size: 536551,
      sha1: "dde98685bb22cf5d3b49897092cb7e2fc052c5d4",
      sha256:
        "51561e712fcf4af389e61377b478ad67287c1d7c4483321117922cdb0478e83e",
      integrity:
        "sha512-y4AC4LlNvKsKxvIO/y14Bl62eRb0BupzvLGbXATXHX4ZUCmYhdlh6U1OL7WF+i0lCAyVJcIE7SKwhQR3uL5uxg==",
      entry_count: 42,
      source_pack_equivalence: "strict_install_equivalent",
    }),
  }),
});

function hash(algorithm, bytes, encoding = "hex") {
  return crypto.createHash(algorithm).update(bytes).digest(encoding);
}

function assertExactKeys(value, keys, label) {
  assert.deepEqual(
    Object.keys(value).sort(),
    [...keys].sort(),
    `${label} keys must be exact`,
  );
}

function tarEntries(bytes) {
  const tar = zlib.gunzipSync(bytes);
  const entries = [];
  let offset = 0;
  let endBlocks = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    offset += 512;
    if (header.every((byte) => byte === 0)) {
      endBlocks += 1;
      if (endBlocks === 2) break;
      continue;
    }
    endBlocks = 0;
    const name = header
      .subarray(0, 100)
      .toString("utf8")
      .replace(/\0.*$/su, "");
    const sizeText = header
      .subarray(124, 136)
      .toString("ascii")
      .replace(/\0.*$/su, "")
      .trim();
    const size = Number.parseInt(sizeText || "0", 8);
    assert.ok(
      Number.isSafeInteger(size) && size >= 0,
      "candidate tar entry size is invalid",
    );
    assert.ok(offset + size <= tar.length, "candidate tar entry is truncated");
    entries.push({ name, size, content: tar.subarray(offset, offset + size) });
    offset += Math.ceil(size / 512) * 512;
  }
  assert.equal(endBlocks, 2, "candidate tar must end with two zero blocks");
  return entries;
}

function verifyArtifact(root, candidate) {
  const expected = EXPECTED[candidate.name];
  assert.ok(expected, `unexpected candidate package: ${candidate.name}`);
  assertExactKeys(
    candidate,
    ["name", "version", "source", "artifact", "registry_boundary"],
    candidate.name,
  );
  assert.equal(candidate.version, expected.version);
  assertExactKeys(
    candidate.source,
    Object.keys(expected.source),
    `${candidate.name} source`,
  );
  assert.deepEqual(candidate.source, expected.source);
  assertExactKeys(
    candidate.artifact,
    Object.keys(expected.artifact),
    `${candidate.name} artifact`,
  );
  assert.deepEqual(candidate.artifact, expected.artifact);
  assert.deepEqual(candidate.registry_boundary, {
    published: true,
    release_required: false,
  });

  const bytes = fs.readFileSync(path.join(root, candidate.artifact.path));
  assert.equal(bytes.length, candidate.artifact.size);
  assert.equal(hash("sha1", bytes), candidate.artifact.sha1);
  assert.equal(hash("sha256", bytes), candidate.artifact.sha256);
  assert.equal(
    `sha512-${hash("sha512", bytes, "base64")}`,
    candidate.artifact.integrity,
  );

  const entries = tarEntries(bytes);
  assert.equal(entries.length, candidate.artifact.entry_count);
  assert.equal(
    entries.reduce((total, entry) => total + entry.size, 0),
    candidate.artifact.unpacked_size,
  );
  const packageEntries = entries.filter(
    ({ name }) => name === "package/package.json",
  );
  assert.equal(
    packageEntries.length,
    1,
    `${candidate.name} must contain one package.json`,
  );
  const packed = JSON.parse(packageEntries[0].content.toString("utf8"));
  assert.equal(packed.name, candidate.name);
  assert.equal(packed.version, candidate.version);
  return entries.length;
}

export function validateCandidateFacts({
  binding,
  packageJson,
  lock,
  installedCli,
  installedCore,
  packedFiles,
  root,
}) {
  assertExactKeys(
    binding,
    ["schema", "schema_version", "packages", "release_boundary"],
    "runtime binding",
  );
  assert.equal(binding.schema, "kdna.mcp.runtime-candidate-binding");
  assert.equal(binding.schema_version, "0.1.0");
  assert.equal(binding.packages.length, 2);
  assert.deepEqual(
    binding.packages.map(({ name }) => name),
    [CLI, CORE],
  );
  const entryCount = binding.packages.reduce(
    (total, candidate) => total + verifyArtifact(root, candidate),
    0,
  );
  assert.deepEqual(binding.release_boundary, {
    status: "candidate_only",
    mcp_registry_dependency: `${CLI}@0.36.0`,
    registry_install_requires: [`${CLI}@0.36.0`, `${CORE}@0.21.0`],
  });

  assert.deepEqual(packageJson.dependencies, { [CLI]: "0.36.0" });
  assert.deepEqual(packageJson.kdna_runtime, {
    cli: "0.36.0",
    core: "0.21.0",
    workspace_schema: "0.3.0",
  });
  assert.deepEqual(lock.packages[""].dependencies, { [CLI]: "0.36.0" });

  const cliLocked = lock.packages[`node_modules/${CLI}`];
  assert.equal(cliLocked.version, "0.36.0");
  assert.equal(
    cliLocked.resolved,
    `https://registry.npmjs.org/@aikdna/kdna-cli/-/kdna-cli-${EXPECTED[CLI].version}.tgz`,
  );
  assert.equal(cliLocked.integrity, EXPECTED[CLI].artifact.integrity);
  assert.deepEqual(cliLocked.dependencies, {
    [CORE]: "0.21.0",
    "cbor-x": "1.6.4",
  });
  assert.equal(lock.packages["node_modules/@aikdna/kdna-eval"], undefined);

  const coreLocked = lock.packages[`node_modules/${CORE}`];
  assert.equal(coreLocked.version, "0.21.0");
  assert.equal(
    coreLocked.resolved,
    `https://registry.npmjs.org/@aikdna/kdna-core/-/kdna-core-${EXPECTED[CORE].version}.tgz`,
  );
  assert.equal(coreLocked.integrity, EXPECTED[CORE].artifact.integrity);
  assert.equal(installedCli.name, CLI);
  assert.equal(installedCli.version, "0.36.0");
  assert.equal(installedCore.name, CORE);
  assert.equal(installedCore.version, "0.21.0");

  for (const packageName of [CLI, CORE]) {
    const copies = Object.keys(lock.packages).filter((entry) =>
      entry.toLowerCase().endsWith(`node_modules/${packageName}`),
    );
    assert.deepEqual(
      copies,
      [`node_modules/${packageName}`],
      `lock must contain one ${packageName} copy`,
    );
  }
  assert.equal(
    packedFiles.some(
      ({ path: packedPath }) =>
        packedPath.endsWith(".tgz") ||
        packedPath.startsWith("test/") ||
        packedPath.startsWith("scripts/"),
    ),
    false,
    "published MCP pack must exclude candidates, tests, and source-only scripts",
  );
  return { entryCount, packedFileCount: packedFiles.length };
}

function npmPackFiles(root) {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-mcp-runtime-pack-"),
  );
  try {
    const result = spawnSync(
      "npm",
      [
        "pack",
        "--dry-run",
        "--json",
        "--ignore-scripts",
        "--pack-destination",
        temporary,
      ],
      {
        cwd: root,
        encoding: "utf8",
        shell: false,
        maxBuffer: MAX_OUTPUT_BYTES,
      },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.length, 1);
    return report[0].files;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;

export function verifyRuntimeCandidates(root = PACKAGE_ROOT) {
  const readJson = (relative) =>
    JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
  return validateCandidateFacts({
    binding: readJson("test/fixtures/runtime-candidates/binding.json"),
    packageJson: readJson("package.json"),
    lock: readJson("package-lock.json"),
    installedCli: readJson("node_modules/@aikdna/kdna-cli/package.json"),
    installedCore: readJson("node_modules/@aikdna/kdna-core/package.json"),
    packedFiles: npmPackFiles(root),
    root,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const result = verifyRuntimeCandidates();
  console.log(
    `Runtime candidates verified: ${CLI}@0.36.0 + ${CORE}@0.21.0 (${result.entryCount} candidate entries; ${result.packedFileCount} MCP pack files)`,
  );
}
