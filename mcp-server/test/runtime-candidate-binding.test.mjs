import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateCandidateFacts } from "../scripts/verify-runtime-candidates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const canonical = () => ({
  binding: readJson("test/fixtures/runtime-candidates/binding.json"),
  packageJson: readJson("package.json"),
  lock: readJson("package-lock.json"),
  installedCli: readJson("node_modules/@aikdna/kdna-cli/package.json"),
  installedCore: readJson("node_modules/@aikdna/kdna-core/package.json"),
  packedFiles: [
    { path: "LICENSE" },
    { path: "NOTICE" },
    { path: "README.md" },
    { path: "bin/kdna-mcp.mjs" },
    { path: "package.json" },
  ],
  root,
});

test("runtime candidate binding accepts only the exact merged CLI and Core artifacts", () => {
  assert.deepEqual(validateCandidateFacts(canonical()), {
    entryCount: 75,
    packedFileCount: 5,
  });
});

test("runtime candidate binding rejects authority, dependency, and pack drift", async (t) => {
  const mutations = [
    [
      "CLI commit drift",
      (facts) => {
        facts.binding.packages[0].source.commit = "0".repeat(40);
      },
    ],
    [
      "CLI tree drift",
      (facts) => {
        facts.binding.packages[0].source.tree = "0".repeat(40);
      },
    ],
    [
      "Core subtree drift",
      (facts) => {
        facts.binding.packages[1].source.package_subtree = "0".repeat(40);
      },
    ],
    [
      "artifact path drift",
      (facts) => {
        facts.binding.packages[0].artifact.path = "test/cli.tgz";
      },
    ],
    [
      "artifact authority extension",
      (facts) => {
        facts.binding.packages[1].artifact.compatibility_exception = true;
      },
    ],
    [
      "top-level release claim",
      (facts) => {
        facts.binding.release_authority = "published";
      },
    ],
    [
      "formal CLI dependency drift",
      (facts) => {
        facts.packageJson.dependencies["@aikdna/kdna-cli"] = "^0.36.0";
      },
    ],
    [
      "direct Core dependency",
      (facts) => {
        facts.packageJson.dependencies["@aikdna/kdna-core"] = "0.21.0";
      },
    ],
    [
      "root lock drift",
      (facts) => {
        facts.lock.packages[""].dependencies["@aikdna/kdna-cli"] = "0.35.0";
      },
    ],
    [
      "CLI lock resolution drift",
      (facts) => {
        facts.lock.packages["node_modules/@aikdna/kdna-cli"].resolved =
          "https://registry.invalid/cli.tgz";
      },
    ],
    [
      "Core lock resolution drift",
      (facts) => {
        facts.lock.packages["node_modules/@aikdna/kdna-core"].resolved =
          "https://registry.invalid/core.tgz";
      },
    ],
    [
      "CLI Core edge drift",
      (facts) => {
        facts.lock.packages["node_modules/@aikdna/kdna-cli"].dependencies[
          "@aikdna/kdna-core"
        ] = "0.20.0";
      },
    ],
    [
      "CLI Eval dependency reintroduced",
      (facts) => {
        facts.lock.packages["node_modules/@aikdna/kdna-cli"].dependencies[
          "@aikdna/kdna-eval"
        ] = "0.3.2";
      },
    ],
    [
      "installed CLI drift",
      (facts) => {
        facts.installedCli.version = "0.35.0";
      },
    ],
    [
      "installed Core drift",
      (facts) => {
        facts.installedCore.version = "0.20.0";
      },
    ],
    [
      "shadow CLI copy",
      (facts) => {
        facts.lock.packages[
          "node_modules/foreign/node_modules/@aikdna/kdna-cli"
        ] = { version: "0.36.0" };
      },
    ],
    [
      "shadow Core copy",
      (facts) => {
        facts.lock.packages[
          "node_modules/foreign/node_modules/@aikdna/kdna-core"
        ] = { version: "0.21.0" };
      },
    ],
    [
      "candidate leaked into pack",
      (facts) => {
        facts.packedFiles.push({
          path: "test/fixtures/runtime-candidates/cli.tgz",
        });
      },
    ],
  ];
  for (const [name, mutate] of mutations) {
    await t.test(name, () => {
      const facts = canonical();
      mutate(facts);
      assert.throws(() => validateCandidateFacts(facts));
    });
  }
});
