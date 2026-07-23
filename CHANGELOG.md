# Changelog

## 0.5.0 (2026-07-22)

- Replace global discovery and task-ranking tools with a thin workspace
  status/resolver/load adapter that consumes only user-approved attachments.
- Delegate every file and workspace operation to the exact merged
  `@aikdna/kdna-cli@0.36.0` candidate and its single
  `@aikdna/kdna-core@0.21.0` runtime; the MCP package no longer implements
  parallel Core logic.
- Re-pin the retained CLI candidate after one-shot explicit-file loading became
  state-free by default and opt-in audit receipts stopped exposing source
  paths; the MCP tool surface and workspace schema are unchanged.
- Remove password, password-presence, and caller-supplied entitlement inputs
  from MCP so credentials cannot enter tool arguments or logs and callers
  cannot manufacture authorization.
- Make `load`, `ask`, `skip`, and `block` visible with exact identity, version,
  digest, scope, reason, authorization, integrity, and CLI control commands.
- Add hostile tests for unapproved global files, attachment conflicts,
  corrupted snapshots, nested and simultaneous workspaces, immutable records,
  pinned runtime execution, Host-root escapes, sterile errors, and private
  task-file cleanup.
- Verify the same approved workspace through real Codex `0.144.3` and OpenCode
  `1.18.4` MCP sessions: both reported the same identity, digest, scope,
  authorization, integrity, load reason, Capsule type, and out-of-scope skip.
- Make the Skill installer require exactly one explicitly selected Host; remove
  Host detection, install-all behavior, and automatic legacy-file deletion.
- Keep this checkpoint candidate-only. Registry publication remains blocked
  until the exact CLI and Core dependencies are independently published and
  the release lock is regenerated from official registry artifacts.

## 0.4.2 (2026-07-15)

- Bind MCP discovery, authorization planning, verification, matching, and
  Runtime Capsule loading to the published KDNA Core 0.20.0 registry artifact
  while keeping the six-tool surface and the loader's conservative defaults.
  Core 0.20.0 is a formal registry release; MCP 0.4.2 remains a source
  checkpoint until its own publication.
- Use the current container, payload-profile, Runtime Capsule, and KDNA Agent
  Host compatibility coordinates. The MCP bridge returns a Capsule but does
  not claim Host execution or fabricate receipts or Judgment Traces.
- Fail closed when an official CLI fallback exits unexpectedly or returns an
  invalid LoadPlan, and isolate malformed local assets during discovery.
- Add exact Core-candidate, current-name, packed-artifact, hostile-input, and
  immutable-workflow gates for the source checkpoint.
- Honor `maxDepth: 0` as a root-only local inventory, constrain depth to
  non-negative integers, return canonical JSON-RPC protocol errors, and report
  tool execution failures through MCP `isError` results.
- Bind future npm publication to one stable GitHub Release, its exact tag and
  commit, a clean source tree, the finalized changelog entry, and the exact
  independently verified tarball with provenance.
- Fail closed on registry lookup, authentication, timeout, malformed output,
  or an existing-version artifact collision; only a target-bound E404 may
  authorize a new publication.

## 2026-07 (MCP v0.4.1)

- Run MCP asset discovery, LoadPlan authorization, and Runtime Capsule loading
  on KDNA Core 0.17.0 so current hosts do not execute a nested Core 0.16 copy.
- Revalidate local discovery, credential forwarding, Core planning, official
  CLI fallback, and JSON-RPC error identity against the current Core runtime.

## 2026-07 (MCP v0.4.0)

- Remove the hidden legacy `kdna.available` MCP method so the advertised tool
  list and callable surface are identical.
- Preserve JSON-RPC request IDs on tool failures and pass password and
  entitlement inputs through the current `kdna.load` contract.
- Make MCP release readiness reject dirty inputs and version tags that do not
  point to the current commit.
- Align MCP loading with KDNA Core 0.16.0 and the current account/device
  entitlement and Runtime Capsule contract.

## 2026-07 (MCP v0.3.1; superseded by 0.5.0 visibility contract)

- Make silent application a hard loader rule after local Codex, Claude Code,
  and OpenCode field validation found that one Agent disclosed the asset even
  when the user explicitly requested no tool narration.

## 2026-07 (MCP v0.3.0)

- Move the MCP server to the single current Core API and CBOR fixtures.
- Return Runtime Capsules instead of reading or rendering raw payload content.
- Rewrite the loader contract around toolchain-only parsing, single-asset
  default, and explicit Cluster mode.

## 2026-06

- kdna-loader skill updated for the packaged KDNA runtime.
- install script updated to install @aikdna/kdna-cli.

## 2026-06 (v0.2.4)

- MCP server: add prepublishOnly gate with release-check.
- Add CODEOWNERS, DCO, CI workflow.
- Shell script linting fixes.

## 2026-05 (v0.2.0)

- Initial public release of kdna-loader skill and MCP server.
- Cross-agent support: Claude Code, Codex, OpenCode, Cursor.
