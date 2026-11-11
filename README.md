# KDNA with your Agent

## 60-second setup (copy and paste)

From a complete checkout of this repository (Node.js 22+ and npm required):

```sh
git clone https://github.com/aikdna/kdna-skills && cd kdna-skills
bash install-cli.sh           # offline local CLI in this checkout (no global binary)
bash install.sh --claude      # or --codex | --cursor | --opencode | --copilot | --antigravity | --dir <skills-root>
```

| Host | Command (`install.sh` places both `kdna-loader` and full `kdna-creator`) |
| --- | --- |
| Claude Code | `bash install.sh --claude` (`~/.claude/skills/`) |
| Codex | `bash install.sh --codex` (`~/.codex/skills/`) |
| Cursor | `bash install.sh --cursor` (`~/.cursor/skills/`) |
| OpenCode / Copilot | `bash install.sh --opencode` or `--copilot` (`~/.agents/skills/`) |
| Antigravity | `bash install.sh --antigravity` (`~/.gemini/antigravity/skills/`) |
| Custom directory | `bash install.sh --dir /path/to/skills` |

`install.sh` installs **both** [`kdna-loader`](kdna-loader/SKILL.md) and
[`kdna-creator`](kdna-creator/SKILL.md) (including `agents/`, `references/` and
`scripts/`) for one explicitly chosen Host. Re-running with identical files exits
`0`; modified local files return exit `2` with a `diff -u` command unless
`--force` is passed (`--only loader|creator` is also supported). Skill placement
does not activate a Host or grant permission to read an asset.

