'use strict';

const { validateReleaseEvidence } = require('./release-evidence');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseExactJson(text, label) {
  assert(typeof text === 'string' && text.trim(), `${label} must contain JSON`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} must be one complete JSON document`);
  }
}

function exactKeys(value, expected, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  assert(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    `${label} fields are not exact`,
  );
}

function expectedE404(evidence) {
  const spec = `${evidence.package.name}@${evidence.package.version}`;
  return {
    summary: `No match found for version ${evidence.package.version}`,
    detail:
      `The requested resource '${spec}' could not be found or you do not have permission to access it.` +
      '\n\nNote that you can also install from a\ntarball, folder, http url, or git url.',
  };
}

function isCanonicalE404Stderr(stderr, evidence) {
  if (stderr === '') return true;
  const normalized = stderr.replace(/\r\n/g, '\n').trimEnd();
  const { summary, detail } = expectedE404(evidence);
  const lines = detail.split('\n');
  const required = [
    'npm error code E404',
    `npm error 404 ${summary}`,
    'npm error 404',
    `npm error 404  ${lines[0]}`,
    'npm error 404',
    `npm error 404 ${lines[2]}`,
    `npm error 404 ${lines[3]}`,
  ];
  const actual = normalized.split('\n');
  if (actual.length === required.length + 1) {
    if (!/^npm error A complete log of this run can be found in: .+$/.test(actual.at(-1))) return false;
    actual.pop();
  }
  return JSON.stringify(actual) === JSON.stringify(required);
}

function evaluateRegistryResult(result, rawEvidence) {
  const evidence = validateReleaseEvidence(rawEvidence);
  assert(result && !result.error, `registry lookup failed: ${result?.error?.message || 'unknown error'}`);
  assert(Number.isInteger(result.status), 'registry lookup did not return an exit status');
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  assert(typeof stdout === 'string' && typeof stderr === 'string', 'registry output must be text');

  if (result.status === 1) {
    const document = parseExactJson(stdout, 'registry E404 stdout');
    exactKeys(document, ['error'], 'registry E404 document');
    exactKeys(document.error, ['code', 'summary', 'detail'], 'registry E404 error');
    const expected = expectedE404(evidence);
    assert(document.error.code === 'E404', 'registry absence requires E404');
    assert(document.error.summary === expected.summary, 'registry E404 version mismatch');
    assert(document.error.detail === expected.detail, 'registry E404 target mismatch');
    assert(isCanonicalE404Stderr(stderr, evidence), 'registry E404 stderr contains contradictory or injected output');
    return Object.freeze({ decision: 'publish', shouldPublish: true });
  }

  assert(result.status === 0, `registry lookup exited ${result.status}; refusing to publish`);
  assert(stderr === '', 'successful registry lookup wrote unexpected stderr');
  const metadata = parseExactJson(stdout, 'registry metadata stdout');
  exactKeys(metadata, ['name', 'version', 'dist.integrity', 'dist.shasum'], 'registry metadata');
  assert(metadata.name === evidence.package.name, 'published package name mismatch');
  assert(metadata.version === evidence.package.version, 'published package version mismatch');
  assert(metadata['dist.integrity'] === evidence.artifact.integrity, 'published integrity collides with this release');
  assert(metadata['dist.shasum'] === evidence.artifact.shasum, 'published shasum collides with this release');
  return Object.freeze({ decision: 'skip-identical', shouldPublish: false });
}

module.exports = { evaluateRegistryResult, expectedE404, isCanonicalE404Stderr };
