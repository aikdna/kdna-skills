#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

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
// Exact retained historical archives and current public technical fixtures.
for (const [name, digest] of [
  [
    "mcp-server/test/fixtures/public-read-current/graph-asset.kdna",
    "489c0d8e15c12fc08bf5d8132a8b6174ffade35ed6e28a63cbb03655e575b554"
  ],
  [
    "mcp-server/test/fixtures/public-read-current/graph-cross.kdna",
    "f0ad03241ecf263c26402cef52467f3ab276a0e20ce669a44b22b385f01620c2"
  ],
  [
    "mcp-server/test/fixtures/public-read-current/graph-dedup-support.kdna",
    "f50dbe62d81a3b35e666fb90c095ba087f3c54f98a263e74392bc2b4743f6067"
  ],
  [
    "mcp-server/test/fixtures/public-read-current/graph-method.kdna",
    "4d375b3764319de9f989f32c0c04ddff372ef0ea8824328e61fd344c8be32e6c"
  ],
  [
    "mcp-server/test/fixtures/public-read-current/graph-null.kdna",
    "813501a0efbe18574865adcf7e6beae55f7e8a637c199d0ecb1520fb362f8b90"
  ],
  [
    "mcp-server/test/fixtures/public-read-current/graph-same.kdna",
    "9de1f6b0752e29703e9c7b3de28cf3df21ccbd1ddef9c2189e2e312824dcf23b"
  ],
  [
    "mcp-server/test/fixtures/public-read-current/hostile-zip-crc.kdna",
    "a61f0e29ae97a873472929ccbcb47ab00e199b2dd6580b10fb7f36100e86e63a"
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
      const output = spawnSync("tar", ["-xOzf", artifact, "package/" + packedPath], { cwd: ROOT, shell: false });
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

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  console.log(JSON.stringify(checkCurrentNames()));
}
