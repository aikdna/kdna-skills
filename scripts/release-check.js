#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { validateReleaseContext } = require('./release-policy');

const root = path.resolve(__dirname, '..');
const packageRoot = path.join(root, 'mcp-server');
const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

try {
  const tag = pkg.version;
  const context = validateReleaseContext({
    pkg,
    changelog,
    env: process.env,
    git: {
      status: git(['status', '--porcelain=v1', '--untracked-files=all']),
      head: git(['rev-parse', 'HEAD']),
      tagCommit: git(['rev-parse', `${tag}^{commit}`]),
    },
  });
  console.log(`Release context verified: ${context.name}@${context.version} ${context.commit}`);
} catch (error) {
  console.error(`Release context rejected: ${error.message}`);
  process.exitCode = 1;
}
