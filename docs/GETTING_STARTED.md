# Get a useful result with your Agent

Start with a real question and the material you are entitled to use. A domain
judgment system can help you examine recurring decisions, explain reasons and
limits, and improve the judgments after use. You can maintain separate assets
for different domains; there is no required number of questions or assets.

For the fastest zero-clone start, point any tool-capable Agent (Node.js `>=22`)
at `npx -y @aikdna/kdna-cli@0.46.0` together with [`https://aikdna.com/create.md`](https://aikdna.com/create.md)
(authoring) or [`https://aikdna.com/use.md`](https://aikdna.com/use.md)
(consuming a `.kdna` file). Give this guide and the [repository](../README.md)
to your Agent when installing persistent Skills or configuring the optional
offline-verified local MCP server.

## What the user supplies

Explain the purpose, intended reader and authorized materials. For an existing
asset, select the file and the question. For creation or revision, select the
output folder and say whether the result is a draft or content you intend to
adopt. Identify the Agent or other processor that may receive the material.
Using a local tool does not make a cloud-connected Agent local-only.

The Agent reuses these choices from the conversation. It asks one ordinary
question only when a substantive choice is missing. It derives file hashes,
contract coordinates, IDs and handles itself. Read permission does not silently
become permission to revise, publish, call another provider or act on advice.

## Agent setup checklist

1. **Direct CLI (primary route, zero clone required)**: Requires Node.js `>=22`.
   Run `npx -y @aikdna/kdna-cli@0.46.0 --help` (or install globally via
   `npm install -g @aikdna/kdna-cli@0.46.0`; add
   `--registry=https://registry.npmmirror.com` only on Mainland China timeout).
2. **Optional persistent Skills or local MCP checkout**: Confirm the
   [official repository](https://github.com/aikdna/kdna-skills) at an explicit
   Git revision with `mcp-server/package-lock.json` and all bundled `vendor/`
   archives. Checksums inside a checkout do not independently authenticate its
   origin. Do not mix files from different revisions or replace the vendored
   MCP graph with an unrelated global CLI. `@aikdna/kdna-mcp-server@0.8.4` is
   the strictly read-only, single-file OS-`argv`-bound MCP coordinate running on
   its verified offline `0.45.2` / Core `0.37.11` / Read `0.13.5` graph.
3. **Offline MCP graph installation (`bash install-cli.sh`)**: Requires `bash`,
   `tar`, Node.js `>=22` and npm (exercised with Node.js 22.23.1 and npm
   11.17.0). Run `bash install-cli.sh` from the checkout to verify manifest,
   lock and archive bytes, install the twelve local dependencies offline with
   hooks disabled, and print the exact local CLI path. It neither installs a
   global CLI nor starts an MCP server.
4. **Optional persistent Skill placement (`bash install.sh`)**: Places **both**
   `kdna-loader` and the complete `kdna-creator` directory (`SKILL.md`,
   `agents/`, all four active `references/*.md` files, and
   `scripts/native-asset-review.mjs`) for one explicitly selected Host
   (`--codex`, `--claude`, `--opencode`, `--cursor`, `--copilot`,
   `--antigravity` or `--dir <skills-root>`, with optional
   `--only loader|creator` and `--force`). Without `--force`, modified
   destination files return exit `2` with a `diff -u` hint rather than being
   overwritten. Skill placement never activates MCP or grants asset permission.
5. **Default to direct CLI; use MCP only when structured tool calls are required**:
   If a task specifically needs MCP, prepare the Host-specific configuration
   from the [Host guide list](agent-support-matrix.json). The user/operator or
   trusted launcher must own startup `argv`; the model cannot grant permission
   through tool arguments or enlarge the file selection.

If setup fails, name the actual missing input or failed check. Do not switch to
`@latest`, a private payload parser, or an unverified binary.

## Create, use and improve

Use the asset's declared format and entitlement state to select its reader and
passphrase channel:

| Saved asset & route | Matching reader | Permission and credentials |
| --- | --- | --- |
| Public native container `0.6.0` | Direct official CLI (`@aikdna/kdna-cli@0.46.0`, primary), or optional local MCP (`@aikdna/kdna-mcp-server@0.8.4`), Read `0.7.0-candidate` | Selected file and explicit Read permission (`--allow-read`) |
| Password-protected `0.6.0` via direct CLI (one-shot) | `@aikdna/kdna-cli@0.46.0` | Selected file, `--allow-read`, and `--password-env <VAR>` (preferred for Agent shells), `--password-prompt` (interactive TTY), `--password-file <0600-path>`, or `--password-fd <n>` (`n >= 3`) |
| Password-protected `0.6.0` via direct CLI `--session` | `@aikdna/kdna-cli@0.46.0` (or `0.45.2`) | Selected file, `--allow-read`, and `--password-env <VAR>` (`0.46.0`), `--password-file <0600-path>`, or `--password-fd <n>` (`n >= 3`) — **NEVER `--password-file /dev/stdin`** (`stdin` carries JSONL requests) |
| Password-protected `0.6.0` via local MCP (`kdna-mcp.mjs`) | `@aikdna/kdna-mcp-server@0.8.4` (vendored read-only `0.45.2` graph) | Operator startup `argv` with `--asset <abs-path> --allow-read` and `--password-file <0600-path>` or `--password-fd <n>` (`n >= 3`) — **NEVER `--password-file /dev/stdin`** (`stdin` is the MCP JSON-RPC transport) |

Do not infer a file's format from the `.kdna` suffix, and never fall back to
unzipping or raw-payload reading when an input is rejected. Never put a
passphrase in `argv`, shell history, or chat text.

For creation, follow [`kdna-creator`](../kdna-creator/SKILL.md) and its
on-demand references ([co-creation craft](../kdna-creator/references/co-creation-craft.md),
[extended draft schema & 16 methods](../kdna-creator/references/draft-schema-and-methods.md),
[authoring & protection](../kdna-creator/references/authoring-and-protection.md),
and [raw native authoring](../kdna-creator/references/native-asset-authoring.md)).
Calibrate Tier 1 (1–15 judgments) vs. Tier 2/3 systems, route across `works` /
`interview` / `research` (confirming material scope rather than domain truth in
`research`), stage large inputs (`>= 5` files or `> 30 KB`) in private
`.kdna-work/`, confirm via layered `Adopt / Revise / Reject` review plus a
one-page `kdna review` proof sheet, run `validate-input` and `create --draft`
with `@aikdna/kdna-cli@0.46.0`, cold-reopen, and run Tier 1 Closure & Brake
Smoke Check (or Tier 2 Fresh-Context Blind Test when isolated subagents exist).

When creation fails, show the [complete diagnostic paths](../kdna-creator/references/native-asset-authoring.md#3-reading-complete-cli--core-diagnostics).
Read every entry in `diagnostics` / `core.diagnostics`, preserving exact codes,
pointers, and `null` vs. absent fields alongside ordinary-language explanations.

For an existing asset, follow [`kdna-loader`](../kdna-loader/SKILL.md). Read
`catalog` first, select only the 1–5 questions the task actually needs (`0` is
valid when none apply), request them together via `exact_selection` with
`--format human` or `--compact` (or `judgment_ids` in `--session`/MCP), keep
every boundary, conditional exception, misuse warning, and conflict brake
intact, arbitrate cross-asset conflicts with the user when multiple `.kdna`
files are authorized, and cite which asset and exact judgments influenced the
answer.

The Agent can explicitly choose the MCP
[task presentation](../mcp-server/README.md#optional-task-presentation-and-exact-audit)
to receive exact duplicate content through references instead of repeated
objects. Omitted `presentation` returns the installed Read package's body view
(authored content plus one fingerprint); when that package cannot project, the
default is the complete official envelope and an explicit body request is
refused. The Agent handles the independent view budget and resolves every alias,
keeping all author content and state distinctions needed for the task. It also
reads the inline verification summary: an absent signature is different from a
verified signature, and an earlier check is different from a new check. For
ordinary reads that need the complete official envelope (full verification,
receipt, and handles), pass `presentation: "full"` directly. An audit request
(`kdna.audit`) requires an `audit_ref` issued by a prior `presentation: "task"`
delivery and retrieves only that exact past full result when needed; it is not
another permission grant. A budget failure cannot be bypassed with a partial
answer or Host file access. A [separate Codex CLI task example](../integrations/codex/README.md#observed-task-presentation-case)
used one batched ready read while retaining the judgments' scope and limits.
The earlier full-presentation case remains separate. Named-model audit use,
expansion and other Host brands remain unassessed; a forced Host-display
truncation case established stopping, not successful continuation.

For a revision, treat `draft.json` as the **sole canonical source** for every
draft-born asset: edit `draft.json`, bump `asset.version`, compile to a new
sibling `.kdna` via `create --draft`, and compare revisions via
`kdna diff <old.kdna> <revised.kdna> --format human` (using
`--left-password-*` / `--right-password-*` if passphrases differ). Reserve
`source-open` / `source-pack` strictly for external `.kdna` files lacking a
`draft.json` (or carrying `members[]` attachments). An existing MCP process
retains its originally bound bytes, so the trusted launcher must start a new
process for any revised file.

When using `kdna protect` for offline local password protection, remember that
outer `manifest` metadata (`title`, `summary`, `creator`, `keywords`) stays
plaintext while `payload.kdnab` is AEAD-encrypted, and always retain the
unencrypted `draft.json` and plaintext `.kdna` source privately for future
revisions.

A useful handoff includes the output location, what was created or changed,
verification results labeled honestly by tier, and any unfinished content or
checks. Report machine validation, Agent review, smoke checks, and actual human
acceptance separately. Do not describe a synthetic example as a real observed
outcome.

## For application developers

Choose the integration surface your application actually needs:

| Surface | Use it when | Existing implementation or example |
| --- | --- | --- |
| Official CLI | The application or Agent can invoke a local process for creation, reading and revision | [Native workflow recipe](https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs) and its [team-update material](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md) |
| Local MCP | A named Host needs read-only tool calls for one already-selected native asset | [MCP interface](../mcp-server/README.md) and the actual Host guide |
| Direct Core + Read SDK | The application owns byte admission, retained sessions and the trusted permission/delivery provider | [Official CLI's public API wiring](https://github.com/aikdna/kdna-cli/blob/main/src/public-cli.js) |

For the native container 0.6 / Read 0.7.0-candidate route, the public entry points
are `@aikdna/kdna-core/sections-node`, `@aikdna/kdna-core/sections-bytes-node`,
`@aikdna/kdna-core/retained-sections-node` and
`@aikdna/kdna-read/retained-sections-node`. Use the matching selected versions
and their exported types; `/node` alone is a different contract. The official
CLI shows the full sequence: admit the request and Whole bytes, retain the
accepted snapshot, create the trusted read authority/provider, then
`admitRetainedSectionRequest` → `prepareRetainedSectionRead` →
`readRetainedSection`. Read `catalog` before `exact_selection`, reuse the
snapshot for issued expansion handles, and deliver the complete result channel
and envelope to the application. Your Host must derive permission from the
actual task, not copy an unconditional permission callback into production.

The [Core retained types](https://github.com/aikdna/kdna/blob/main/packages/kdna-core/src/public-contract/retained-sections-node.d.ts)
and [Read retained types](https://github.com/aikdna/kdna/blob/main/packages/kdna-read/src/retained-sections-node.d.ts)
define these interfaces. The [native team-update example](https://github.com/aikdna/kdna/blob/main/examples/native-team-update/README.md)
also explains task use and revision, but retains its historical preview package
coordinates. Do not treat those archives or a `main` source link as evidence
that a package combination is published.

Let your application's users select a file, purpose and permitted processing
recipient in ordinary language. Your application can hide installation and
machine fields while keeping asset use visible. The native local MCP adapter
accepts one operator-bound input per process; it stays strictly read-only and
does not discover assets, manage accounts, compile drafts, or provide a cloud
asset store.

Use the exact official CLI/Core/Read bytes and the
[Loader contract](KDNA_LOADER_CONTRACT.md). Keep the trusted launcher separate
from model-controlled tool requests. Prevent model code or configuration edits
from widening the binding; running local stdio alone does not enforce that
separation. Keep ready disclosures, mandatory context, denied operations and
transport failures distinct. Stop/cancel ends further use; it does not retract
text already delivered. Creation and revision need their own explicit write
scope and use the native CLI, not MCP read tools.

The [MCP README](../mcp-server/README.md) describes reproducible source and
packed-consumer checks. Test your actual Agent/Host, material and modification
journey as well: process tests do not certify a Host or the quality of an
answer. The [support matrix](agent-support-matrix.json) tracks the current
MCP evidence separately from direct CLI capability.

Applications that consume MCP results should choose the presentation explicitly
when interpreting its shape: omitting `presentation` defaults to the installed
Read package's `body` view (falling back to the complete official envelope when
that package cannot project); explicit `presentation: "full"` returns the
complete official envelope; `presentation: "task"` requires `view_budget_bytes`
and returns `kdna.mcp.task-presentation/0.1.0`. All modes still use the
unchanged official `budget_bytes`. Task aliases are external pointers to exact
canonical objects, not a second authoring format. Reconstruct them before
interpreting content. `kdna.audit` requires a prior `task` delivery's
`audit.audit_ref` to retrieve that exact past full result and never renews
authorization. Do not treat adapter unavailability, expired references or
capacity/budget failures as an official denial or a successful empty read.

[中文](GETTING_STARTED.zh.md)
