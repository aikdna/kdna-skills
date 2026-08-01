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
  if (!text.includes(needle)) {
    failures.push(`${label} missing ${JSON.stringify(needle)}`);
  }
}

function authorityArgument() {
  const index = process.argv.indexOf("--authority-file");
  if (index < 0) return null;
  if (index !== process.argv.length - 2 || !process.argv[index + 1]) {
    failures.push(
      "usage: validate-agent-support.js [--authority-file <current.json>]",
    );
    return null;
  }
  return process.argv[index + 1];
}

function readCurrentAuthority(file) {
  if (file === null) return { supplied: false, ready: false };
  try {
    const absolute = path.resolve(file);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > 1024 * 1024) {
      throw new Error("authority file policy");
    }
    const value = JSON.parse(fs.readFileSync(absolute, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("authority document shape");
    }
    if (value.current_authority === true) {
      if (
        value.status !== matrix.authority_contract.ready_status ||
        value.ready !== true ||
        value.consume !== true
      ) {
        throw new Error("READY authority fields disagree");
      }
      return { supplied: true, ready: true };
    }
    if (
      value.current_authority !== false ||
      value.status !== "WAITING_FOR_TRUSTED_CREATION_HANDOFF" ||
      value.ready !== false ||
      value.consume !== false
    ) {
      throw new Error("non-authoritative tombstone fields disagree");
    }
    return { supplied: true, ready: false };
  } catch {
    failures.push(
      "current authority file is missing, unsafe, malformed, or inconsistent",
    );
    return { supplied: true, ready: false };
  }
}

const authority = readCurrentAuthority(authorityArgument());

if (matrix.schema_version !== 6) {
  failures.push("support matrix schema_version must be 6");
}
if (matrix.overall_status !== "recheck_required") {
  failures.push("overall adapter status must remain recheck_required");
}
if (
  JSON.stringify(matrix.candidate_runtime) !==
  JSON.stringify({
    mcp: "0.5.0",
    cli: "0.36.0",
    core: "0.21.0",
    workspace_schema: "0.3.0",
    cli_source_commit: "d85ae9346493c580f5b4176afdad9f864bc3fa6d",
    cli_source_tree: "0fd040d7aea57f6910f2af69fdd4d9095fbeeb70",
    cli_tarball_sha256:
      "aa3dd9a913b8dfc296c499a8e1267bbc6263c01396a961509593b323eabaff9a",
  })
) {
  failures.push("candidate runtime coordinates must remain exact");
}
if (
  JSON.stringify(matrix.authority_contract) !==
  JSON.stringify({
    current_authority_required_for_host_claims: true,
    current_authority_field: "current_authority",
    ready_status: "READY",
    authority_artifact_embedded: false,
  })
) {
  failures.push("current authority contract drifted");
}
if (
  JSON.stringify(matrix.evidence_dimensions) !==
  JSON.stringify({
    mcp_component_tests: "source_candidate_tested",
    public_agent_black_box_consumption: "recheck_required",
    host_delivery: "recheck_required",
    semantic_adoption: "recheck_required",
    creation_to_consumption_integration: "recheck_required",
    real_human_acceptance: "not_run",
  })
) {
  failures.push("evidence dimensions must remain explicit and non-green");
}
if (
  JSON.stringify(matrix.tool_surface) !==
  JSON.stringify({
    workspace_mcp: [
      "kdna.workspace-status",
      "kdna.workspace-resolve",
      "kdna.workspace-load",
    ],
    generic_explicit_file_mcp: "not_exposed",
    explicit_file_product_path: "official_cli_single_load",
  })
) {
  failures.push("MCP and explicit-file tool surfaces drifted");
}
if (
  JSON.stringify(matrix.processing_boundary) !==
  JSON.stringify({
    named_remote: "source_candidate_tested",
    verified_local_only: "deferred",
    plain_language_user_approval_required: true,
    machine_fields_hidden_by_host: true,
    rotatable_without_mcp_restart: true,
  })
) {
  failures.push("Host processing boundary facts drifted");
}
if (
  JSON.stringify(matrix.explicit_file_contract) !==
  JSON.stringify({
    ordinary_cli_calls: 1,
    supplemental_meaningful_approvals_min: 0,
    supplemental_meaningful_approvals_max: 1,
    persistent_state: false,
    protected_secret_approvals_max: 1,
    generic_mcp_tools_exposed: false,
  })
) {
  failures.push("explicit-file single-approval CLI contract drifted");
}
if (
  JSON.stringify(matrix.protected_path_contract) !==
  JSON.stringify({
    explicit_cli_bounded_stdin: "source_candidate_tested",
    workspace_mcp_component_boundary: "source_candidate_tested",
    codex_native_model_hidden_provider: "deferred",
    opencode_native_model_hidden_provider: "deferred",
    manual_user_authorization_file: "not_a_supported_user_flow",
    ordinary_unencrypted_path_independent: true,
  })
) {
  failures.push("protected Host path must remain distinct from ordinary support");
}
if (
  JSON.stringify(matrix.completion_contract) !==
  JSON.stringify({
    single_host_consumption: {
      minimum_qualified_hosts: 1,
      status: "recheck_required",
    },
    portability_benchmark: {
      host_ids: ["codex", "opencode"],
      status: "recheck_required",
      product_minimum: false,
    },
    studio_product_integration: {
      status: "deferred",
      product_minimum: false,
    },
  })
) {
  failures.push(
    "single-Host product completion, portability benchmark, and deferred Studio integration must remain distinct",
  );
}
if (authority.ready) {
  failures.push(
    "a READY current authority requires atomically regenerated Host claims and matrix evidence",
  );
}

