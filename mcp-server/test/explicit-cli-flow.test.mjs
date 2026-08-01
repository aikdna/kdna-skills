import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const cliInfo = require("@aikdna/kdna-cli/package.json");
const cli = path.resolve(
  path.dirname(require.resolve("@aikdna/kdna-cli/package.json")),
  cliInfo.bin.kdna,
);

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env || {}) },
    input: options.input,
    encoding: "utf8",
    stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
  assert.equal(
    result.status,
    options.status ?? 0,
    result.stderr || result.stdout,
  );
  return result;
}

function makeAsset(root, name, password) {
  const source = path.join(root, `${name}-source`);
  const asset = path.join(root, `${name}.kdna`);
  const demoArgs = ["demo", "minimal", source];
  if (password !== undefined) demoArgs.push("--password-stdin");
  runCli(demoArgs, {
    cwd: root,
    input: password === undefined ? undefined : `${password}\n`,
  });
  runCli(["pack", source, asset], { cwd: root });
  return asset;
}

function commandAuditHook(root) {
  const audit = path.join(root, "explicit-cli-commands.jsonl");
  const hook = path.join(root, "explicit-cli-command-audit.cjs");
  fs.writeFileSync(
    hook,
    `
const fs = require("node:fs");
if (
  process.argv[1] === ${JSON.stringify(cli)} &&
  ["validate", "plan-load", "load"].includes(process.argv[2])
) {
  fs.appendFileSync(
    ${JSON.stringify(audit)},
    JSON.stringify({
      command: process.argv[2],
      argv: process.argv.slice(2),
      hasPasswordEnvironment: Object.keys(process.env).some((key) =>
        /password|secret/iu.test(key)
      ),
    }) + "\\n"
  );
}
`,
    { mode: 0o600 },
  );
  const inherited = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} `
    : "";
  return {
    audit,
    env: { NODE_OPTIONS: `${inherited}--require=${hook}` },
  };
}

function auditedCommands(audit) {
  return fs
    .readFileSync(audit, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("one ordinary explicit-file approval maps to one CLI load and no persistent workspace state", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kdna-explicit-cli-"));
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const asset = makeAsset(root, "ordinary");
    const audit = commandAuditHook(root);
    const result = runCli(
      ["load", asset, "--profile=compact", "--as=json"],
      { cwd: workspace, env: audit.env },
    );
    const capsule = JSON.parse(result.stdout);

    assert.equal(capsule.type, "kdna.runtime-capsule");
    assert.ok(capsule.asset.asset_id);
    assert.ok(capsule.digests.asset.value);
    assert.equal(fs.existsSync(path.join(workspace, ".kdna")), false);
    assert.deepEqual(auditedCommands(audit.audit), [
      {
        command: "load",
        argv: ["load", asset, "--profile=compact", "--as=json"],
        hasPasswordEnvironment: false,
      },
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("one protected explicit-file load adds only the bounded stdin secret authorization", () => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-explicit-cli-protected-"),
  );
  const password = " protected explicit file password ";
  try {
    const workspace = path.join(root, "project");
    fs.mkdirSync(workspace);
    const asset = makeAsset(root, "protected", password);
    const audit = commandAuditHook(root);
    const result = runCli(
      ["load", asset, "--profile=compact", "--as=json", "--password-stdin"],
      { cwd: workspace, env: audit.env, input: `${password}\n` },
    );
    const capsule = JSON.parse(result.stdout);

    assert.equal(capsule.type, "kdna.runtime-capsule");
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(password, "u"));
    assert.equal(fs.existsSync(path.join(workspace, ".kdna")), false);
    assert.deepEqual(auditedCommands(audit.audit), [
      {
        command: "load",
        argv: [
          "load",
          asset,
          "--profile=compact",
          "--as=json",
          "--password-stdin",
        ],
        hasPasswordEnvironment: false,
      },
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
