#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageRoot = path.join(root, 'mcp-server');
const checks = [
  ['npm', ['ci', '--ignore-scripts'], packageRoot],
  ['npm', ['test'], packageRoot],
  ['npm', ['pack', '--dry-run', '--ignore-scripts'], packageRoot],
  ['git', ['diff', '--check'], root],
];

for (const [command, args, cwd] of checks) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

console.log('\nKDNA MCP release preflight passed');
