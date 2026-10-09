#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_ROOT = path.join(ROOT, "mcp-server");
import { PACKED_FILES, ARTIFACTS } from "../mcp-server/scripts/verify-runtime-candidates.mjs";
const ALLOWLIST = "scripts/naming-integrity-allowlist.json";
const CANDIDATES = new Map([
  [
    "mcp-server/test/fixtures/runtime-candidates/aikdna-kdna-cli-0.36.1.tgz",
    "611ae81c8f46e01f15c938746320c2243f1fcaf407db6e6b575c4fb859ec3219",
  ],
  [
    "mcp-server/test/fixtures/runtime-candidates/aikdna-kdna-core-0.21.0.tgz",
    "51561e712fcf4af389e61377b478ad67287c1d7c4483321117922cdb0478e83e",
  ],
]);
// Exact retained historical archives and generated native public technical fixtures.
for (const [name, digest] of [
  [
    "mcp-server/test/fixtures/public-read-native/graph-asset.kdna",
    "925417f32bc33c5baff01c2a1fc1fd207233113e729c10a1b9d9ee583a5cef8d"
  ],
  [
    "mcp-server/test/fixtures/public-read-native/graph-cross.kdna",
    "68a61d46f2df03bd087fea70b61ad226baddcff3f6318a3b4d44c0f961b8fe69"
  ],
  [
    "mcp-server/test/fixtures/public-read-native/graph-dedup-support.kdna",
    "aa0c2c7b2ed176d1bae2a37f34bd771f2f4dfc57688bb5052483d72e2547a726"
  ],
  [
    "mcp-server/test/fixtures/public-read-native/graph-method.kdna",
    "cf8298d97bb9f911b3996fd0a986068af0d686807639aa86dd046921079e7ca7"
  ],
  [
    "mcp-server/test/fixtures/public-read-native/graph-null.kdna",
    "f030b7829e4c4a5d7b748dd3b5e6c9ca872469e49f0ff51ad93dd2abc17fd612"
  ],
  [
    "mcp-server/test/fixtures/public-read-native/graph-same.kdna",
    "6c13d6d76efc959beac4864a3094503f16ee3a2379bab1bc658417f492e35a37"
  ],
  [
    "mcp-server/test/fixtures/public-read-native/hostile-native-truncated.kdna",
    "e5080f610e32347a496bc1d7e221ac53c6b00daed64e390e4fc8c2c6fab106ed"
  ]
]) CANDIDATES.set(name, digest);
for (const item of ARTIFACTS) CANDIDATES.set("mcp-server/" + item.file, item.sha256);
const EXACT_OLD_NAMES = Object.freeze([
  ["judgment-profile", "-v1"].join(""),
  ["/v1", "/project"].join(""),
  ["mcp-", "v1.test.mjs"].join(""),
  ["kdna.context", ".capsule"].join(""),
  ['"kdna_', 'version"'].join(""),
]);
const GENERATION_NAMES = Object.freeze([
  /\b(V[0-9]+)\b/gu,
  /\b([a-z][a-z0-9]*V[0-9]+)\b/gu,
  /\b([A-Za-z][A-Za-z0-9_.-]*(?:[-_][vV])[0-9]+)(?![0-9.])/gu,
]);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

function candidateFiles() {
  const files = [];
  function walk(directory, prefix = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix ? prefix + "/" + entry.name : entry.name;
      if ([".git", "node_modules"].includes(entry.name) || relative === "docs/audits") continue;
      assert.equal(entry.isSymbolicLink(), false, "current source names may not follow links");
      if (entry.isDirectory()) walk(path.join(directory, entry.name), relative);
      else if (entry.isFile()) files.push(relative);
    }
  }
  walk(ROOT);
  return files.sort();
}

