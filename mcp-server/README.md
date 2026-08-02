# KDNA MCP Server

`@aikdna/kdna-mcp-server` is a thin stdio MCP adapter for user-approved
workspace attachments. It delegates integrity, authorization, resolver, plan,
and load decisions to the pinned KDNA CLI/Core runtime. A user-selected
explicit file uses the official CLI through the loader Skill, not an
arbitrary-path MCP tool.

## Source status

The `0.5.0` source tree is a Development Preview candidate whose component tests
bind the exact `@aikdna/kdna-cli@0.36.0` candidate and its single
`@aikdna/kdna-core@0.21.0` runtime. Host delivery and semantic adoption pass on
the OpenCode `1.18.11` ordinary-task single-Host loop
(`VERIFIED_SINGLE_HOST_ORDINARY_TASK`); the Codex ordinary-task rerun remains
`RECHECK_REQUIRED` pending account recovery, Creation-to-Consumption
integration is `RECHECK_REQUIRED`, and real-human acceptance is `NOT_RUN`.
Those two dependency versions are not yet registry releases, so this source
checkpoint is not installable from npm and makes no publication claim.

The retained CLI tar has one exact 32-file package allowlist and no Eval
dependency, retired command source, global Store path, or bundled legacy
Skill. MCP consumes that closed tar without adding another CLI capability
surface.

The npm registry still serves MCP `0.4.2`; that historical package is not the
workspace-attachment candidate described here.

## Tool boundary

| Tool                     | Purpose                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| `kdna.workspace-status`  | Show only approved attachments for the supplied workspace           |
| `kdna.workspace-resolve` | Resolve one task against that approved set                          |
| `kdna.workspace-load`    | Resolve, plan, authorize, and load only when the decision is `load` |

There is no global discovery, task-to-asset matching, attachment mutation,
password tool argument, or caller-supplied entitlement state. The adapter
cannot attach, enable, disable, switch, roll back, or remove a workspace
attachment.

The candidate does not expose generic explicit-file inspect, verify, plan, or
load tools. Standard Codex/OpenCode MCP clients do not supply a native,
model-hidden file-selection broker, so a model-supplied path cannot prove user
intent. The public loader Skill instead performs one official CLI `kdna load`
after one meaningful use-once file approval; that call validates and plans
internally and creates no persistent attachment.

The three workspace tools are the automatic project flow because every result
remains bound to the immutable root, approved attachment record, policy scope,
and snapshot. Host configurations must enumerate those three exact tools and
must not use a server-wide wildcard.

## Host processing consent

Attachment approval makes exact workspace bytes eligible for resolution. It
does **not** authorize a Host to deliver a decrypted Runtime Capsule to an
unknown processor. Before the first successful load, the Host must turn one
plain-language approval into a private machine document. The adapter starts
with the fixed Host identity and fixed private document path:

- `KDNA_MCP_HOST_ID`, the fixed Host identity;
- `KDNA_MCP_HOST_PROCESSING_CONSENT_FILE`, a regular mode-`0600` document in a
  mode-`0700` Host-private directory.

The machine document binds the exact workspace root, asset digest, attachment
and scope, named remote processor, and least
Capsule profile. The user sees the asset name, purpose and boundary, Host,
named destination, and Allow/Decline action. The Host—not the user—handles
attachment IDs, record/task/plan digests, schema versions, scope modes,
approval-source values, and profile identifiers.

The CLI `0.36.0` source candidate includes a low-level `kdna host-consent`
broker for validating a private Host draft, interactive Allow/Decline, atomic
installation, rotation, status and revocation. A real Host launcher must derive
that draft from trusted attachment/LoadPlan facts; neither a user nor a model
should handcraft it. The current broker terminal prompt still displays the
exact digest and role/scope mechanics, so direct CLI use is an evaluator path,
not yet the human-only default surface described above.

The consent is reusable only inside those exact declared coordinates. Asset
bytes, attachment scope, Host, destination, workspace, profile, or user-control
drift requires a new meaningful approval. A Host can atomically replace the
document at the same fixed private path, so a long-running MCP process accepts
the newly approved coordinates without restart. A change during one load
suppresses that result; the request must be retried against the new consent.
Tool arguments cannot select or replace this authority. The adapter rejects an
unknown destination and will not accept a remote Host's self-asserted
`verified_local_only` label. Verifiable local-model processing is deferred in
this source candidate; only a named processing destination is implemented.
Consent files are adapter-private coordinates, not Runtime Capsule fields, and
the adapter never writes a decrypted Capsule copy to disk.

For an exact password-protected workspace attachment, the Host process may set
`KDNA_MCP_AUTHORIZATION_FILE` to one absolute, regular, non-symlink file owned
by the current user and private to that user. The adapter reads the bounded
value only when the selected LoadPlan requires a password, passes it only to
the pinned CLI through `load --password-stdin`, removes the coordinate from
the CLI child environment, and never returns it. The caller owns creation and
destruction of this process-scoped file on success, cancellation, or Host
exit; do not place it in the workspace or Host configuration repository.
Without a provider, a protected workspace load returns
structured `authorization_required`. A wrong value returns
`authorization_rejected` without echoing it. Ordinary public assets neither
require nor consume the provider. `pass` is a development credential source,
not a user product requirement.

