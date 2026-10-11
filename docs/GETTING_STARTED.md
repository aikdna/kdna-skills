# Get a useful result with your Agent

Start with a real question and the material you are entitled to use. A domain
judgment system can help you examine recurring decisions, explain reasons and
limits, and improve the judgments after use. You can maintain separate assets
for different domains; there is no required number of questions or assets.

Give this guide and the [repository](../README.md) to a tool-capable Agent.
The Agent should carry out setup and tool operations, then return the usable
asset or answer. The steps below describe its work, not a technical form for
you to fill in.

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

1. Confirm the [official repository](https://github.com/aikdna/kdna-skills) and
   its actual release or source-candidate status before selecting a revision.
   Checksums inside a checkout do not independently authenticate its origin.
   Use a complete checkout at an explicit Git revision,
   with `mcp-server/package-lock.json` and all bundled `vendor/` archives.
   Record the selected source revision. Do not mix files from different
   revisions or resolve a same-version replacement from a global installation.
   The current MCP package is source-only; do not assume an npm release exists.
2. Inspect the local runtime. The installer requires `bash`, `tar`, Node.js 22 or newer and
   npm. The current stable companion graph was exercised with Node.js 22.23.1
   and npm 11.17.0. Select an appropriate isolated runtime when needed and
   within the existing setup authorization; do not change the user's global
   runtime merely to run this task.
3. Run `bash install-cli.sh` from that checkout with the selected Node and npm
   on `PATH`. The script checks the exact manifest, lock and archive bytes,
   installs offline with hooks and optional dependencies disabled, then checks
   the installed graph. Its twelve required dependencies come from local
   archives. It neither installs a global CLI nor starts an MCP server.
4. Use the printed local CLI path with the same Node interpreter. Native
   creation and direct reading are available through that CLI. Read the
   appropriate Skill and its relative references from the checkout; permanent
   Skill placement is optional for a one-off task.
5. If this task needs an MCP connection, prepare the Host-specific configuration
   for the selected file and purpose. Use the [Host guide list](agent-support-matrix.json).
   The user/operator or trusted launcher must own the actual startup binding;
   the model cannot grant permission through tool arguments or enlarge the
   file selection. Verify the named Host's connection and actual tool result.

The repository's `install.sh` optionally places only `kdna-loader` for one
explicitly selected Host (`--codex`, `--claude`, `--opencode`, `--cursor` or
`--copilot`). It refuses to overwrite different existing content and does not
activate MCP. Use it only when persistent placement is part of the requested
setup. Creator has no matching installer: use it in the checkout or preserve
its entire directory, including `references/` and `scripts/`, when arranging
an authorized installation.

If setup fails, name the actual missing input or failed check. A missing archive
needs the complete selected source; a byte mismatch needs a verified source;
an unavailable Host connection needs an actual supported route. Do not switch
to `latest`, a private payload parser or an unrelated global CLI. Direct CLI
reading remains an option when the Host allows it and the user has authorized
the file and processing purpose.

## Create, use and improve

For creation, follow [`kdna-creator`](../kdna-creator/SKILL.md) and the
[native authoring guide](../kdna-creator/references/native-asset-authoring.md).
Organize the real questions, judgments, reasons, examples and necessary shared
concepts before encoding. Review sources and scope with the user; distinguish
authored judgment, inference and constructed examples. Save a draft with the
official CLI, reopen the saved file, and compare its complete content with the
authored input. Read it through the official runtime for a concrete task.

For an existing asset, follow [`kdna-loader`](../kdna-loader/SKILL.md). Read the
catalog, select the relevant question from the returned entries and keep its
mandatory context and limits. Expand only using the returned handle in the
same session. Explain which asset and judgments influenced the answer. A
catalog, technical inspection or non-ready response is not a disclosed
judgment body; report any unresolved restriction rather than treating it as
missing content.

For a revision, use the official Source workflow to save a new file. Keep the
original, record the real change, reopen the new version in a fresh process,
and check both affected judgments and content meant to stay unchanged. Ask the
same practical question again to see whether the revision had the intended
effect. An existing MCP process retains its originally bound bytes, so the
trusted launcher must start a new process for the revised file.

A useful handoff includes the output location, what was created or changed,
the answer obtained from the saved asset, and any unfinished content or checks.
Report machine validation, the Agent's content review and actual human
acceptance separately. Do not describe a synthetic example as a real observed
outcome.

## For application developers

Choose the integration surface your application actually needs:

| Surface | Use it when | Existing implementation or example |
| --- | --- | --- |
| Official CLI | The application or Agent can invoke a local process for creation, reading and revision | [Native workflow recipe](https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs) and its [team-update material](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md) |
| Local MCP | A named Host needs tool calls for one already-selected public native asset | [MCP interface](../mcp-server/README.md) and the actual Host guide |
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
that the current stable package combination is already published.

Let your application's users select a file, purpose and permitted processing
recipient in ordinary language. Your application can hide installation and
machine fields while keeping asset use visible. The native local MCP adapter
accepts one operator-bound input per process; it does not discover assets,
manage accounts, create workspace attachments or provide a cloud asset store.

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

Studio's interview, terminal-session and protected-file routes have their own
[Creator references](../kdna-creator/SKILL.md). They are optional and use a
different container contract; do not send protected Studio bytes to the native
MCP adapter or infer that one route's acceptance applies to another.

[中文](GETTING_STARTED.zh.md)
