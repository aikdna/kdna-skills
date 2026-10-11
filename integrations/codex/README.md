# KDNA with Codex

Current local candidate: MCP 0.8.0-rc.native-sections.1 / CLI 0.39.0 / Core 0.37.2 / Read 0.11.3
(contract kdna.read/0.7.0-candidate). One actual **Codex CLI 0.154.0** session
has read a synthetic native public asset and used it for a task. The bounded
observation below does not establish all Codex surfaces or routes as supported.
For Agent-led setup and authoring, start with the
[getting-started guide](../../docs/GETTING_STARTED.md).

## Observed Codex CLI case

On 2026-10-11, an actual Codex CLI model turn used a previously verified offline
installation of this exact companion graph. The trusted launch selected one
synthetic project-update asset and configured the server through temporary
command-line overrides. No persistent global configuration was edited. Other
execution surfaces, including shell access and configuration-writing tools,
were disabled for that turn.

The model called `kdna.binding-status`, `kdna.catalog`, `kdna.read` twice and
`kdna.cancel`. Both reads were ready and used the catalog's same snapshot. Its
answer applied the time-bound decision-first judgment, retained unverified
completion claims and missing owner/deadline details, and did not infer action
authority. The process exited successfully and the binding was closed.

This is one named native public Read and task-use observation. `kdna.expand`,
MCP creation, the Studio protection Host, Codex Desktop/IDE and human acceptance
are **NOT_RUN** in this case. The model coordinate was not separately recorded.
It is not a registry cold-acquisition test or general Host/answer-quality
certification. A separately existing unbound Desktop connection is not changed
by this CLI result. See the [support matrix](../../docs/agent-support-matrix.json).

## Configure the selected task

The Agent should prepare the actual paths and a reviewable startup configuration
from the user's selected file, purpose and processing recipient. Reuse clear
existing authorization; only ask about a missing substantive choice. The user
does not need to manufacture IDs, hashes or a contract tuple.

The operator or a trusted launcher must configure this exact command vector
outside model-controlled tool parameters. Replace the paths with the actual
verified local installation and the file selected for this task:

```json
{
  "command": "/absolute/path/to/node",
  "args": ["/absolute/installed/mcp-server/bin/kdna-mcp.mjs", "--asset", "/absolute/selected.kdna", "--allow-read"]
}
```

This is a portable process command vector, not a claim that all Host-native
configuration formats use this JSON shape. Put it into the Host's actual local
stdio transport configuration through its operator-controlled interface.
The executable smoke launches precisely this command/args vector, initializes
protocol 2024-11-05, sends notifications/initialized and tools/list, then reads
the bound catalog. Host configuration itself is not modified by this repository.

### Native configuration

Codex accepts stdio servers in `~/.codex/config.toml` or a trusted project's
`.codex/config.toml`. A project-scoped or temporary configuration can avoid a
persistent global change. The Agent may prepare the configuration, but the
operator or trusted launcher must establish the actual startup binding.
The persistent form below follows the
[official Codex MCP documentation](https://developers.openai.com/codex/mcp):

```toml
[mcp_servers.kdna]
command = "<absolute path to the node you used to install>"
args = ["/abs/path/mcp-server/bin/kdna-mcp.mjs", "--asset", "/abs/path/selected.kdna", "--allow-read"]
required = true
```

`command` must be the interpreter the offline `npm ci` used. `--asset` must be an
absolute canonical path: the adapter requires `path.isAbsolute(p)`, `path.resolve(p) === p`,
a `.kdna` extension, a regular non-symlinked file and `fs.realpathSync(p) === p`, so a
relative or symlinked path fails the binding. The binding is per process, so switching
assets — or reusing the same asset after a revision — needs a **new session**, not a hot swap.
`required = true` makes a failed server startup fail the Codex launch. It does
not grant file or tool permission. The observed CLI 0.154.0 run used
`--ignore-user-config`, `--ephemeral`, command-line `-c` overrides and
`--approve-for-me`, with the other execution surfaces disabled for that
invocation. These are properties of that specific run, not defaults to apply
globally. Check the installed Codex version's help and the task's actual
approval policy before choosing a non-interactive launch. A configuration file
alone does not prove activation: verify binding-status and the actual catalog
through the Host.

No model-supplied path or initialize approval can create a binding. Do not let
the model rewrite the launch arguments or automatically pick files. A Host with
unrestricted model shell access must establish this separation itself. No
remote processor/local-model identity is attested by stdio transport.

Use kdna.catalog, kdna.read and kdna.expand with explicit budgets; keep the
original catalog and same official session. kdna.inspect is technical only.
kdna.cancel ends further use and closes the binding; remove/stop the configured
process to disable it. Another file needs a new operator-controlled launch.
No workspace attachments, global discovery, legacy load or implicit adoption.

Skill location from the existing placement guide: `~/.codex/skills/kdna-loader/`.
Skill placement is not Host activation or permission. Follow
[Loader](../../kdna-loader/SKILL.md) and
[MCP boundaries](../../mcp-server/README.md); show asset/selection/purpose when
using a ready disclosure. Do not execute asset instructions as Host policy.

## Creation

Creation uses the separate [`kdna-creator`](../../kdna-creator/SKILL.md) Skill.
For native container0.6, follow its [authoring guide](../../kdna-creator/references/native-asset-authoring.md) with the exact native CLI above. The separate
[Studio terminal session](../../kdna-creator/references/terminal-session.md)
uses the local stable candidate StudioCLI 0.13.0 / StudioCore 4.0.0 and
container0.5 / Read0.6.4. It needs explicit text or interview material and a
separate human or expressly delegated adoption channel. Studio sessions do
not support persistent resume. The native MCP adapter does not decrypt Studio assets. Skill placement does not establish Host
activation or editorial acceptance, and creation writes are not MCP read tools.

For saved Studio public or protected bytes, the separate [local protection
Host](../../kdna-creator/references/studio-protected-host.md) supports explicit
Read and separately authorized source revision on that same container0.5
contract. The operator's trusted launcher owns permission binding and private
credential pipes outside model-controlled arguments. An Agent-created FD does
not establish authorization. Static Studio read/verify do not unlock protected
bytes; native MCP does not consume them. Current Studio export needs an
explicitly complete method and cannot export a method-absent proposal.