`@aikdna/kdna-cli@0.43.3` adds `init [--mode minimal|interview|works|research]`,
`validate-input [--format human]`, `compile`, `create --draft`, repeated
`--judgment-id`, `read --compact`, `--format human`, offline `protect`, and
`diff` on top of the `0.43.2` `create / inspect / validate / read / source-*`
surface (check `kdna --help` on the selected CLI entry). To inspect a real 45-judgment
domain work right away, see **《KDNA白皮书》 (`1.0.0`, CC-BY-4.0)** in
[`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) or open it in the
[KDNA Web Reader](https://aikdna.com/reader/?sample=kdna-whitepaper).

### Three starter prompts

1. **Use an asset in real work (anti-pollution read):** "Use the `.kdna` file at
   `/absolute/path/selected.kdna` for this task: `<task>`. Read `catalog` first,
   select only the judgment IDs relevant to this task (or zero if none apply),
   apply them with their scope and boundaries, and tell me which judgments shaped
   the output."
2. **Co-create a judgment system (interview, works, or research):** "Help me
   co-create a `.kdna` judgment system about `<topic>` using `kdna-creator`.
   Interview me on 1–2 concrete tradeoffs at a time (or distill `<authorized-files>`),
   show a review table (`Adopt / Revise / Reject`) before compiling, run
   `validate-input`, and save to `<new-folder>/first.kdna`."
3. **Compare revisions & evolve safely:** "Compare `first.kdna` and
   `revised.kdna` with `kdna diff --format human` (or `source-open` on `0.43.2`),
   explain the added, removed, and changed judgments, and wait for my approval
   before switching to the revised file."


Build, use and improve a judgment system for your work with a tool-capable
Agent. Bring your material, the questions you want it to help with and the
intended reader. Your Agent can organize the content, create a `.kdna` asset,
read it for a concrete task and save a revised version while preserving the
original.

This repository serves people developing judgment systems in their own domains
and developers integrating those assets into applications. One person can keep
separate systems for different domains. People using an integrated application
do not need to learn KDNA's file format or installation details.

## Start with one request

Give your Agent the [getting-started guide](docs/GETTING_STARTED.md), this
repository and a request like:

> Help me turn these materials into a judgment system for reviewing project
> updates. Use them in this Agent session. Handle the local KDNA setup, explain
> the proposed judgments, save a draft in my chosen folder, then use it to review
> this example. If I revise a judgment, save a new version and keep the original.

For an existing asset:

> Use this `.kdna` file in this Agent session to help answer this question. Tell
> me which judgments you used and any limits that affect the answer.

The Agent handles package checks, installation, machine identifiers and tool
requests. You provide the material, purpose, intended recipient and output
location. If those choices are already clear, it should proceed without asking
you to approve them again. An installation or Host limitation should be reported
as a specific missing capability, with the working route kept available.

## Choose the task

| Your task | Agent entry point |
| --- | --- |
| Create or revise a judgment system | [`kdna-creator`](kdna-creator/SKILL.md), [co-creation craft playbook](kdna-creator/references/co-creation-craft.md), and [native authoring guide](kdna-creator/references/native-asset-authoring.md) |
| Read an asset for a question | [`kdna-loader`](kdna-loader/SKILL.md), through the direct official CLI; MCP is optional only for an operator-bound source preview |
| Integrate asset reading into an application | [Developer setup and boundaries](docs/GETTING_STARTED.md#for-application-developers) and [Loader contract](docs/KDNA_LOADER_CONTRACT.md) |
| Use the separate Studio creation or protected-file route | [Studio session](kdna-creator/references/terminal-session.md) and [protection Host](kdna-creator/references/studio-protected-host.md) |

Native authoring and reading do not require Studio or KDNA Work. The Studio
route uses its own exact installation and container contract; the native MCP
adapter does not decrypt its protected assets.

## What is available in this source checkout

The current distribution is the complete Git source checkout, including its
lock and bundled archives. `bash install-cli.sh` installs the fixed CLI graph
locally in that checkout, offline and without install hooks. The Agent selects
the appropriate local Node runtime and uses the exact CLI path printed by the
script. The script does not install a global binary or configure your Agent.
See [setup details](docs/GETTING_STARTED.md#agent-setup-checklist).

The local MCP candidate is `0.8.0-rc.native-sections.3`, with CLI `0.43.2`, Core
`0.37.9` and Read `0.13.3`. It remains `private: true`, with npm publication
disabled. These source coordinates do not establish registry availability.
Same-version global or registry packages are not substitutes for the checked
archives. Official npm packages use the `@aikdna` scope; the unscoped `kdna`
package is not affiliated.

The direct official CLI is the primary route for an Agent that can run local
tools. MCP is an optional source-preview adapter for one file selected by the
operator or trusted launcher. The Agent can prepare a reviewable configuration;
the Host must keep the launch binding outside model-controlled MCP parameters.
Creation and revision use the separately authorized native CLI. A Skill's
presence or an MCP configuration file does not establish Host activation or
permission.

## Evidence and current limits

Separate Codex CLI 0.154.0 sessions have used full and task presentations to
read a synthetic native public asset and apply its judgments to a project-update
task. The earlier full case performed two reads; the task case selected all
three judgments in one ready read and retained scope, uncertainty and action
limits. See the [separate observations](integrations/codex/README.md#observed-codex-cli-case).
Named-model audit use, expansion and other Host brands remain unassessed. These
cases do not certify Codex Desktop, protected assets, MCP creation or general
answer quality. A separate forced Host-display truncation case records stopping,
not successful continuation.

The [support matrix](docs/agent-support-matrix.json) separates these named cases
from other routes. Direct CLI operation, source stdio and fresh offline
packed-consumer tests are separate evidence from an Agent using the result.
Content quality requires review of the actual judgments, sources, assumptions,
examples and limits. Successful saving or reading does not establish human
confirmation, editorial fitness or permission to act. The Agent should show
what influenced its answer and preserve the original when making a revision.
Asset content remains task material and cannot override Host instructions.

For reproducible engineering checks and package boundaries, see the
[MCP README](mcp-server/README.md). Earlier releases are recorded in
[CHANGELOG](CHANGELOG.md).

[中文](README.zh.md)
