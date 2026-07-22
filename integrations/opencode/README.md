# KDNA with OpenCode

> **Status:** MCP source candidate verified with OpenCode `1.18.4`. This is not
> a claim that the unpublished MCP `0.5.0` candidate is available from npm.

Configure only the KDNA MCP adapter in the intended OpenCode workspace:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "kdna": {
      "type": "local",
      "command": [
        "node",
        "/absolute/path/to/kdna-skills/mcp-server/bin/kdna-mcp.mjs"
      ],
      "cwd": ".",
      "enabled": true
    }
  },
  "permission": {
    "kdna_*": "allow"
  }
}
```

`permission` is the current OpenCode control for MCP tools. The older boolean
`tools` map is intentionally omitted.

The MCP surface is read/load-only. Use `kdna attachments` and the explicit CLI
disable/switch/rollback commands to control the workspace relation; OpenCode's
adapter cannot mutate it. For each task, call `kdna.workspace-load` with the
current OpenCode workspace and task.

Real-Host acceptance covered one in-scope `load` and one out-of-scope `skip` on
the same workspace used by Codex. Both Hosts reported the same attachment,
version, digest, scope, authorization, integrity, and reason. The skip produced
no LoadPlan or Runtime Capsule.

The fallback Skill path is `~/.agents/skills/kdna-loader/`; Skill-file presence
alone is not MCP configuration or support evidence.
