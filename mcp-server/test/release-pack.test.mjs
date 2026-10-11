import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { makeCanonicalTempRoot } from "./support/canonical-temp-root.mjs";

// Kept in its own file so the publish lifecycle fixture can verify real pack
// bytes without re-entering the MCP protocol or packed-consumer suites.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { parseTarFiles, validateEvidenceArtifact, validatePackReport } = require("../../scripts/release-evidence");
const HASH = "a".repeat(40);

test("pack evidence independently verifies identity, file list, sizes, SHA-1, and SHA-512", (t) => {
  const temp = makeCanonicalTempRoot("kdna-mcp-pack-test-");
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const packed = spawnSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", temp],
    {
      cwd: packageRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        npm_config_dry_run: "false",
        NPM_CONFIG_DRY_RUN: "false",
      },
      maxBuffer: 16 * 1024 * 1024,
      shell: false,
    },
  );
  assert.equal(packed.status, 0, packed.stderr);
  const report = JSON.parse(packed.stdout)[0];
  const tarball = fs.readFileSync(path.join(temp, report.filename));
  const pkg = JSON.parse(
    fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
  );
  if (pkg.version.includes("-")) {
    assert.throws(() => validatePackReport({reportText: packed.stdout,tarball,pkg,source: {ref: `refs/tags/${pkg.version}`,commit: HASH}}), /stable canonical SemVer/);
    assert.deepEqual(parseTarFiles(tarball).map(x => ({path:x.path,size:x.size})).sort((a,b)=>a.path.localeCompare(b.path)), report.files.map(x=>({path:x.path,size:x.size})).sort((a,b)=>a.path.localeCompare(b.path)));
    assert.equal(report.shasum,crypto.createHash("sha1").update(tarball).digest("hex"));
    assert.equal(report.integrity,"sha512-"+crypto.createHash("sha512").update(tarball).digest("base64"));
    return; // A private prerelease archive cannot be promoted to stable release evidence.
  }
  const candidate = validatePackReport({
    reportText: packed.stdout,
    tarball,
    pkg,
    source: { ref: `refs/tags/${pkg.version}`, commit: HASH },
  });
  assert.equal(
    candidate.artifact.shasum,
    crypto.createHash("sha1").update(tarball).digest("hex"),
  );
  assert.equal(candidate.artifact.files.length, candidate.artifact.file_count);
  assert.equal(validateEvidenceArtifact(candidate, tarball), candidate);
  const tampered = Buffer.from(tarball);
  tampered[tampered.length - 1] ^= 1;
  assert.throws(
    () => validateEvidenceArtifact(candidate, tampered),
    /shasum|integrity|tar/i,
  );
});

