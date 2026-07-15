'use strict';

const EXPECTED_PACKAGE_NAME = '@aikdna/kdna-mcp-server';
const COMMIT_RE = /^[0-9a-f]{40}$/;
const STABLE_VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateReleaseContext({ pkg, changelog, env, git }) {
  assert(pkg && typeof pkg === 'object' && !Array.isArray(pkg), 'package.json must be an object');
  assert(pkg.name === EXPECTED_PACKAGE_NAME, `package name must be ${EXPECTED_PACKAGE_NAME}`);
  assert(STABLE_VERSION_RE.test(pkg.version), 'package version must be stable canonical SemVer');

  const version = pkg.version;
  const tag = `v${version}`;
  const expectedRef = `refs/tags/${tag}`;
  assert(env.GITHUB_EVENT_NAME === 'release', 'GITHUB_EVENT_NAME must be release');
  assert(env.RELEASE_EVENT_ACTION === 'published', 'release action must be published');
  assert(env.RELEASE_TAG_NAME === tag, `release tag must be exactly ${tag}`);
  assert(env.RELEASE_IS_DRAFT === 'false', 'draft releases cannot publish');
  assert(env.RELEASE_IS_PRERELEASE === 'false', 'prereleases cannot publish');
  assert(env.GITHUB_REF === expectedRef, `GITHUB_REF must be exactly ${expectedRef}`);
  assert(COMMIT_RE.test(env.GITHUB_SHA || ''), 'GITHUB_SHA must be a full lowercase commit');
  assert(typeof git.status === 'string' && git.status.length === 0, 'worktree must be clean');
  assert(COMMIT_RE.test(git.head || ''), 'HEAD must be a full lowercase commit');
  assert(COMMIT_RE.test(git.tagCommit || ''), 'release tag must resolve to a commit');
  assert(git.tagCommit === git.head, `${tag} must resolve to HEAD`);
  assert(env.GITHUB_SHA === git.head, 'GITHUB_SHA must equal HEAD and the release tag commit');

  const heading = new RegExp(`^## ${escapeRegExp(version)}(?: \\(\\d{4}-\\d{2}-\\d{2}\\))?$`, 'gm');
  const matches = [...changelog.matchAll(heading)];
  assert(matches.length === 1, `CHANGELOG.md must contain exactly one exact ## ${version} heading`);
  const finalized = [...changelog.matchAll(/^## (\d+\.\d+\.\d+)(?: \(\d{4}-\d{2}-\d{2}\))?$/gm)];
  assert(finalized.length > 0 && finalized[0][1] === version, `${version} must be the first finalized CHANGELOG entry`);

  return Object.freeze({ name: pkg.name, version, tag, ref: expectedRef, commit: git.head });
}

module.exports = { COMMIT_RE, EXPECTED_PACKAGE_NAME, STABLE_VERSION_RE, validateReleaseContext };