const rootReadme = read("README.md");
const zhReadme = read("README.zh.md");
const skill = read(matrix.loader_skill);
const contract = read("docs/KDNA_LOADER_CONTRACT.md");
const mcpReadme = read("mcp-server/README.md");
const mcpServer = read("mcp-server/bin/kdna-mcp.mjs");
const installer = read("install.sh");
const codexGuide = read("integrations/codex/README.md");
const openCodeGuide = read("integrations/opencode/README.md");

requireText("README.md", rootReadme, "RECHECK_REQUIRED");
requireText("README.zh.md", zhReadme, "RECHECK_REQUIRED");
requireText("SKILL.md", skill, "one explicit KDNA judgment asset");
requireText(
  "SKILL.md",
  skill,
  "Do not scan directories or a global asset store",
);
requireText("SKILL.md", skill, "kdna.workspace-load");
requireText("SKILL.md", skill, "Do not hide whether KDNA was used");
requireText("SKILL.md", skill, "meaningful use-once approval");
requireText("SKILL.md", skill, "kdna load <file.kdna>");
requireText("SKILL.md", skill, "zero or one supplemental meaningful confirmation");
requireText("SKILL.md", skill, "do not ask again");
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
requireText("contract", contract, "RECHECK_REQUIRED");
requireText("MCP README", mcpReadme, "RECHECK_REQUIRED");
requireText("MCP README", mcpReadme, "component tests");
for (const exactTool of [
  "kdna.workspace-status",
  "kdna.workspace-resolve",
  "kdna.workspace-load",
]) {
  requireText("Codex guide", codexGuide, `"${exactTool}"`);
}
for (const exactTool of [
  "kdna_kdna_workspace-status",
  "kdna_kdna_workspace-resolve",
  "kdna_kdna_workspace-load",
]) {
  requireText("OpenCode guide", openCodeGuide, `"${exactTool}": "allow"`);
}
for (const [label, guide] of [
  ["Codex guide", codexGuide],
  ["OpenCode guide", openCodeGuide],
]) {
  requireText(label, guide, "KDNA_MCP_WORKSPACE_ROOT");
  requireText(label, guide, "project-private");
  requireText(label, guide, "Protected workspace loading is currently `DEFERRED`");
  requireText(label, guide, "Do not ask a user to handcraft");
}
if (/"kdna_\*"\s*:/u.test(openCodeGuide)) {
  failures.push("OpenCode guide must reject broad KDNA permission wildcards");
}
const codexEnabledTools =
  codexGuide.match(/enabled_tools\s*=\s*\[([\s\S]*?)\]/u)?.[1] || "";
for (const genericTool of [
  "kdna.inspect",
  "kdna.verify",
  "kdna.plan-load",
  "kdna.load",
]) {
  if (codexEnabledTools.includes(`"${genericTool}"`)) {
    failures.push(`Codex auto-approved generic tool ${genericTool}`);
  }
}
if (/"tools"\s*:/u.test(openCodeGuide)) {
  failures.push("OpenCode guide must not recommend the deprecated tools map");
}
for (const genericTool of [
  "kdna_kdna_inspect",
  "kdna_kdna_verify",
  "kdna_kdna_plan-load",
  "kdna_kdna_load",
]) {
  if (openCodeGuide.includes(`"${genericTool}"`)) {
    failures.push(`OpenCode guide exposes generic tool ${genericTool}`);
  }
}
const toolArrayStart = mcpServer.indexOf("const tools = [");
const toolArrayEnd = mcpServer.indexOf(
  "const toolDefinitions",
  toolArrayStart,
);
const advertisedTools = [
  ...mcpServer
    .slice(toolArrayStart, toolArrayEnd)
    .matchAll(/name:\s*"([^"]+)"/gu),
].map((match) => match[1]);
if (
  JSON.stringify(advertisedTools) !==
  JSON.stringify(matrix.tool_surface.workspace_mcp)
) {
  failures.push("MCP source does not expose exactly the matrix workspace tools");
}
if (
  /kdna validate <file\.kdna>[\s\S]{0,500}kdna plan-load <file\.kdna>[\s\S]{0,500}kdna load <file\.kdna>/u.test(
    skill,
  )
) {
  failures.push(
    "Skill must not require validate, plan-load, and load as three ordinary explicit-file calls",
  );
}

