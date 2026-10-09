#!/usr/bin/env node
'use strict';

// The protection Host pins five file digests of the exact Studio CLI it will
// load (CLI_FILES in studio-protected-host.cjs) and refuses anything else with
// HOST_CLI_BINDING_MISMATCH. Those pins are a copy of published bytes, so they
// can silently go stale when the Studio CLI is re-published. This check compares
// them with the bytes the public registry actually serves for the pinned
// coordinate, and fails when they disagree.
//
// usage: node check-studio-cli-binding.mjs [--coordinate <name@version>]
//
// Requires npm and tar. It reads only the public registry.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REGISTRY = 'https://registry.npmjs.org/';
const DEFAULT_COORDINATE = '@aikdna/kdna-studio-cli@0.13.0-rc.components.2';
const hostScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'studio-protected-host.cjs');

function pinnedFiles() {
  const source = fs.readFileSync(hostScript, 'utf8');
  const block = source.match(/const CLI_FILES = Object\.freeze\(\{([\s\S]*?)\n\}\);/u);
  if (!block) throw new Error('CLI_FILES block not found in studio-protected-host.cjs');
  const pins = new Map();
  for (const line of block[1].split('\n')) {
    const entry = line.match(/'([^']+)':\s*\{sha256:'([0-9a-f]{64})',mode:0o(\d+)\}/u);
    if (entry) pins.set(entry[1], { sha256: entry[2], mode: Number.parseInt(entry[3], 8) });
  }
  if (pins.size === 0) throw new Error('CLI_FILES block declared no pins');
  return pins;
}

function publishedFiles(coordinate) {
  const work = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'studio-cli-binding-'));
  try {
    const packed = execFileSync('npm', [
      'pack', coordinate,
      '--pack-destination', work,
      '--silent',
      '--no-audit',
      '--no-fund',
      `--registry=${REGISTRY}`,
      `--@aikdna:registry=${REGISTRY}`,
    ], { encoding: 'utf8' });
    const tarball = path.join(work, packed.trim().split('\n').pop());
    execFileSync('tar', ['-xzf', tarball, '-C', work, 'package']);
    return { work, root: path.join(work, 'package') };
  } catch (error) {
    throw new Error(`could not obtain ${coordinate}: ${error.message}`);
  }
}

function main(argv = process.argv.slice(2)) {
  const index = argv.indexOf('--coordinate');
  const coordinate = index === -1 ? DEFAULT_COORDINATE : argv[index + 1];
  if (index !== -1 && !coordinate) throw new Error('--coordinate needs a value');
  const pins = pinnedFiles();
  const { work, root } = publishedFiles(coordinate);
  const findings = [];
  try {
    for (const [file, pin] of pins) {
      const target = path.join(root, file);
      if (!fs.existsSync(target)) {
        findings.push(`${file}: absent from the published package`);
        continue;
      }
      const bytes = fs.readFileSync(target);
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const mode = fs.lstatSync(target).mode & 0o777;
      if (sha256 !== pin.sha256) findings.push(`${file}: pinned ${pin.sha256} but published ${sha256}`);
      if (mode !== pin.mode) findings.push(`${file}: pinned mode ${pin.mode.toString(8)} but published ${mode.toString(8)}`);
    }
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
  if (findings.length > 0) {
    console.error(`studio CLI binding check failed for ${coordinate}`);
    for (const finding of findings) console.error(`  ${finding}`);
    return 1;
  }
  console.log(`studio CLI binding check passed: ${pins.size} pinned files match ${coordinate}`);
  return 0;
}

process.exitCode = main();
