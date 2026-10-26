# KDNA with Codex

Current local candidate: MCP 0.8.0-rc.native-sections.3 / CLI 0.43.2 / Core 0.37.9 / Read 0.13.3
(contract kdna.read/0.7.0-candidate). Separate **Codex CLI 0.154.0** model turns
have used full and task presentations to read a synthetic native public asset
and apply its judgments. These bounded observations do not establish all Codex
surfaces or routes as supported.
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

This is one named native public Read and task-use observation using the
original full presentation, before the task-view/audit extension. It is not
evidence for the new presentation or audit route. `kdna.expand`,
MCP creation, the Studio protection Host, Codex Desktop/IDE and human acceptance
are **NOT_RUN** in this case. The model coordinate was not separately recorded.
It is not a registry cold-acquisition test or general Host/answer-quality
certification. A separately existing unbound Desktop connection is not changed
by this CLI result. See the [support matrix](../../docs/agent-support-matrix.json).

## Observed task-presentation case

In a separate model turn on 2026-10-11, Codex CLI 0.154.0 called
`kdna.binding-status`, task-mode `kdna.catalog`, one task-mode `kdna.read` and
`kdna.cancel`. The exact selection batched all three required judgments from
one synthetic native public asset. The read was ready, with no repeated
selection read. The answer applied the judgments while retaining their scope,
undeclared method, claimed-unverified confirmation and action limits. Its
inline verification summary retained the absent signature and the satisfied
optional signature policy; this did not become a claim of new verification.

The installed graph was retained from a verified offline installation. Startup
used a temporary trusted command-line binding and left persistent global
configuration unchanged. Other execution surfaces were disabled; no Host-file
read attempt or success was observed in this turn. The raw tool result was
complete and the model reported no truncation under the configured display
limits. This is not a general no-truncation guarantee.

The model made no `kdna.audit` or `kdna.expand` call. Named-model audit use and
expansion are **NOT_RUN**, regardless of separate engineering tests. Other Host
brands, Codex Desktop/IDE, Studio protection, MCP creation, registry cold
acquisition and human acceptance are outside this observation. The selected
model identity was not separately recorded; no token or fee comparison was
established.

### Deliberately truncated Host display

A separate Codex CLI turn deliberately constrained the Host display budget.
The MCP catalog event was complete, but the Host presentation truncated it.
Automatic approval rejected one attempted follow-up read before MCP dispatch;
its arguments also lacked the required strict selection shape. The model then
cancelled the binding and stopped without inventing judgment content. No shell
or Host-file read was observed. This records stopping on insufficient visible
content; it does not establish successful continuation, audit retrieval,
general Host certification or reproduction of another Host's experiment.

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
The separate [task case](#observed-task-presentation-case) records one named
Host use of task presentation. Named-model audit use and expansion remain
**NOT_RUN**. No token, fee or cross-Host performance claim is made.

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

Current Studio export needs an explicitly complete method and cannot export a
method-absent proposal.
