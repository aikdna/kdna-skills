# KDNA with Codex

> **Status:** MCP source candidate verified with Codex CLI `0.144.3`. This is
> not a claim that the unpublished MCP `0.5.0` candidate is available from npm.

Configure only the KDNA MCP adapter for the Codex workspace where you intend to
use it. During source acceptance, point Codex at the local candidate:

```toml
[mcp_servers.kdna]
command = "node"
args = ["/absolute/path/to/kdna-skills/mcp-server/bin/kdna-mcp.mjs"]
cwd = "."
enabled_tools = [
  "kdna.workspace-status",
  "kdna.workspace-resolve",
  "kdna.workspace-load",
]
default_tools_approval_mode = "approve"
```

The approved tool list is read/load-only. It cannot create or mutate workspace
attachments. Use the CLI for controls:

```bash
kdna attachments --cwd ./my-project
kdna disable <attachment-id> --cwd ./my-project
kdna switch <attachment-id> ./new-judgment.kdna --cwd ./my-project --yes
kdna rollback <attachment-id> --cwd ./my-project
```

Real-Host acceptance covered one in-scope `load` and one out-of-scope `skip` on
the same workspace. The load exposed identity, version, digest, scope, reason,
authorization, integrity, disable/switch/rollback controls, LoadPlan, and
Runtime Capsule. The skip produced no LoadPlan or Capsule.

The fallback Skill path is `~/.codex/skills/kdna-loader/`; Skill-file presence
alone is not MCP configuration or support evidence.

## Creation

Creation support is a separate **Unassessed source candidate**. Place
`kdna-creator/` in the intended Codex skill directory and invoke the Studio CLI
over one explicit project path:

```bash
kdna-studio resume ./my-judgment --json
```

Use the [Creation Agent contract](../../docs/KDNA_CREATION_AGENT_CONTRACT.md).
Do not add creation writes to the verified read/load MCP tool list. This guide
does not establish Codex Creation Engine acceptance.
