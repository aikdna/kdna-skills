import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

// The approved retirement text, pinned independently here so this test is a
// witness of the two carriers instead of an echo of either one. Any edit to
// the notice, in either carrier, must change this constant (and re-approval).
const RETIREMENT = "This npm coordinate is retired. The current KDNA MCP server is delivered from the Git channel aikdna/kdna-skills and is not published to npm. The supported stable npm surface is the five stable packages (Core, Read, CLI, Studio Core, Studio CLI). This coordinate is not an install path and is not a sixth stable package.";

test("the README carries exactly the approved retirement text", () => {
  assert.equal(fs.readFileSync(path.join(root, "README.md"), "utf8"), RETIREMENT + "\n");
});

test("the kdna-mcp bin prints the retirement text and exits non-zero", () => {
  const run = spawnSync(process.execPath, [path.join(root, "bin", "kdna-mcp.mjs")], { encoding: "utf8" });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 1);
  assert.equal(run.stdout, "");
  assert.equal(run.stderr, RETIREMENT + "\n");
});

test("the package identity is the retirement coordinate", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.name, "@aikdna/kdna-mcp-server");
  assert.equal(pkg.version, "0.5.1");
  assert.equal(pkg.private, false);
  assert.deepEqual(pkg.bin, { "kdna-mcp": "bin/kdna-mcp.mjs" });
});

test("the bin keeps the retirement text source in the package", () => {
  const bin = fs.readFileSync(path.join(root, "bin", "kdna-mcp.mjs"), "utf8");
  const occurrences = bin.split(RETIREMENT).length - 1;
  assert.equal(occurrences, 1);
});

test("LICENSE and NOTICE stay byte-identical to the server package copies", () => {
  for (const name of ["LICENSE", "NOTICE"]) {
    assert.ok(
      fs.readFileSync(path.join(root, name)).equals(fs.readFileSync(path.join(root, "..", "mcp-server", name))),
      `${name} drifted from the mcp-server copy`,
    );
  }
});
