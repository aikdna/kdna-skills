#!/usr/bin/env node
'use strict';
// Retirement-coordinate publication. Mirrors scripts/publish-verified-artifact.js
// for the mcp-server-retired package: it re-validates the retained evidence and
// tarball bytes, binds them to the current clean checkout (the package version
// tag must resolve to HEAD), and only then publishes that exact tarball. The
// npm credentials come from the caller's environment (a mode-0600 temporary
// userconfig); this script never reads, writes, or prints credential material,
// and it never prints provider error bodies.

const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { validateReleaseEvidence, validateEvidenceArtifact } = require('./release-evidence');

const root = path.resolve(__dirname, '..');

function fail(message) { throw new Error(message); }

function bindCurrentRetired({ evidence, git }) {
  if (git(['status', '--porcelain=v1', '--untracked-files=all']) !== '') fail('worktree must be clean');
  const head = git(['rev-parse', 'HEAD']);
  if (head !== evidence.source.commit) fail('the retirement commit must be HEAD');
  if (git(['rev-parse', `${evidence.package.version}^{commit}`]) !== head) fail('the package version tag must resolve to HEAD');
  return evidence;
}

function publishArguments(artifact) {
  return ['publish', artifact, '--ignore-scripts', '--access', 'public', '--registry=https://registry.npmjs.org/'];
}

function publishRetiredCandidate({ evidence, tarball, artifactPath, bindCurrent, publish }) {
  validateReleaseEvidence(evidence);
  bindCurrent(evidence);
  validateEvidenceArtifact(evidence, tarball);
  return publish(publishArguments(artifactPath));
}

function main() {
  const evidenceIndex = process.argv.indexOf('--evidence');
  const artifactIndex = process.argv.indexOf('--artifact');
  if (evidenceIndex < 0 || artifactIndex < 0 || !process.argv[evidenceIndex + 1] || !process.argv[artifactIndex + 1] || process.argv.length !== 6) {
    fail('usage: publish-retired-artifact.js --evidence <retirement-evidence.json> --artifact <verified.tgz>');
  }
  const evidencePath = path.resolve(process.argv[evidenceIndex + 1]);
  const artifactPath = path.resolve(process.argv[artifactIndex + 1]);
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const result = publishRetiredCandidate({
    evidence,
    tarball: fs.readFileSync(artifactPath),
    artifactPath,
    bindCurrent: (candidate) => bindCurrentRetired({
      evidence: candidate,
      git: (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(),
    }),
    publish: (args) => spawnSync('npm', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, shell: false, stdio: 'inherit' }),
  });
  if (result.error) fail(`npm publish failed: ${result.error.message}`);
  if (result.status !== 0) fail(`npm publish exited ${String(result.status)}`);
}

if (require.main === module) {
  try { main(); } catch (error) {
    console.error(`Retirement publication rejected: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { bindCurrentRetired, publishArguments, publishRetiredCandidate };
