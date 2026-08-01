#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(authorityFile, root = ROOT) {
  const args = [path.join(root, "scripts", "validate-agent-support.js")];
  if (authorityFile) args.push("--authority-file", authorityFile);
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
}

function copyPublicSource(root) {
  const copy = path.join(root, "repo");
  fs.cpSync(ROOT, copy, {
    recursive: true,
    filter(source) {
      return ![".git", "node_modules"].includes(path.basename(source));
    },
  });
  return copy;
}

function writeAuthority(root, value, name = "authority.json") {
  const file = path.join(root, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  });
  return file;
}

test("non-green public claims pass without pretending an embedded authority exists", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /current authority not supplied/u);
  assert.match(
    result.stdout,
    /single-Host product minimum distinct from 2-Host portability benchmark RECHECK_REQUIRED/u,
  );
});

test("canonical non-authoritative tombstone binds and remains non-green", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-authority-test-"),
  );
  try {
    const file = writeAuthority(temporary, {
      status: "WAITING_FOR_TRUSTED_CREATION_HANDOFF",
      current_authority: false,
      ready: false,
      consume: false,
    });
    const result = run(file);
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      /current authority bound WAITING_FOR_TRUSTED_CREATION_HANDOFF/u,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("current BLOCKED authority binds and remains fail-closed", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-authority-test-"),
  );
  try {
    const file = writeAuthority(temporary, {
      status: "BLOCKED",
      current_authority: true,
      ready: false,
      consume: false,
    });
    const result = run(file);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /current authority bound BLOCKED/u);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("READY authority cannot leave public Host claims at stale recheck state", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-authority-test-"),
  );
  try {
    const file = writeAuthority(temporary, {
      status: "READY",
      current_authority: true,
      ready: true,
      consume: true,
    });
    const result = run(file);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /READY current authority requires atomically regenerated Host claims/u,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("contradictory and symlinked authority inputs fail closed", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-authority-test-"),
  );
  try {
    const contradictory = writeAuthority(temporary, {
      status: "READY",
      current_authority: false,
      ready: true,
      consume: false,
    });
    let result = run(contradictory);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /authority file is missing, unsafe, malformed/u,
    );

    if (process.platform !== "win32") {
      const linked = path.join(temporary, "linked.json");
      fs.symlinkSync(contradictory, linked);
      result = run(linked);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /authority file is missing, unsafe, malformed/u,
      );
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("broad OpenCode permissions and generic Codex auto-approval fail closed", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-permission-test-"),
  );
  try {
    let copy = copyPublicSource(temporary);
    const openCode = path.join(copy, "integrations", "opencode", "README.md");
    fs.writeFileSync(
      openCode,
      fs
        .readFileSync(openCode, "utf8")
        .replace('"*": "ask"', '"kdna_*": "allow"'),
    );
    let result = run(null, copy);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /reject broad KDNA permission wildcards/u);

    fs.rmSync(copy, { recursive: true, force: true });
    copy = copyPublicSource(temporary);
    const codex = path.join(copy, "integrations", "codex", "README.md");
    fs.writeFileSync(
      codex,
      fs
        .readFileSync(codex, "utf8")
        .replace(
          '"kdna.workspace-status",',
          '"kdna.inspect",\n  "kdna.workspace-status",',
        ),
    );
    result = run(null, copy);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /Codex auto-approved generic tool kdna\.inspect/u,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("MCP cannot regain arbitrary-path tools and the Skill cannot require three approvals", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-explicit-surface-test-"),
  );
  try {
    let copy = copyPublicSource(temporary);
    const server = path.join(copy, "mcp-server", "bin", "kdna-mcp.mjs");
    fs.writeFileSync(
      server,
      fs
        .readFileSync(server, "utf8")
        .replace(
          "const tools = [",
          'const tools = [\n  { name: "kdna.inspect", inputSchema: {} },',
        ),
    );
    let result = run(null, copy);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /MCP source does not expose exactly the matrix workspace tools/u,
    );

    fs.rmSync(copy, { recursive: true, force: true });
    copy = copyPublicSource(temporary);
    const skill = path.join(copy, "kdna-loader", "SKILL.md");
    fs.appendFileSync(
      skill,
      [
        "",
        "```bash",
        "kdna validate <file.kdna>",
        "kdna plan-load <file.kdna> --json",
        "kdna load <file.kdna> --profile=compact --as=json",
        "```",
        "",
      ].join("\n"),
    );
    result = run(null, copy);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /must not require validate, plan-load, and load as three ordinary explicit-file calls/u,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("product completion cannot be rewritten as a two-Host or Studio minimum", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-completion-contract-test-"),
  );
  try {
    const copy = copyPublicSource(temporary);
    const matrixPath = path.join(copy, "docs", "agent-support-matrix.json");
    const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
    matrix.completion_contract.single_host_consumption.minimum_qualified_hosts = 2;
    matrix.completion_contract.studio_product_integration.status =
      "recheck_required";
    fs.writeFileSync(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);
    const result = run(null, copy);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /single-Host product completion, portability benchmark, and deferred Studio integration must remain distinct/u,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("Agent guidance cannot put private attachment policy in argv with unbound yes", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kdna-attachment-argv-test-"),
  );
  try {
    const copy = copyPublicSource(temporary);
    const readme = path.join(copy, "mcp-server", "README.md");
    fs.appendFileSync(
      readme,
      "\nkdna attach file.kdna --role writing --applies-to draft --yes\n",
    );
    const result = run(null, copy);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /MCP README exposes Agent attachment role\/scope in argv with unbound --yes/u,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
