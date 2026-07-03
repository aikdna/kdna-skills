#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const matrixPath = path.join(root, 'docs', 'agent-support-matrix.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function requireText(label, text, needle) {
  if (!text.includes(needle)) fail(`${label} missing ${JSON.stringify(needle)}`);
}

if (matrix.schema_version !== 1) fail('agent-support-matrix.json schema_version must be 1');
if (!exists(matrix.loader_skill)) fail(`loader skill missing: ${matrix.loader_skill}`);
if (!exists(matrix.mcp_server)) fail(`MCP server directory missing: ${matrix.mcp_server}`);

const rootReadme = read('README.md');
const zhReadme = read('README.zh.md');
const loaderSkill = read(matrix.loader_skill);
const mcpReadme = read('mcp-server/README.md');

requireText('README.md', rootReadme, 'docs/agent-support-matrix.json');
requireText('README.zh.md', zhReadme, 'docs/agent-support-matrix.json');
requireText('README.md', rootReadme, 'auto-detected where supported');
requireText('README.zh.md', zhReadme, '支持自动检测时');
requireText('kdna-loader/SKILL.md', loaderSkill, '## Part 1');
requireText('kdna-loader/SKILL.md', loaderSkill, '## Part 8');
requireText('mcp-server/README.md', mcpReadme, '8-part protocol');

const allowedSupport = new Set(['auto-detected', 'best-effort', 'manual-compatible']);
const ids = new Set();

for (const agent of matrix.agents || []) {
  if (ids.has(agent.id)) fail(`duplicate agent id: ${agent.id}`);
  ids.add(agent.id);

  if (!allowedSupport.has(agent.support)) fail(`${agent.id}: unsupported support value ${agent.support}`);
  if (!agent.guide || !exists(agent.guide)) fail(`${agent.id}: guide missing: ${agent.guide}`);

  const guide = exists(agent.guide) ? read(agent.guide) : '';
  const guideDir = path.dirname(agent.guide);
  const readmeName = agent.name === 'GitHub Copilot-compatible agents' ? 'GitHub Copilot' : agent.name;
  const zhName = agent.name === 'GitHub Copilot-compatible agents' ? agent.name : readmeName;

  requireText('README.md', rootReadme, `| **${readmeName}** | \`${agent.skill_path}\` | [Setup guide →](${guideDir}/) |`);
  requireText('README.zh.md', zhReadme, `**${zhName}**`);
  requireText(agent.guide, guide, agent.skill_path);
  requireText(agent.guide, guide, 'kdna demo judgment ./judgment');
  requireText(agent.guide, guide, 'kdna plan-load ./judgment.kdna --json');
  requireText(agent.guide, guide, 'kdna load ./judgment.kdna --profile=compact --as=prompt');

  if (agent.support === 'auto-detected') {
    requireText(agent.guide, guide, 'kdna setup');
    if (agent.setup_flag) requireText(agent.guide, guide, agent.setup_flag);
  }

  if (agent.support === 'manual-compatible') {
    if (/auto-detects|auto-detected/i.test(guide)) {
      fail(`${agent.id}: manual-compatible guide must not claim auto-detection`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(`agent support validation failed: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log(`agent support validation passed: ${matrix.agents.length} agent(s)`);
