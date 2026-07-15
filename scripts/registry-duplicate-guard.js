#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { readCurrentReleaseBinding } = require('./current-release-binding');
const { evaluateRegistryResult } = require('./registry-duplicate-policy');
const { validateEvidenceArtifact } = require('./release-evidence');

function fail(message) { throw new Error(message); }

function guardCandidate({ evidence, tarball, bindCurrent, lookup }) {
  bindCurrent(evidence);
  validateEvidenceArtifact(evidence, tarball);
  return evaluateRegistryResult(lookup(`${evidence.package.name}@${evidence.package.version}`), evidence);
}

function main() {
  const evidenceIndex = process.argv.indexOf('--evidence');
  const artifactIndex = process.argv.indexOf('--artifact');
  if (evidenceIndex < 0 || artifactIndex < 0 || !process.argv[evidenceIndex + 1] || !process.argv[artifactIndex + 1] || process.argv.length !== 6) {
    fail('usage: registry-duplicate-guard.js --evidence <release-evidence.json> --artifact <verified.tgz>');
  }
  const evidence = JSON.parse(fs.readFileSync(path.resolve(process.argv[evidenceIndex + 1]), 'utf8'));
  const decision = guardCandidate({
    evidence,
    tarball: fs.readFileSync(path.resolve(process.argv[artifactIndex + 1])),
    bindCurrent: (candidate) => readCurrentReleaseBinding({ root: path.resolve(__dirname, '..'), evidence: candidate }),
    lookup: (spec) => spawnSync('npm', [
      'view', spec, 'name', 'version', 'dist.integrity', 'dist.shasum', '--json',
      '--loglevel=silent', '--registry=https://registry.npmjs.org/',
    ], { encoding: 'utf8', maxBuffer: 1024 * 1024, shell: false, timeout: 30_000 }),
  });
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `should_publish=${decision.shouldPublish ? 'true' : 'false'}\ndecision=${decision.decision}\n`);
  }
  console.log(`Registry duplicate policy: ${decision.decision}`);
}

if (require.main === module) {
  try { main(); } catch (error) {
    console.error(`Registry duplicate policy rejected: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { guardCandidate };
