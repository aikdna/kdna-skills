# KDNA MCP Server

`@aikdna/kdna-mcp-server` is a thin stdio MCP adapter for explicit `.kdna`
files and user-approved workspace attachments. It delegates every inspection,
integrity, authorization, resolver, plan, and load decision to the pinned KDNA
CLI/Core runtime.

## Source status

The `0.5.0` source tree is a Development Preview candidate verified through
independent Codex and OpenCode MCP configurations. It binds the merged
`@aikdna/kdna-cli@0.36.0` candidate, whose single Core runtime is
`@aikdna/kdna-core@0.21.0`. Those two dependency versions are not yet registry
releases, so this source checkpoint is not installable from npm and makes no
publication claim.

The npm registry still serves MCP `0.4.2`; that historical package is not the
workspace-attachment candidate described here.

## Tool boundary

| Tool                     | Purpose                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| `kdna.inspect`           | Inspect one explicitly selected `.kdna` file                        |
| `kdna.verify`            | Validate one explicitly selected `.kdna` file                       |
| `kdna.plan-load`         | Return the official LoadPlan for one explicit file                  |
| `kdna.load`              | Load one explicit file after official authorization checks          |
| `kdna.workspace-status`  | Show only approved attachments for the supplied workspace           |
| `kdna.workspace-resolve` | Resolve one task against that approved set                          |
| `kdna.workspace-load`    | Resolve, plan, authorize, and load only when the decision is `load` |

There is no global discovery, task-to-asset matching, attachment mutation,
password input, or caller-supplied entitlement state. The adapter cannot
attach, enable, disable, switch, roll back, or remove a workspace attachment.

`kdna.workspace-load` visibly returns the `load`, `ask`, `skip`, or `block`
decision, exact identity/version/digest, configured scope, reason, integrity
and authorization conclusions, CLI control commands, LoadPlan, and—only after
a permitted load—the Runtime Capsule.

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
      "args": ["/absolute/path/to/kdna-skills/mcp-server/bin/kdna-mcp.mjs"]
    }
  }
}
```

Configuration location, approval policy, and shape remain Host-specific. Do
not copy this entry into every installed Host automatically. See the verified
[Codex](../integrations/codex/README.md) and
[OpenCode](../integrations/opencode/README.md) candidate guides.

## Workspace flow

The user creates the relationship through the CLI, outside MCP:

```bash
kdna attach ./judgment.kdna --cwd ./my-project \
  --role article-writing --applies-to draft --does-not-apply-to code --yes
kdna attachments --cwd ./my-project
```

For each task, the Host passes its current workspace and task to
`kdna.workspace-load`. The adapter uses a private bounded task file to invoke
the official resolver, removes that file immediately, and never writes the
task into the attachment record. If the resolver returns `ask`, `skip`, or
`block`, no plan or capsule is produced.

The workspace argument must resolve inside the MCP process's Host launch root.
Configure the server's working directory as the current Host workspace. The
adapter rejects sibling or parent escapes and does not inherit a record above
that explicit Host root.

## Host responsibility

The Host must keep adoption visible and preserve current facts, explicit user
intent, law, safety policy, system instructions, and Host permissions above
asset content. It must not treat output quality as authorization or use an
unattached file merely because it exists.

The MCP transport protocol coordinate `2024-11-05` is independent of KDNA's
runtime contracts. Returning a Runtime Capsule does not claim Host execution,
fabricate a receipt, or create a Judgment Trace.
