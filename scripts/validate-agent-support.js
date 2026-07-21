#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'agent-support-matrix.json'), 'utf8'));
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function requireText(label, text, needle) {
  if (!text.includes(needle)) failures.push(`${label} missing ${JSON.stringify(needle)}`);
}

if (matrix.schema_version !== 2) failures.push('support matrix schema_version must be 2');
if (matrix.overall_status !== 'unassessed') failures.push('overall adapter status must be unassessed');

const rootReadme = read('README.md');
const zhReadme = read('README.zh.md');
const skill = read(matrix.loader_skill);
const contract = read('docs/KDNA_LOADER_CONTRACT.md');

requireText('README.md', rootReadme, '**Unassessed**');
requireText('README.zh.md', zhReadme, '**Unassessed（未评估）**');
requireText('SKILL.md', skill, 'one explicit KDNA judgment asset');
requireText('SKILL.md', skill, 'Do not scan directories or a global asset store');
requireText('SKILL.md', skill, 'Do not hide whether KDNA was used');
requireText('contract', contract, 'Host attachment already approved by the user');

const forbidden = [
  /apply KDNA silently/i,
  /user (?:should )?see(?:s)? better judgment/i,
  /automatically decides per task/i,
  /discover installed KDNA/i
];

for (const [label, text] of [['README.md', rootReadme], ['README.zh.md', zhReadme], ['SKILL.md', skill], ['contract', contract]]) {
  for (const pattern of forbidden) {
    if (pattern.test(text)) failures.push(`${label} contains forbidden autonomous-loader claim: ${pattern}`);
  }
}

const ids = new Set();
for (const agent of matrix.agents || []) {
  if (ids.has(agent.id)) failures.push(`duplicate agent id: ${agent.id}`);
  ids.add(agent.id);
  if (agent.support !== 'unassessed') failures.push(`${agent.id}: support must remain unassessed`);
  const guidePath = path.join(root, agent.guide);
  if (!fs.existsSync(guidePath)) {
    failures.push(`${agent.id}: missing guide ${agent.guide}`);
    continue;
  }
  const guide = fs.readFileSync(guidePath, 'utf8');
  requireText(agent.guide, guide, 'Unassessed');
  requireText(agent.guide, guide, agent.skill_path);
  requireText(agent.guide, guide, 'kdna plan-load ./judgment.kdna --json');
  requireText(agent.guide, guide, 'disable/switch/rollback');
  for (const pattern of forbidden) {
    if (pattern.test(guide)) failures.push(`${agent.guide} contains forbidden autonomous-loader claim: ${pattern}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(`agent support validation failed: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log(`agent support validation passed: ${matrix.agents.length} unassessed adapter placement(s)`);
