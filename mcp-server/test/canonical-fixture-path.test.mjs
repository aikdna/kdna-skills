import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { bindOperatorInput } from "../bin/operator-binding.mjs";
import { makeCanonicalTempRoot } from "./support/canonical-temp-root.mjs";

// Regression guard for the macOS default-path case.
//
// The operator binding deliberately requires the selected file to be strictly
// canonical (`path.resolve(selected) === selected` plus
// `fs.realpathSync(selected) === selected`) on top of its dev/ino, symlink and
// O_NOFOLLOW identity checks. On macOS `os.tmpdir()` is a `/var/folders/...`
// alias for `/private/var/folders/...`, so a fixture root taken verbatim from
// `fs.mkdtempSync(os.tmpdir(), ...)` is already non-canonical and the binding
// correctly refuses it. These two tests keep the fixtures canonical and prove
// the constraint itself was not weakened.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures =
  process.env.KDNA_PUBLIC_FIXTURES ||
  path.join(root, "test/fixtures/public-read-current");

test("the fixture root handed to the operator binding is already canonical", (t) => {
  const fixtureRoot = makeCanonicalTempRoot("kdna-canonical-fixture-");
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

  assert.equal(
    path.resolve(fixtureRoot),
    fixtureRoot,
    `fixture root must be absolute and normalized: ${fixtureRoot}`,
  );
  assert.equal(
    fs.realpathSync(fixtureRoot),
    fixtureRoot,
    `fixture root must already be canonical, not an alias: ${fixtureRoot}`,
  );

  // Derived paths inherit canonicality, so the value the binding receives is
  // canonical on every platform and a genuine binding still succeeds.
  const selected = path.join(fixtureRoot, "selected.kdna");
  fs.copyFileSync(path.join(fixtures, "graph-cross.kdna"), selected);
  assert.equal(fs.realpathSync(selected), selected);

  const binding = bindOperatorInput(["--asset", selected, "--allow-read"]);
  assert.equal(binding.state, "bound");
  binding.close();
});

test("a deliberately non-canonical alias is still rejected by the operator binding", (t) => {
  const fixtureRoot = makeCanonicalTempRoot("kdna-aliased-fixture-");
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

  const target = path.join(fixtureRoot, "data.kdna");
  fs.copyFileSync(path.join(fixtures, "graph-cross.kdna"), target);

  // Reproduce the macOS /var/folders vs /private/var/folders alias on every
  // platform with a directory symlink whose real path differs from the literal
  // spelling of the same, otherwise valid, `.kdna` file.
  const aliasDir = path.join(fixtureRoot, "aliased");
  fs.symlinkSync(fixtureRoot, aliasDir, "dir");
  const aliased = path.join(aliasDir, "data.kdna");

  assert.ok(fs.lstatSync(aliased).isFile(), "the alias must resolve to a real file");
  assert.equal(path.resolve(aliased), aliased);
  assert.notEqual(
    fs.realpathSync(aliased),
    aliased,
    "precondition: the alias spelling must be non-canonical",
  );

  assert.throws(
    () => bindOperatorInput(["--asset", aliased, "--allow-read"]),
    (error) => error.code === "MCP_BINDING_INVALID",
  );

  // The canonical spelling of the identical bytes still binds, so the
  // rejection is caused solely by the non-canonical path.
  const canonical = bindOperatorInput(["--asset", target, "--allow-read"]);
  assert.equal(canonical.state, "bound");
  canonical.close();
});
