#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const matrix = JSON.parse(
  fs.readFileSync(path.join(root, "docs", "agent-support-matrix.json"), "utf8"),
);
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireText(label, text, needle) {
  if (!text.includes(needle))
    failures.push(`${label} missing ${JSON.stringify(needle)}`);
}

if (matrix.schema_version !== 3)
  failures.push("support matrix schema_version must be 3");
if (matrix.overall_status !== "source_candidate_two_host_verified") {
  failures.push(
    "overall adapter status must be source_candidate_two_host_verified",
  );
}
if (
  JSON.stringify(matrix.candidate_runtime) !==
  JSON.stringify({
    mcp: "0.5.0",
    cli: "0.36.0",
    core: "0.21.0",
    workspace_schema: "0.1.0",
  })
) {
  failures.push("candidate runtime coordinates must remain exact");
}

const rootReadme = read("README.md");
const zhReadme = read("README.zh.md");
const skill = read(matrix.loader_skill);
const contract = read("docs/KDNA_LOADER_CONTRACT.md");
const mcpReadme = read("mcp-server/README.md");
const mcpServer = read("mcp-server/bin/kdna-mcp.mjs");
const installer = read("install.sh");
const openCodeGuide = read("integrations/opencode/README.md");

requireText("README.md", rootReadme, "Codex and OpenCode verified");
requireText("README.zh.md", zhReadme, "Codex 与 OpenCode 已验证");
requireText("SKILL.md", skill, "one explicit KDNA judgment asset");
requireText(
  "SKILL.md",
  skill,
  "Do not scan directories or a global asset store",
);
requireText("SKILL.md", skill, "kdna.workspace-load");
requireText("SKILL.md", skill, "Do not hide whether KDNA was used");
requireText(
  "contract",
  contract,
  "Host attachment already approved by the user",
);
requireText(
  "contract",
  contract,
  "resolver's `load`, `ask`, `skip`, or `block`",
);
requireText(
  "MCP README",
  mcpReadme,
  "independent Codex and OpenCode MCP configurations",
);
requireText("OpenCode guide", openCodeGuide, '"kdna_*": "allow"');
if (/"tools"\s*:/u.test(openCodeGuide)) {
  failures.push("OpenCode guide must not recommend the deprecated tools map");
}

const forbiddenClaims = [
  /apply KDNA silently/iu,
  /user (?:should )?see(?:s)? better judgment/iu,
  /automatically decides per task/iu,
  /discover installed KDNA/iu,
];

for (const [label, text] of [
  ["README.md", rootReadme],
  ["README.zh.md", zhReadme],
  ["SKILL.md", skill],
  ["contract", contract],
  ["MCP README", mcpReadme],
]) {
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text))
      failures.push(
        `${label} contains forbidden autonomous-loader claim: ${pattern}`,
      );
  }
}

for (const forbiddenSurface of [
  "name: 'kdna.available-local'",
  "name: 'kdna.match'",
  "name: 'kdna.attach'",
  "name: 'kdna.disable'",
  "entitlementStatus",
  "hasPassword",
  "password: { type: 'string' }",
]) {
  if (mcpServer.includes(forbiddenSurface)) {
    failures.push(
      `MCP source contains forbidden surface ${JSON.stringify(forbiddenSurface)}`,
    );
  }
}
if (/--all|detect_agents|rm -rf/u.test(installer)) {
  failures.push(
    "installer must not detect Hosts, install all, or delete legacy files",
  );
}
for (const hostFlag of [
  "--codex",
  "--claude",
  "--opencode",
  "--cursor",
  "--copilot",
]) {
  requireText("install.sh", installer, hostFlag);
}

const expected = new Map([
  [
    "codex",
    {
      support: "source_candidate_verified",
      version: "0.144.3",
      adapter: "mcp",
    },
  ],
  ["claude-code", { support: "unassessed", version: null, adapter: null }],
  [
    "opencode",
    { support: "source_candidate_verified", version: "1.18.4", adapter: "mcp" },
  ],
  ["cursor", { support: "unassessed", version: null, adapter: null }],
  [
    "copilot-compatible",
    { support: "unassessed", version: null, adapter: null },
  ],
]);
const ids = new Set();
let verifiedCount = 0;
for (const agent of matrix.agents || []) {
  if (ids.has(agent.id)) failures.push(`duplicate agent id: ${agent.id}`);
  ids.add(agent.id);
  const wanted = expected.get(agent.id);
  if (!wanted) {
    failures.push(`unexpected agent id: ${agent.id}`);
    continue;
  }
  if (agent.support !== wanted.support)
    failures.push(`${agent.id}: support drift`);
  if (agent.verified_host_version !== wanted.version)
    failures.push(`${agent.id}: version drift`);
  if (agent.adapter !== wanted.adapter)
    failures.push(`${agent.id}: adapter drift`);
  if (agent.support === "source_candidate_verified") verifiedCount += 1;

  const guidePath = path.join(root, agent.guide);
  if (!fs.existsSync(guidePath)) {
    failures.push(`${agent.id}: missing guide ${agent.guide}`);
    continue;
  }
  const guide = fs.readFileSync(guidePath, "utf8");
  requireText(agent.guide, guide, agent.skill_path);
  requireText(agent.guide, guide, "disable/switch/rollback");
  if (agent.support === "source_candidate_verified") {
    requireText(agent.guide, guide, "source candidate verified");
    requireText(agent.guide, guide, "workspace-load");
    requireText(agent.guide, guide, agent.verified_host_version);
  } else {
    requireText(agent.guide, guide, "Unassessed");
    requireText(agent.guide, guide, "kdna plan-load ./judgment.kdna --json");
  }
  for (const pattern of forbiddenClaims) {
    if (pattern.test(guide)) {
      failures.push(
        `${agent.guide} contains forbidden autonomous-loader claim: ${pattern}`,
      );
    }
  }
}

if (ids.size !== expected.size)
  failures.push("support matrix agent set is incomplete");
if (verifiedCount !== 2)
  failures.push("exactly two real Hosts must be source-candidate verified");

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(
    `agent support validation failed: ${failures.length} failure(s)`,
  );
  process.exit(1);
}

console.log(
  `agent support validation passed: ${verifiedCount} verified MCP Hosts; ${matrix.agents.length - verifiedCount} unassessed placements`,
);
