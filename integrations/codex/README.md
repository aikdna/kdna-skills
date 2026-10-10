# KDNA with Codex

Current local candidate: MCP 0.8.0-rc.native-sections.1 / CLI 0.39.0-rc.native-sections.3 / Core 0.37.1-rc.browser.1 / Read 0.11.2-rc.browser.1
(contract kdna.read/0.7.0-candidate). Named Host delivery and semantic adoption are
**NOT_RUN** for this version. A real local stdio process can be tested without
claiming that this Host has adopted it. The command vector below is transport guidance only.

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

### Native configuration (verified 2026-10-10, codex-cli 0.154.0)

Add the server to `~/.codex/config.toml`:

```toml
[mcp_servers.kdna]
command = "<absolute path to the node you used to install>"
args = ["/abs/path/mcp-server/bin/kdna-mcp.mjs", "--asset", "/abs/path/selected.kdna", "--allow-read"]
```

`command` must be the interpreter the offline `npm ci` used. `--asset` must be an
absolute canonical path: the adapter requires `path.isAbsolute(p)`, `path.resolve(p) === p`,
a `.kdna` extension, a regular non-symlinked file and `fs.realpathSync(p) === p`, so a
relative or symlinked path fails the binding. The binding is per process, so switching
assets — or reusing the same asset after a revision — needs a **new session**, not a hot swap.
For non-interactive runs let approvals pass with `codex exec --approve-for-me`; with
`approval_policy = "never"` MCP tool calls are refused with "MCP tool call requires approval",
which is an approval setting, not a binding or adapter fault.

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
uses StudioCLI 0.13.0-rc.components.2 / StudioCore 4.0.0-rc.components.2 and
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