This authorization-file contract is a component integration boundary, not a
manual user workflow. A user must not create the file, export the coordinate,
or send a password through model chat. Codex and OpenCode have not yet proven
a native model-hidden secret provider, so protected workspace loading in those
Host guides remains deferred. The ordinary unencrypted workspace path is
independent and does not consume this provider.

`kdna.workspace-load` visibly returns the `load`, `ask`, `skip`, or `block`
decision, exact identity/version/digest, configured scope, reason, integrity
and authorization conclusions, CLI control commands, LoadPlan, and—only after
a permitted load—the Runtime Capsule. When the loaded Capsule carries judgment
axioms, the adoption result also includes `judgment_decision` at the top level:
the rules with their `applies_when`, `does_not_apply_when`, and `failure_risk`
are surfaced there so a Host can bind them as decision criteria instead of
treating the projection as a mere task-direction hint.

## Candidate development

The checked-in lock uses exact merged CLI and Core tarballs only for source and
CI acceptance. Candidate artifacts are excluded from the published MCP pack.

```bash
cd mcp-server
npm ci --ignore-scripts
npm test
node bin/kdna-mcp.mjs
```

The release dependency guard intentionally rejects the candidate lock. A
future registry release requires the exact CLI and Core versions to exist on
the official npm registry and a freshly generated lock with no `file:`
resolution before MCP publication can proceed.

## Host configuration candidate

During source acceptance, configure exactly one Host with the local server
entry, then test it before configuring another Host:

```json
{
  "mcpServers": {
    "kdna": {
      "command": "node",
      "args": ["/absolute/path/to/kdna-skills/mcp-server/bin/kdna-mcp.mjs"],
      "env": {
        "KDNA_MCP_WORKSPACE_ROOT": "/absolute/path/to/one/project",
        "KDNA_MCP_HOST_ID": "one-host",
        "KDNA_MCP_HOST_PROCESSING_CONSENT_FILE": "/absolute/private/host/processing-consent.json"
      }
    }
  }
}
```

Configuration location, approval policy, and shape remain Host-specific. Do
not copy this entry into every installed Host automatically. The
[Codex](../integrations/codex/README.md) and
[OpenCode](../integrations/opencode/README.md) guides are benchmark
configuration candidates; OpenCode is verified at `1.18.11` for the
ordinary-task single-Host loop and Codex remains `RECHECK_REQUIRED` pending
account recovery.

## Workspace flow

The user creates the relationship through the CLI, outside MCP:

```bash
secure-host-attachment-json | kdna attach ./judgment.kdna \
  --cwd ./my-project --attachment-stdin --preview
secure-host-attachment-json | kdna attach ./judgment.kdna \
  --cwd ./my-project --attachment-stdin --yes \
  --consent-digest sha256:<digest-from-preview>
kdna attachments --cwd ./my-project
```

The Host's bounded stdin producer supplies identical final policy bytes to
preview and confirmation. Agent/MCP guidance must not expose private role or
scope in argv, and an unbound `--yes` is not consent.

For each task, the Host passes its current workspace and task to
`kdna.workspace-load`. The adapter passes bounded strict-UTF-8 task bytes to
the official resolver over stdin and never places them in argv, environment,
an incidental task file, or the attachment record. If the resolver returns
`ask`, `skip`, or `block`, no plan or capsule is produced. An `ask` includes a
receipt-bound one-task selection plan; after the user chooses, the Host repeats
the exact task and current root with that selection so the same request can
load exactly one candidate.

When the process authorization file is configured, the adapter asks the
official resolver to evaluate only the protected attachment's public scope
while authorization remains `required`. It then obtains the ordinary
pre-authorization LoadPlan and invokes the real password-verified load. Only a
successful decryption upgrades the delivered adoption result to
`authorization: "satisfied"` and includes a Runtime Capsule.

The workspace argument must resolve inside the MCP process's mandatory
`KDNA_MCP_WORKSPACE_ROOT`. That absolute root is fixed at process launch,
cannot be supplied or changed by a tool call, and must not be HOME or a
filesystem root, or symlink. The adapter passes the same root to every CLI status/resolver lookup,
rejects sibling or parent escapes and home-level attachment authority, and
selects only the nearest record inside the boundary. One load remains bound to
the same exact workspace record, selected attachment, scope, and snapshot
through result delivery. If any of those facts changes, the adapter returns
`workspace_binding_changed` without a Runtime Capsule and does not re-resolve
against another workspace.

One qualified Host can complete one functional consumption loop. The current
Codex+OpenCode pair is a separate portability benchmark, not a requirement for
every installation. Studio product integration is deferred and must later
reuse the CLI/Core state rather than introduce another attachment authority.

## Host responsibility

The Host must keep adoption visible and preserve current facts, explicit user
intent, law, safety policy, system instructions, and Host permissions above
asset content. It must not treat output quality as authorization or use an
unattached file merely because it exists.

Adoption visibility is unconditional: the Host must surface that KDNA was
used, which asset, and the disable/switch/rollback controls whenever a loaded
projection influences an answer, regardless of whether the user asked about
KDNA. Silence about KDNA is a disclosure failure even when the answer is
correct.

The MCP transport protocol coordinate `2024-11-05` is independent of KDNA's
runtime contracts. Returning a Runtime Capsule does not claim Host execution,
fabricate a receipt, or create a Judgment Trace.
