#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { readCurrentReleaseBinding } = require('./current-release-binding');
const { validateEvidenceArtifact } = require('./release-evidence');

function fail(message) { throw new Error(message); }

function publishArguments(artifact) {
  return ['publish', artifact, '--ignore-scripts', '--provenance', '--access', 'public', '--registry=https://registry.npmjs.org/'];
}

function publishCandidate({ evidence, tarball, artifactPath, bindCurrent, publish }) {
  bindCurrent(evidence);
  validateEvidenceArtifact(evidence, tarball);
  return publish(publishArguments(artifactPath));
}

function main() {
  const evidenceIndex = process.argv.indexOf('--evidence');
  const artifactIndex = process.argv.indexOf('--artifact');
  if (evidenceIndex < 0 || artifactIndex < 0 || !process.argv[evidenceIndex + 1] || !process.argv[artifactIndex + 1] || process.argv.length !== 6) {
    fail('usage: publish-verified-artifact.js --evidence <release-evidence.json> --artifact <verified.tgz>');
  }
  const evidencePath = path.resolve(process.argv[evidenceIndex + 1]);
  const artifactPath = path.resolve(process.argv[artifactIndex + 1]);
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const result = publishCandidate({
    evidence,
    tarball: fs.readFileSync(artifactPath),
    artifactPath,
    bindCurrent: (candidate) => readCurrentReleaseBinding({ root: path.resolve(__dirname, '..'), evidence: candidate }),
    publish: (args) => spawnSync('npm', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, shell: false, stdio: 'inherit' }),
  });
  if (result.error) fail(`npm publish failed: ${result.error.message}`);
  if (result.status !== 0) fail(`npm publish exited ${String(result.status)}`);
}

if (require.main === module) {
  try { main(); } catch (error) {
    console.error(`Verified artifact publication rejected: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { publishArguments, publishCandidate };
