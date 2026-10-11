import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { makeCanonicalTempRoot } from "./canonical-temp-root.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceRoot = path.resolve(packageRoot, "..");
const fixtureVersion = "1.2.3";
const lifecycle = "npm test && npm run release:check && npm run release:dependency-guard";

function shellQuote(value) {
  return "'" + value.replaceAll("'", "'\\''") + "'";
}

// Exercise npm's real lifecycle without running the entire test suite inside
// itself. Only the disposable fixture's test command and synthetic release
// coordinate change. The source prepublishOnly chain and both release guards
// are copied unchanged; the source package is never rewritten or published.
export function runReleaseLifecycleFixture({ wrongTag }) {
  const temporary = makeCanonicalTempRoot("kdna-mcp-release-lifecycle-");
  try {
    const fixtureRoot = path.join(temporary, "source");
    const fixturePackage = path.join(fixtureRoot, "mcp-server");
    fs.mkdirSync(fixturePackage, { recursive: true });
    fs.mkdirSync(path.join(fixtureRoot, "scripts"));
    fs.cpSync(path.join(packageRoot, "bin"), path.join(fixturePackage, "bin"), { recursive: true });
    const emptyHooks = path.join(temporary, "empty-hooks");
    fs.mkdirSync(emptyHooks);
    const emptyConfig = path.join(temporary, "empty-config");
    fs.writeFileSync(emptyConfig, "");
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
    assert.equal(pkg.private, true, "this fixture covers the unpublished source adapter");
    assert.equal(pkg.scripts.prepublishOnly, lifecycle);
    assert.equal(pkg.scripts["release:check"], "node ../scripts/release-check.js");
    assert.equal(pkg.scripts["release:dependency-guard"], "node ../scripts/release-dependency-guard.js");
    const fixture = {
      ...pkg,
      version: fixtureVersion,
      scripts: {
        ...pkg.scripts,
        test: `node --test --test-reporter=tap ${shellQuote(path.join(packageRoot, "test/release-pack.test.mjs"))}`,
      },
    };
    fs.writeFileSync(path.join(fixturePackage, "package.json"), JSON.stringify(fixture, null, 2) + "\n");
    fs.copyFileSync(path.join(packageRoot, "package-lock.json"), path.join(fixturePackage, "package-lock.json"));
    fs.writeFileSync(path.join(fixtureRoot, "CHANGELOG.md"), `# Changelog\n\n## ${fixtureVersion}\n\nSynthetic lifecycle test only.\n`);
    for (const name of ["release-check.js", "release-policy.js", "release-dependency-guard.js"]) {
      const original = fs.readFileSync(path.join(sourceRoot, "scripts", name));
      const destination = path.join(fixtureRoot, "scripts", name);
      fs.writeFileSync(destination, original);
      assert.deepEqual(fs.readFileSync(destination), original);
    }

    const env = {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: emptyConfig,
      GIT_CONFIG_SYSTEM: emptyConfig,
      GIT_OPTIONAL_LOCKS: "0",
      npm_config_cache: path.join(temporary, "npm-cache"),
      npm_config_userconfig: emptyConfig,
      npm_config_globalconfig: path.join(temporary, "empty-global-config"),
      npm_config_offline: "true",
    };
    fs.writeFileSync(env.npm_config_globalconfig, "");
    for (const key of ["NODE_TEST_CONTEXT", "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "npm_lifecycle_event", "npm_lifecycle_script", "npm_command"]) delete env[key];
    function git(args) {
      const result = spawnSync("git", ["-c", `core.hooksPath=${emptyHooks}`, "-c", "commit.gpgsign=false", "-c", "user.name=KDNA release test", "-c", "user.email=release-test@example.invalid", ...args], {
        cwd: fixtureRoot, env, encoding: "utf8", shell: false, timeout: 10000,
      });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout.trim();
    }
    git(["init", "--quiet"]);
    git(["add", "--", "CHANGELOG.md", "scripts", "mcp-server"]);
    git(["commit", "--quiet", "-m", "Synthetic release lifecycle fixture"]);
    git(["tag", fixtureVersion]);
    const commit = git(["rev-parse", "HEAD"]);
    assert.equal(git(["status", "--porcelain=v1", "--untracked-files=all"]), "");
    const tag = wrongTag ? `${fixtureVersion}.wrong` : fixtureVersion;
    const result = spawnSync("npm", ["publish", "--dry-run", "--offline", "--ignore-scripts=false", "--access", "public", "--registry=https://registry.npmjs.org/"], {
      cwd: fixturePackage,
      encoding: "utf8",
      env: {
        ...env,
        GITHUB_EVENT_NAME: "release",
        RELEASE_EVENT_ACTION: "published",
        RELEASE_TAG_NAME: tag,
        RELEASE_IS_DRAFT: "false",
        RELEASE_IS_PRERELEASE: "false",
        GITHUB_REF: `refs/tags/${tag}`,
        GITHUB_SHA: commit,
      },
      timeout: 60000,
      maxBuffer: 4 * 1024 * 1024,
      shell: false,
    });
    const output = `${result.stdout || ""}\n${result.stderr || ""}`;
    return {
      status: result.status,
      signal: result.signal,
      error: result.error,
      output,
      packRuns: [...output.matchAll(/^ok 1 - pack evidence independently verifies identity/gm)].length,
    };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