export function findCurrentNameResiduals(entries) {
  const residuals = [];
  for (const { path: entryPath, text: rawText } of entries) {
    const text = entryPath.endsWith(".json")
      ? rawText.replace(/("integrity"\s*:\s*")[^"]+(")/g, "$1<opaque digest>$2")
      : rawText;
    for (const token of EXACT_OLD_NAMES) {
      if (text.includes(token)) residuals.push({ path: entryPath, token });
    }
    for (const pattern of GENERATION_NAMES) {
      for (const match of text.matchAll(pattern)) {
        residuals.push({ path: entryPath, token: match[1] });
      }
    }
  }
  return [
    ...new Map(
      residuals.map((item) => [`${item.path}\0${item.token}`, item]),
    ).values(),
  ];
}

function trackedTextEntries() {
  const entries = [];
  for (const relative of candidateFiles()) {
    const absolute = path.join(ROOT, relative);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    if (CANDIDATES.has(relative)) {
      const bytes = fs.readFileSync(absolute);
      assert.equal(
        crypto.createHash("sha256").update(bytes).digest("hex"),
        CANDIDATES.get(relative),
        "each binary naming-gate exception must retain its exact candidate hash",
      );
      continue;
    }
    const bytes = fs.readFileSync(absolute);
    assert.equal(
      bytes.includes(0),
      false,
      `unexpected binary tracked file: ${relative}`,
    );
    entries.push({ path: relative, text: bytes.toString("utf8") });
  }
  return entries;
}

function validateAllowlist() {
  const value = JSON.parse(fs.readFileSync(path.join(ROOT, ALLOWLIST), "utf8"));
  assert.deepEqual(Object.keys(value).sort(), [
    "exceptions",
    "schema",
    "schema_version",
  ]);
  assert.equal(value.schema, "kdna.naming-integrity-third-party-allowlist");
  assert.equal(value.schema_version, "0.1.0");
  assert.deepEqual(value.exceptions, []);
  return value;
}

function packedTextEntries() {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-mcp-current-names-"),
  );
  try {
    const report = JSON.parse(
      run(
        "npm",
        ["pack", "--json", "--ignore-scripts", "--pack-destination", temporary],
        {
          cwd: PACKAGE_ROOT,
          env: {
            ...process.env,
            npm_config_dry_run: "false",
            NPM_CONFIG_DRY_RUN: "false",
          },
        },
      ),
    );
    assert.equal(report.length, 1);
    const files = report[0].files
      .map(({ path: packedPath }) => packedPath)
      .sort();
    assert.deepEqual(files, PACKED_FILES);
    const artifact = path.join(temporary, report[0].filename);
    return files.flatMap((packedPath) => {
      const output = spawnSync("tar", ["-xOzf", artifact, "package/" + packedPath], { cwd: ROOT, shell: false, maxBuffer: 32 * 1024 * 1024 });
      assert.equal(output.status, 0, output.stderr.toString());
      const expected = CANDIDATES.get("mcp-server/" + packedPath);
      if (expected) { assert.equal(crypto.createHash("sha256").update(output.stdout).digest("hex"), expected); return []; }
      assert.equal(output.stdout.includes(0), false, "unexpected binary package member");
      return [{ path: "package/" + packedPath, text: output.stdout.toString("utf8") }];
    });
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

export function checkCurrentNames() {
  const allowlist = validateAllowlist();
  const tracked = trackedTextEntries();
  const packed = packedTextEntries();
  const residuals = findCurrentNameResiduals([...tracked, ...packed]);
  assert.deepEqual(
    residuals,
    [],
    `current-name residuals: ${JSON.stringify(residuals)}`,
  );
  return {
    tracked_file_count: tracked.length + CANDIDATES.size,
    package_tar_file_count: PACKED_FILES.length,
    exact_third_party_exception_count: allowlist.exceptions.length,
    exact_binary_authority_count: CANDIDATES.size,
    residual_count: 0,
  };
}

// Entry guard. Both sides are compared through realpath so an invocation through
// a symlinked or aliased directory still RUNS the naming audit (and can never
// exit 0 silently, which is the failure mode this guard exists to prevent). An
// import is not the entry point and must not run it; an entry path that realpath
// cannot resolve refuses to run instead of reporting success.
function entryGuardOutcome() {
  if (!process.argv[1]) return "import";
  const selfPath = fileURLToPath(import.meta.url);
  let invoked = null;
  let self = null;
  try {
    invoked = fs.realpathSync(process.argv[1]);
  } catch {
    invoked = null;
  }
  try {
    self = fs.realpathSync(selfPath);
  } catch {
    self = null;
  }
  if (invoked && self && invoked === self) return "entry";
  if (path.resolve(process.argv[1]) === path.resolve(selfPath)) return "unresolved-entry";
  return "import";
}
const entryGuard = entryGuardOutcome();
if (entryGuard === "unresolved-entry") {
  console.error(
    "KDNA_CURRENT_NAMES_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path",
  );
  process.exit(2);
}
if (entryGuard === "entry") {
  console.log(JSON.stringify(checkCurrentNames()));
}
