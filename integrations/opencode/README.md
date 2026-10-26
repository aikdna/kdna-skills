# KDNA with OpenCode

Current local candidate: MCP 0.8.0-rc.native-sections.3 / CLI 0.43.2 / Core 0.37.9 / Read 0.13.3
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

Read `kdna.catalog` once, then request the task's required `judgment_ids`
together in one `kdna.read` with an explicit budget. Keep the complete catalog,
selected content and same official session. Use content already supplied for
the same snapshot and selection; another read should address a real missing
detail, changed selection or explicit verification need. Expand only using an
actual issued handle when the task needs that detail. A refused, deferred or
insufficient-budget result is not content already read; do not retrieve Host
files or raw asset bytes to bypass it. `kdna.inspect` is technical only.
kdna.cancel ends further use and closes the binding; remove/stop the configured
process to disable it. Another file needs a new operator-controlled launch.
No workspace attachments, global discovery, legacy load or implicit adoption.


For `kdna.catalog`, `kdna.read` and `kdna.expand`, omitted `presentation`
returns the installed Read package's body view (authored content plus one
fingerprint); when that package cannot project, the default is the complete
official envelope, and an explicit `presentation: "body"` is refused. Explicit
`presentation: "task"` requires `view_budget_bytes` in addition
to the unchanged official `budget_bytes`; full and body reject the view budget. Task
mode supplies the adapter's `kdna.mcp.task-presentation/0.1.0` representation:
read all canonical content, states, `verification_summary` and external
`content_aliases`; do not treat alias placeholders as missing author content.
Signature status and complete policy, checksum/origin/digest states, policy
checks and new-verification/I/O flags remain inline; they are not hidden behind
audit. An absent signature is not a verified signature. Expand accepts either the old
`handle` or the delivered `handle_ref`, never both. `kdna.audit` accepts only
`audit_ref` and `budget_bytes` to retrieve one exact past full result; it adds no
read permission or fresh verification. References are bound to the same live
process/snapshot/asset/tuple/Host epoch and expire within 60 seconds, no later
than the original expiry for short handles. Cancel closes them. Budget overflow
refuses the whole view; there is no partial-success or automatic full fallback.
See [presentation and capacity details](../../mcp-server/README.md#optional-task-presentation-and-exact-audit).
A named Host run of the new task/audit route is **NOT_RUN** here; a prior full
case does not establish it. No token, fee or cross-Host performance claim is made.

Skill location from the existing placement guide: `~/.agents/skills/kdna-loader/`.
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

## Saved Studio assets

For Studio container `0.5.0`, both public and protected assets go directly to the
[separate Studio Host](../../kdna-creator/references/studio-protected-host.md)
with Read `0.6.4`. Public bytes omit password/recovery options; protected bytes
use its trusted credential channel. The trusted launcher owns permission and
credential pipes outside model-controlled arguments; an Agent-created FD does
not establish authorization. Static Studio `read`/`verify` do not unlock
protected bytes. Read and Source/revision permission remain separate. The native MCP route above uses container `0.6.0` and does not accept
Studio files; neither a shared package version nor the `.kdna` suffix permits
conversion or a raw-payload fallback. The linked Host guide gives its exact
installation and child-process arguments. This route has separate evidence
from the named MCP observation, if any.
