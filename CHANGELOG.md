# Changelog

## 0.8.4 (2026-11-24)

- Fix `kdna.catalog` `budget_bytes` trap in `@aikdna/kdna-mcp-server@0.8.4`
  (pinned to `@aikdna/kdna-cli@0.45.2`, `@aikdna/kdna-core@0.37.11`, and
  `@aikdna/kdna-read@0.13.5` on native container `0.6.0`):
  - Make `budget_bytes` optional on `kdna.catalog` (defaulting to `1000000`
    bytes, matching `@aikdna/kdna-cli`'s `catalog` default) and document
    recommended thresholds directly in the `tools/list` schema.
  - For `kdna.catalog` in default `body` presentation (`budget_bytes > 0`),
    fetch the raw official envelope under an internal `4000000`-byte ceiling
    and enforce the caller's `budget_bytes` against the projected body response
    (failing closed with `MCP_BODY_VIEW_BUDGET_EXCEEDED` if exceeded), so
    multi-judgment works whose raw catalog envelope exceeds `200000` bytes
    (such as *KDNA Whitepaper* `v1.0.2`) succeed cleanly with both `{}` and
    `{"budget_bytes": 200000}` while `presentation: "full"` and `"task"` keep
    strict official-envelope budgeting.
- Fix stale CLI public contract binding SHA-256 in `mcp-server/README.md` to
  `29a3b8531f3c18aa0f9d86448ea29fead88e69de78aa248e9fbda3db1fa00186` and add
  stdio regression tests covering >200 KiB raw catalogs and omitted
  `budget_bytes`.

## 0.8.3 (2026-11-20)

- Promote `@aikdna/kdna-mcp-server` to stable release coordinate `0.8.3` aligned
  with `@aikdna/kdna-cli@0.45.2`, `@aikdna/kdna-core@0.37.11`, and
  `@aikdna/kdna-read@0.13.5` (`kdna.read/0.7.0-candidate`) on native container
  `0.6.0`.
- Refresh `install.sh`, vendored CLI archive (`aikdna-kdna-cli-0.45.2.tgz`), and
  contract binding digest so `source-pack` `evidence.output.A` chains across
  consecutive revisions.

## 0.8.2 (2026-11-20)

- Promote `@aikdna/kdna-mcp-server` to stable release coordinate `0.8.2` aligned
  with `@aikdna/kdna-cli@0.45.1`, `@aikdna/kdna-core@0.37.11`, and
  `@aikdna/kdna-read@0.13.5` (`kdna.read/0.7.0-candidate`) on native container
  `0.6.0`.
- Align `install.sh` CLI guidance with `@aikdna/kdna-cli@0.45.1` and document
  unsigned `checksums.json` regeneration on `kdna source-pack` alongside
  `.authored.json` `kdna create` revision workflows in `kdna-creator`.
- Refresh vendored CLI archive (`aikdna-kdna-cli-0.45.1.tgz`), lockfile
  integrity, and registry dependency guard coordinates.

## 0.8.1 (2026-11-20)

- Promote `@aikdna/kdna-mcp-server` to stable release coordinate `0.8.1` aligned
  with `@aikdna/kdna-cli@0.45.0`, `@aikdna/kdna-core@0.37.11`, and
  `@aikdna/kdna-read@0.13.5` (`kdna.read/0.7.0-candidate`) on native container
  `0.6.0`.
- Align GitHub Release tag verification (`kdna-mcp-server-0.8.1`), pack evidence
  validation, and registry dependency integrity guards across all twelve pinned
  runtime packages, plus Windows mixed-case runtime child-environment
  preservation and non-POSIX `O_NOFOLLOW` compatibility.
- Update `kdna-creator`, `kdna-loader`, Host integration guides, and
  `docs/agent-support-matrix.json` for `@aikdna/kdna-cli@0.45.0` (`kdna review`
  one-page author review sheet, clean `kdna diff --format human` / `--verbose`
  with downstream impact summary and zero tail truncation, and plain-language
  author revision loop).

## 0.8.0 (2026-11-18)

- Promote `@aikdna/kdna-mcp-server` to stable release coordinate `0.8.0` aligned
  with `@aikdna/kdna-cli@0.44.0`, `@aikdna/kdna-core@0.37.11`, and
  `@aikdna/kdna-read@0.13.5` (`kdna.read/0.7.0-candidate`) on native container
  `0.6.0`.
- Align GitHub Release tag verification (`kdna-mcp-server-0.8.0`), pack evidence
  validation, and registry dependency integrity guards across all twelve pinned
  runtime packages.
- Update `kdna-creator`, `kdna-loader`, Host integration guides, and
  `docs/agent-support-matrix.json` for `@aikdna/kdna-cli@0.44.0` (`unprotect`,
  `source-open --output`, ASCII `method_roles`, default `other` method
  preservation) and *KDNA Whitepaper* `1.0.2`.

## 0.8.0-rc.native-sections.3 (local release candidate)

- Re-pin the fixed runtime graph to the released CLI 0.43.2 with Core 0.37.9
  and Read 0.13.3: the checked archives, the lock, the runtime binding digest,
  the release-contract facts and every integration guide move together in one
  batch.
- Record the npm coordinate's retirement in the server README: the
  `@aikdna/kdna-mcp-server` registry entry now serves the 0.5.1 notice and is
  not an installation path; the Git channel remains the delivery channel.

## 0.5.1 (2026-10-15)

- Retire this npm coordinate: `@aikdna/kdna-mcp-server@0.5.1` carries only the
  retirement notice — its `kdna-mcp` bin prints the notice and exits non-zero.
  The current MCP server stays a source release candidate delivered from the
  Git channel `aikdna/kdna-skills`; this coordinate is not an install path and
  the supported stable npm surface stays the five stable packages.
- Mark the historical versions `0.1.0`–`0.5.0` deprecated with the same notice
  already carried by `0.5.0` since 2026-10-12.

## 0.8.0-rc.native-sections.2 (local release candidate)

- Re-pin the fixed runtime graph to the released CLI 0.42.0 with Core 0.37.6
  and Read 0.13.0: the checked archives, the lock, the runtime binding digest
  and every integration guide move together in one batch.
- Carry the session on the CLI's explicit raw library envelope and project per
  request with the official Read projection, so the adapter's default body
  folds the non-selected closure members behind their issued handles exactly
  as the CLI prints them — re-projecting the full surface could not, because
  that surface intentionally no longer carries the reduction machinery.
- Keep the default body and full presentation shapes; the task presentation
  reads the same complete envelope fields.

## 0.7.0-rc.component-semantics.1 (local release candidate)

- Replace the workspace flow with one operator-bound local file and the exact
  CLI 0.38.0-rc.component-semantics.1, Core 0.24.0-rc.component-semantics.2 and
  Read 0.3.0-rc.component-semantics.2 graph. Preserve canonical selections,
  mandatory closure, same-session expansion, full responses and cancellation.
- Include all twelve required dependency archives and an offline packed-consumer
  generator. Test the installed process with an empty cache and reject drift in
  the source manifest, lock and archives.
- Update Creator guidance for the Studio CLI 0.13.0-rc.components.1 live session,
  current component inputs and separate adoption channel. Remove obsolete
  persistent-resume instructions from Host guides.
- Make the CLI installer use the same fixed local offline graph and show
  current inspect/read commands. Skill copying does not imply Host activation.
- Keep named Host support unassessed and npm publication disabled for this RC.

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
- Re-pin the engineering-closure CLI tar to its exact 31-file release surface:
  no Eval dependency, retired command source, global Store path, or bundled
  legacy Skill is present. The retained process Host contract is available
  only through the approved explicit-file `load`/`plan-load` commands.
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
