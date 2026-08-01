# KDNA with OpenCode

> **Status:** `RECHECK_REQUIRED`. OpenCode `1.18.10` is the current benchmark
> coordinate, not a current Host-delivery or semantic-adoption claim. The
> unpublished MCP `0.5.0` candidate is not available from npm.

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
      "environment": {
        "KDNA_MCP_WORKSPACE_ROOT": "/absolute/path/to/one/project",
        "KDNA_MCP_HOST_ID": "opencode",
        "KDNA_MCP_HOST_PROCESSING_CONSENT_FILE": "/absolute/private/host/processing-consent.json"
      },
      "enabled": true
    }
  },
  "permission": {
    "*": "ask",
    "kdna_kdna_workspace-status": "allow",
    "kdna_kdna_workspace-resolve": "allow",
    "kdna_kdna_workspace-load": "allow"
  }
}
```

`permission` is the current OpenCode control for MCP tools. The older boolean
`tools` map is intentionally omitted. OpenCode names MCP tools by combining
the server name and normalized tool name, so these are exact permissions, not
a `kdna_*` wildcard that could silently authorize a future mutation tool.
The source candidate exposes only the three record-bound workspace tools.
Explicit user-selected files use the official CLI through the loader Skill;
there is no generic arbitrary-path MCP tool for a model to guess.

The MCP surface is read/load-only. Use `kdna attachments` and the explicit CLI
disable/switch/rollback commands to control the workspace relation; OpenCode's
adapter cannot mutate it. For each task, call `kdna.workspace-load` with the
current OpenCode workspace and task.

Tool availability alone does not cause that call. Install a visible,
project-private OpenCode instruction requiring `kdna.workspace-load` before
answering each ordinary project task, without adding KDNA/tool words to the
task itself. It must pass the immutable root and exact task bytes, respect
`ask`/`skip`/`block`, and use content only from a returned non-empty Capsule.
Remove that instruction and MCP entry to revoke integration. Do not commit
personal Host configuration or private attachment facts to a public
repository.

Protected workspace loading is currently `DEFERRED` for standard OpenCode. The
MCP component accepts a mode-`0600` process authorization source, but no native
OpenCode model-hidden secret provider has yet been proven to create, bind, and
destroy it. Do not ask a user to handcraft that file, export its path, or send a
password in chat. The ordinary unencrypted workspace path remains the current
benchmark path; protected explicit files may still use the official CLI's
interactive stdin outside model context.

The processing-consent path is Host-private and mode `0600` under a mode
`0700` directory. It binds the exact asset, workspace policy, Host, named
remote processor, and minimum projection after one plain-language user
approval. A finished OpenCode integration must hide the machine fields. A newly approved asset,
destination, or projection is installed by atomically replacing the same
private file; the server accepts the new coordinates without a restart and
rejects an in-flight change. This candidate does not accept an unverifiable
`local-only` self-claim.

The CLI source candidate provides `kdna host-consent` as the low-level broker
that validates a trusted private draft, asks Allow/Decline, installs the fixed
file atomically and supports `--status`/`--revoke`. This guide does not provide
a native OpenCode launcher that derives that draft from trusted workspace
facts. The current broker's terminal prompt also displays digest and role/scope
mechanics. Treat direct broker use as evaluator integration, not proof that the
ordinary OpenCode UX hides machine fields. Host support remains
`RECHECK_REQUIRED` until an ordinary task both activates the tool and follows
the returned judgment without overapplication.

Earlier Host receipts are superseded and are not current authority. A rebuilt
check must separately prove delivery, non-empty Runtime Capsule coordinates,
and semantic adoption for the same frozen task; coordinate equality and tool
output alone do not establish those results.

One qualified Host can close one functional consumption loop. OpenCode is one
coordinate in the separate Codex+OpenCode `PORTABILITY_BENCHMARK`; two Hosts
are not a product minimum for one user, task, or installation. Studio
integration is deferred.

The fallback Skill path is `~/.agents/skills/kdna-loader/`; Skill-file presence
alone is not MCP configuration or support evidence.

## Creation

Creation support is a separate **Unassessed source candidate**. Place
`kdna-creator/` under the intended OpenCode-compatible skills directory and
invoke the Studio CLI over one explicit project path:

```bash
kdna-studio resume ./my-judgment --json
```

Use the [Creation Agent contract](../../docs/KDNA_CREATION_AGENT_CONTRACT.md).
Do not grant creation writes through the read/load-only MCP surface. This
guide does not establish OpenCode Creation Engine acceptance.