for (const [label, text] of [
  ["README.md", rootReadme],
  ["README.zh.md", zhReadme],
  ["SKILL.md", skill],
  ["MCP README", mcpReadme],
  ["Codex guide", codexGuide],
  ["OpenCode guide", openCodeGuide],
  ["install.sh", installer],
]) {
  if (
    /--role[\s\S]{0,240}--applies-to[\s\S]{0,240}--yes/iu.test(text) ||
    /--applies-to[\s\S]{0,240}--role[\s\S]{0,240}--yes/iu.test(text)
  ) {
    failures.push(
      `${label} exposes Agent attachment role/scope in argv with unbound --yes`,
    );
  }
}

const forbiddenCurrentClaims = [
  /Codex and OpenCode verified/iu,
  /Codex 与 OpenCode 已验证/iu,
  /source candidate verified/iu,
  /two-Host-verified/iu,
  /当前完整候选.{0,20}(?:已验证|verified)/iu,
];
for (const [label, text] of [
  ["README.md", rootReadme],
  ["README.zh.md", zhReadme],
  ["contract", contract],
  ["MCP README", mcpReadme],
  ["Codex guide", read("integrations/codex/README.md")],
  ["OpenCode guide", openCodeGuide],
]) {
  for (const pattern of forbiddenCurrentClaims) {
    if (pattern.test(text)) {
      failures.push(`${label} contains a stale current Host claim: ${pattern}`);
    }
  }
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
    if (pattern.test(text)) {
      failures.push(
        `${label} contains forbidden autonomous-loader claim: ${pattern}`,
      );
    }
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
    { support: "recheck_required", coordinate: "0.144.3", adapter: "mcp" },
  ],
  ["claude-code", { support: "unassessed", coordinate: null, adapter: null }],
  [
    "opencode",
    { support: "recheck_required", coordinate: "1.18.10", adapter: "mcp" },
  ],
  ["cursor", { support: "unassessed", coordinate: null, adapter: null }],
  [
    "copilot-compatible",
    { support: "unassessed", coordinate: null, adapter: null },
  ],
]);
const ids = new Set();
const benchmarkHostIds = new Set(
  matrix.completion_contract?.portability_benchmark?.host_ids || [],
);
for (const agent of matrix.agents || []) {
  if (ids.has(agent.id)) failures.push(`duplicate agent id: ${agent.id}`);
  ids.add(agent.id);
  const wanted = expected.get(agent.id);
  if (!wanted) {
    failures.push(`unexpected agent id: ${agent.id}`);
    continue;
  }
  if (agent.support !== wanted.support) {
    failures.push(`${agent.id}: support drift`);
  }
  if (agent.benchmark_coordinate !== wanted.coordinate) {
    failures.push(`${agent.id}: benchmark coordinate drift`);
  }
  if (agent.adapter !== wanted.adapter) {
    failures.push(`${agent.id}: adapter drift`);
  }
  const guidePath = path.join(root, agent.guide);
  if (!fs.existsSync(guidePath)) {
    failures.push(`${agent.id}: missing guide ${agent.guide}`);
    continue;
  }
  const guide = fs.readFileSync(guidePath, "utf8");
  requireText(agent.guide, guide, agent.skill_path);
  requireText(agent.guide, guide, "disable/switch/rollback");
  if (agent.support === "recheck_required") {
    requireText(agent.guide, guide, "RECHECK_REQUIRED");
    requireText(agent.guide, guide, "workspace-load");
    requireText(agent.guide, guide, agent.benchmark_coordinate);
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

if (ids.size !== expected.size) {
  failures.push("support matrix agent set is incomplete");
}
for (const hostId of benchmarkHostIds) {
  const agent = matrix.agents.find((candidate) => candidate.id === hostId);
  if (!agent || agent.support !== "recheck_required") {
    failures.push(
      `${hostId}: portability benchmark must remain recheck_required`,
    );
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(
    `agent support validation failed: ${failures.length} failure(s)`,
  );
  process.exit(1);
}

console.log(
  `agent support validation passed: component-tested source candidate; single-Host product minimum distinct from ${benchmarkHostIds.size}-Host portability benchmark RECHECK_REQUIRED; current authority ${authority.supplied ? "bound non-READY" : "not supplied"}`,
);
