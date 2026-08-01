#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireText(label, text, needle) {
  if (!text.includes(needle)) {
    failures.push(`${label} missing ${JSON.stringify(needle)}`);
  }
}

const skill = read("kdna-creator/SKILL.md");
const metadata = read("kdna-creator/agents/openai.yaml");
const contract = read("docs/KDNA_CREATION_AGENT_CONTRACT.md");
const readme = read("README.md");
const readmeZh = read("README.zh.md");

for (const [label, text, needles] of [
  ["skill", skill, [
    "name: kdna-creator",
    "natural language",
    "npx --no-install kdna-studio",
    "guide-agent --action create",
    "Do not inspect installed",
    "inventory-agent",
    "deliver-material",
    "managed test candidate",
    "finalize-agent",
    "FORMAT_VALID",
    "JUDGMENT_ACCEPTED",
    "APPLICATION_VERIFIED",
    "Creation Complete",
    "ordinary user must not manually build application plans",
    "possession of the file is sufficient to",
  ]],
  ["contract", contract, [
    "unreleased, public-safe source contract",
    "guide-agent <workspace>",
    "workflow_mode",
    "mixed-authorship",
    "content-free inventory",
    "private fd 3",
    "One complete, traceable Judgment Unit",
    "JUDGMENT_ACCEPTED",
    "FORMAT_VALID",
    "APPLICATION_VERIFIED",
    "official Host orchestration",
    "finalize-agent",
    "Host-declared remote processing",
  ]],
]) {
  for (const needle of needles) requireText(label, text, needle);
}

requireText("metadata", metadata, "$kdna-creator");
requireText("README.md", readme, "kdna-creator");
requireText("README.zh.md", readmeZh, "kdna-creator");

for (const [label, text] of [
  ["skill", skill],
  ["contract", contract],
]) {
  for (const pattern of [
    /\bhuman-assisted\b/u,
    /first content-creator slice/iu,
    /at least (?:one|1) (?:digest-bound )?(?:creator )?correction/iu,
    /stable creating Agent ID/iu,
    /ask (?:the )?user to (?:choose|provide|declare) (?:an? )?(?:mode|operation[_ -]?id|agent[_ -]?id|signing key|seed)\b/iu,
    /export-agent[^\n]*--out/iu,
    /\b(?:three[- ]seed|90% stability|at least 100)\b/iu,
    /user.{0,80}(?:four[- ]role|four signing|signing keys)/isu,
    /scan (?:the )?(?:home|global) directory/iu,
    /automatically confirm/iu,
    /forge|fabricate (?:a )?(?:human|user|organization)/iu,
    /password\s+(?:as|in)\s+(?:an?\s+)?argument/iu,
  ]) {
    if (pattern.test(text)) {
      failures.push(`${label} contains forbidden Creation narrative: ${pattern}`);
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.error(`creation agent validation failed: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log("creation agent validation passed: natural-language UX, bounded material delivery, honest gates");
