#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validatePackReport } = require('./release-evidence');

const root = path.resolve(__dirname, '..');
const packageRoot = path.join(root, 'mcp-server');

function fail(message) {
  throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
    ...options,
  });
  if (result.error) fail(`${command} failed: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} exited ${String(result.status)}: ${(result.stderr || '').trim()}`);
  return result.stdout;
}

function treeStatus() {
  return run('git', ['status', '--porcelain=v1', '--untracked-files=all']).trim();
}

function main() {
  const outIndex = process.argv.indexOf('--out');
  const artifactIndex = process.argv.indexOf('--artifact');
  if (outIndex < 0 || artifactIndex < 0 || !process.argv[outIndex + 1] || !process.argv[artifactIndex + 1] || process.argv.length !== 6) {
    fail('usage: generate-release-evidence.js --out <evidence-outside-repository> --artifact <tarball-outside-repository>');
  }
  const output = path.resolve(process.argv[outIndex + 1]);
  const artifact = path.resolve(process.argv[artifactIndex + 1]);
  for (const [label, destination] of [['release evidence', output], ['release artifact', artifact]]) {
    const relative = path.relative(root, destination);
    if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) fail(`${label} output must be outside the repository`);
  }
  if (output === artifact) fail('release evidence and artifact paths must differ');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  if (treeStatus()) fail('worktree must be clean before packing');

  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const source = { ref: process.env.GITHUB_REF, commit: run('git', ['rev-parse', 'HEAD']).trim() };
  if (process.env.GITHUB_SHA !== source.commit) fail('GITHUB_SHA must equal the packed commit');
  if (run('git', ['rev-parse', `v${pkg.version}^{commit}`]).trim() !== source.commit) fail('the package version tag must resolve to the packed commit');

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-mcp-release-pack-'));
  let complete = false;
  try {
    const reportText = run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temp], { cwd: packageRoot });
    let reports;
    try { reports = JSON.parse(reportText); } catch { fail('npm pack output was not valid JSON'); }
    if (!Array.isArray(reports) || reports.length !== 1 || !reports[0].filename) fail('npm pack did not report exactly one filename');
    const tarballPath = path.join(temp, reports[0].filename);
    const evidence = validatePackReport({ reportText, tarball: fs.readFileSync(tarballPath), pkg, source });
    fs.copyFileSync(tarballPath, artifact, fs.constants.COPYFILE_EXCL);
    if (!fs.readFileSync(artifact).equals(fs.readFileSync(tarballPath))) fail('retained release artifact differs from the verified tarball');
    fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    if (treeStatus()) fail('packing changed the repository');
    complete = true;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
    if (!complete) {
      fs.rmSync(output, { force: true });
      fs.rmSync(artifact, { force: true });
    }
  }
  console.log(`Release evidence written to ${output}; verified artifact retained at ${artifact}`);
}

try { main(); } catch (error) {
  console.error(`Release evidence rejected: ${error.message}`);
  process.exitCode = 1;
}
