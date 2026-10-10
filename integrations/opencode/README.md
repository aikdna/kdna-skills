# KDNA with OpenCode

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

### Native configuration (verified 2026-10-10, OpenCode 1.18.35)

Add the server to the `mcp` object of `~/.config/opencode/opencode.json`:

```text
{
  "mcp": {
    "kdna": {
      "type": "local",
      "command": [
        "<absolute path to the node you used to install>",
        "/abs/path/mcp-server/bin/kdna-mcp.mjs",
        "--asset", "/abs/path/selected.kdna",
        "--allow-read"
      ],
      "enabled": true
    }
  }
}
```

`opencode mcp add kdna -- <node> <mcp-server>/bin/kdna-mcp.mjs --asset <file> --allow-read`
writes the same entry, `opencode mcp list` should report `kdna connected`, and
`opencode mcp remove kdna` deletes it. The first element of `command` must be the
interpreter the offline `npm ci` used. `--asset` must be an absolute canonical path
(the adapter resolves and compares real paths, so a relative or symlinked path fails
the binding). The binding is per process: switching assets, or reusing the same asset
after a revision, needs a **new session**, not a hot swap.

No model-supplied path or initialize approval can create a binding. Do not let
the model rewrite the launch arguments or automatically pick files. A Host with
unrestricted model shell access must establish this separation itself. No
remote processor/local-model identity is attested by stdio transport.

Use kdna.catalog, kdna.read and kdna.expand with explicit budgets; keep the
original catalog and same official session. kdna.inspect is technical only.
kdna.cancel ends further use and closes the binding; remove/stop the configured
process to disable it. Another file needs a new operator-controlled launch.
No workspace attachments, global discovery, legacy load or implicit adoption.

Skill location from the existing placement guide: `~/.agents/skills/kdna-loader/`.
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
