/*
 * Regression test for the entry guards of this repository's scripts.
 *
 * The defect it pins: an entry guard decided "am I the command-line entry point?"
 * by comparing `process.argv[1]` with the module's own URL through plain path
 * resolution, which does not resolve symlinks. An invocation through an aliased
 * directory (macOS `/var` -> `/private/var`, a symlinked checkout, a linked
 * working copy) therefore skipped the main function and exited 0 with no output:
 * "the command succeeded" proved nothing about what it was supposed to check.
 *
 * Both sides are now compared through realpath, and an entry path that realpath
 * cannot resolve refuses to run instead of reporting success.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..");

// Scripts that reject unusable arguments: the canonical and the aliased run must
// fail identically instead of one of them exiting 0 without doing anything.
const INVALID_ARGUMENT_ENTRIES = [
  { file: "mcp-server/scripts/verify-runtime-candidates.mjs", args: ["--nonsense-flag"] },
  { file: "mcp-server/scripts/create-local-consumer.mjs", args: [] },
];

// The naming audit takes no arguments: the aliased run must do the same work as
// the canonical one, so its report has to appear on stdout in both cases.
const RUNS_ENTRIES = [{ file: "scripts/check-current-names.mjs", args: [] }];

const ALL_ENTRIES = [
  ...INVALID_ARGUMENT_ENTRIES.map((entry) => entry.file),
  ...RUNS_ENTRIES.map((entry) => entry.file),
];

function runFile(file, args) {
  return spawnSync(process.execPath, [file, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

function runImportProbe(file) {
  const url = pathToFileURL(path.join(REPO_ROOT, file)).href;
  const code =
    `import(${JSON.stringify(url)}).then(() => {}, ` +
    `(error) => { console.error(String(error)); process.exitCode = 1; });`;
  return spawnSync(process.execPath, ["--input-type=module", "--eval", code], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

// A directory symlink to this repository. Returns null when the platform refuses
// to create one; the caller reports the skip instead of asserting silently.
function aliasDirectory(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kdna-mcp-entry-guard-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const alias = path.join(root, "kdna-skills-alias");
  try {
    fs.symlinkSync(REPO_ROOT, alias, "dir");
  } catch (error) {
    if (["EACCES", "ENOTSUP", "EPERM"].includes(error.code)) {
      t.diagnostic(`aliased-directory half skipped: symlink creation failed with ${error.code}`);
      return null;
    }
    throw error;
  }
  return alias;
}

for (const entry of INVALID_ARGUMENT_ENTRIES) {
  test(`${entry.file} fails non-zero on an unusable invocation, also through an alias`, (t) => {
    const canonical = runFile(path.join(REPO_ROOT, entry.file), entry.args);
    assert.notEqual(canonical.status, 0, "the canonical run must fail, not exit 0");
    assert.notEqual(
      `${canonical.stdout}${canonical.stderr}`.trim(),
      "",
      "the canonical run must report why it failed",
    );

    const alias = aliasDirectory(t);
    if (alias === null) return;
    const aliased = runFile(path.join(alias, entry.file), entry.args);
    assert.notEqual(aliased.status, 0, "the aliased run must fail, not exit 0");
    assert.equal(aliased.status, canonical.status);
    assert.equal(aliased.stdout, canonical.stdout);
    assert.equal(aliased.stderr, canonical.stderr);
  });
}

for (const entry of RUNS_ENTRIES) {
  test(`${entry.file} does the same work through an alias`, (t) => {
    const canonical = runFile(path.join(REPO_ROOT, entry.file), entry.args);
    assert.equal(canonical.status, 0);
    assert.notEqual(canonical.stdout.trim(), "", "the canonical run must print its report");

    const alias = aliasDirectory(t);
    if (alias === null) return;
    const aliased = runFile(path.join(alias, entry.file), entry.args);
    assert.equal(aliased.status, 0);
    assert.notEqual(
      aliased.stdout.trim(),
      "",
      "the aliased run must not exit 0 having done nothing",
    );
    assert.equal(aliased.stdout, canonical.stdout);
  });
}

for (const file of ALL_ENTRIES) {
  test(`${file} does not execute anything when imported`, () => {
    const probe = runImportProbe(file);
    assert.equal(probe.status, 0, `importing ${file} must not fail: ${probe.stderr}`);
    assert.equal(probe.stdout, "", `importing ${file} must not run the main function`);
    assert.equal(probe.stderr, "", `importing ${file} must not write to stderr`);
  });
}
