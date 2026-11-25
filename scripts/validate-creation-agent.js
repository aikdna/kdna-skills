#!/usr/bin/env node
"use strict";
// Static packaging, routing, size-budget, reference, JSON-example, and hygiene
// checks for native 0.6.0 kdna-creator. Real Creator behavior and editorial
// adoption remain independently evaluated.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const skillRoot = path.join(root, "kdna-creator");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const ACTIVE_REFERENCES = [
  "references/co-creation-craft.md",
  "references/draft-schema-and-methods.md",
  "references/authoring-and-protection.md",
  "references/native-asset-authoring.md",
];

const RETIRED_STUDIO_FILES = [
  "kdna-creator/references/component-creation-draft.md",
  "kdna-creator/references/current-studio-binding.json",
  "kdna-creator/references/studio-protected-host.md",
  "kdna-creator/references/terminal-session.md",
  "kdna-creator/scripts/check-studio-cli-binding.mjs",
  "kdna-creator/scripts/studio-local-launcher.cjs",
  "kdna-creator/scripts/studio-local-launcher.test.cjs",
  "kdna-creator/scripts/studio-protected-host.cjs",
  "kdna-creator/scripts/studio-protected-host.test.cjs",
  "kdna-creator/scripts/fixtures/partial-write-preload.cjs",
];

const MAX_SKILL_BYTES = 7 * 1024; // 7 KB hard budget for kdna-creator/SKILL.md

const skillPath = path.join(skillRoot, "SKILL.md");
const skillBytes = fs.readFileSync(skillPath);
assert.ok(
  skillBytes.length <= MAX_SKILL_BYTES,
  `kdna-creator/SKILL.md exceeds ${MAX_SKILL_BYTES} B budget (${skillBytes.length} B)`,
);

const texts = {
  skill: skillBytes.toString("utf8"),
  contract: read("docs/KDNA_CREATION_AGENT_CONTRACT.md"),
  ...Object.fromEntries(
    ACTIVE_REFERENCES.map((rel) => [rel, read(`kdna-creator/${rel}`)]),
  ),
};

// Verify frontmatter, required references, and key native 0.6.0 routing contracts.
assert.match(texts.skill, /^---\n[\s\S]*?\bname:\s*kdna-creator\b[\s\S]*?\n---/);
for (const rel of ACTIVE_REFERENCES) {
  assert.ok(
    texts.skill.includes(`(${rel})`),
    `kdna-creator/SKILL.md missing link to (${rel})`,
  );
  assert.ok(
    texts.contract.includes(`../kdna-creator/${rel}`),
    `docs/KDNA_CREATION_AGENT_CONTRACT.md missing link to ../kdna-creator/${rel}`,
  );
}

for (const token of [
  "@aikdna/kdna-cli@0.46.0",
  "works",
  "interview",
  "research",
  ".kdna-work/",
  "Adopt / Revise / Reject",
  "kdna review",
  "kdna diff",
  "--password-env",
  "--password-prompt",
  "KDNA Reader v0.3.4",
]) {
  assert.ok(
    texts.skill.includes(token),
    `kdna-creator/SKILL.md missing required token: ${token}`,
  );
}

// Verify all relative Markdown links in SKILL.md stay within kdna-creator/ and exist.
for (const m of texts.skill.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  const href = m[1];
  if (/^https?:\/\//.test(href) || href.startsWith("#")) continue;
  const target = path.resolve(skillRoot, href.split("#")[0]);
  assert.ok(
    target.startsWith(skillRoot + path.sep) && fs.existsSync(target),
    `broken standalone skill reference: ${href}`,
  );
}

// Verify zero private machine paths, zero retired Studio traps, and valid JSON blocks.
const RETIRED_RE =
  /studio-protected-host|terminal-session\.md|current-studio-binding\.json|component-creation-draft\.md|kdna-studio-cli|kdna-studio-core/;
for (const [name, text] of Object.entries(texts)) {
  assert.ok(
    !/\/Users\/|\/private\/tmp\/|\/home\//.test(text),
    `${name} contains a private machine path`,
  );
  assert.ok(
    !RETIRED_RE.test(text),
    `${name} contains a retired Studio 0.5.0 reference`,
  );
  for (const match of text.matchAll(/```json\n([\s\S]*?)\n```/g)) {
    assert.doesNotThrow(
      () => JSON.parse(match[1]),
      `${name} has an invalid JSON fenced example`,
    );
  }
}

// Verify retired Studio 0.5.0 files are removed and native review helper stays intact.
for (const retired of RETIRED_STUDIO_FILES) {
  assert.equal(
    fs.existsSync(path.join(root, retired)),
    false,
    `retired Studio file still exists: ${retired}`,
  );
}
assert.equal(
  fs.existsSync(path.join(skillRoot, "scripts", "native-asset-review.mjs")),
  true,
  "kdna-creator/scripts/native-asset-review.mjs must remain present",
);

// Verify agent metadata, installer coverage, and top-level README links.
const metadata = read("kdna-creator/agents/openai.yaml");
assert.ok(metadata.includes("$kdna-creator"));
assert.ok(!/^(policy|dependencies):/m.test(metadata));

const installSh = read("install.sh");
for (const rel of ACTIVE_REFERENCES) {
  assert.ok(
    installSh.includes(`"kdna-creator/${rel}"`),
    `install.sh missing kdna-creator/${rel}`,
  );
}

for (const name of ["README.md", "README.zh.md"]) {
  assert.ok(read(name).includes("kdna-creator"), `${name} missing kdna-creator`);
}

console.log(
  JSON.stringify({
    status: "NATIVE_CREATOR_VALID",
    skill_bytes: skillBytes.length,
    max_skill_bytes: MAX_SKILL_BYTES,
    active_references: ACTIVE_REFERENCES.length,
    retired_studio_files_present: 0,
  }),
);
