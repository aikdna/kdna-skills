# KDNA with your Agent

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
| Create or revise a judgment system | [`kdna-creator`](kdna-creator/SKILL.md) and its [native authoring guide](kdna-creator/references/native-asset-authoring.md) |
| Read an asset for a question | [`kdna-loader`](kdna-loader/SKILL.md), through the direct official CLI or a configured local MCP connection |
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

The local MCP candidate is `0.8.0-rc.native-sections.3`, with CLI `0.43.0`, Core
`0.37.7` and Read `0.13.1`. It remains `private: true`, with npm publication
disabled. These source coordinates do not establish registry availability.
Same-version global or registry packages are not substitutes for the checked
archives. Official npm packages use the `@aikdna` scope; the unscoped `kdna`
package is not affiliated.

MCP supplies read tools for one file selected by the operator or trusted
launcher. The Agent can prepare a reviewable configuration; the Host must keep
the launch binding outside model-controlled MCP parameters. Creation and
revision use the separately authorized native CLI. A Skill's presence or an MCP
configuration file does not establish Host activation or permission.

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
