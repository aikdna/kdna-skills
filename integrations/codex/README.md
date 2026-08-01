# KDNA with Codex

> **Status:** `RECHECK_REQUIRED`. Codex CLI `0.144.3` is the current benchmark
> coordinate, not a current Host-delivery or semantic-adoption claim. The
> unpublished MCP `0.5.0` candidate is not available from npm.

Configure only the KDNA MCP adapter for the Codex workspace where you intend to
use it. During source acceptance, point Codex at the local candidate:

```toml
[mcp_servers.kdna]
command = "node"
args = ["/absolute/path/to/kdna-skills/mcp-server/bin/kdna-mcp.mjs"]
enabled_tools = [
  "kdna.workspace-status",
  "kdna.workspace-resolve",
  "kdna.workspace-load",
]
default_tools_approval_mode = "approve"

[mcp_servers.kdna.env]
KDNA_MCP_WORKSPACE_ROOT = "/absolute/path/to/one/project"
KDNA_MCP_HOST_ID = "codex"
KDNA_MCP_HOST_PROCESSING_CONSENT_FILE = "/absolute/private/host/processing-consent.json"
```

The approved tool list is read/load-only. It cannot create or mutate workspace
attachments. It intentionally excludes `kdna.inspect`, `kdna.verify`,
`kdna.plan-load`, and generic `kdna.load`: those arbitrary explicit-file tools
are not exposed by this MCP candidate. A user-selected file uses the official
CLI through the loader Skill with one meaningful use-once approval. Use the
explicit CLI disable/switch/rollback controls:

```bash
kdna attachments --cwd ./my-project
kdna disable <attachment-id> --cwd ./my-project
kdna switch <attachment-id> ./new-judgment.kdna --cwd ./my-project \
  --retain-scope --preview
kdna rollback <attachment-id> --cwd ./my-project
```

The root environment value is immutable for the MCP process and must be one
absolute project directory; `cwd` tool arguments may name only subdirectories
inside it. Do not use HOME, the package installation directory, or a
last-used-project fallback.

Tool configuration alone does not activate KDNA for ordinary tasks. In the
project-private Codex instruction layer, install a visible bootstrap requiring
`kdna.workspace-load` before answering each ordinary project task, without
putting KDNA/tool words into that task. The bootstrap must pass the fixed
project root and exact task bytes, respect `ask`/`skip`/`block`, and use content
only from a returned non-empty Capsule. Remove that project instruction and
the MCP entry to revoke integration. Do not commit a personal Host
configuration or private attachment facts to a public repository.

Protected workspace loading is currently `DEFERRED` for standard Codex. The MCP
component accepts a mode-`0600` process authorization source, but no native
Codex model-hidden secret provider has yet been proven to create, bind, and
destroy it. Do not ask a user to handcraft that file, export its path, or send a
password in chat. The ordinary unencrypted workspace path remains the current
benchmark path; protected explicit files may still use the official CLI's
interactive stdin outside model context.

The processing-consent file is Host-private mode `0600` under a mode `0700`
directory. After one plain-language approval it binds the exact asset,
workspace policy, Codex identity, named remote processor, and minimum
projection. A finished Codex integration must hide all machine fields. A newly approved coordinate is
installed by atomically replacing the same private file; no MCP restart is
needed, and an in-flight replacement suppresses the current Capsule. This
candidate rejects unverifiable `local-only` self-claims.

The CLI source candidate provides `kdna host-consent` as the low-level broker
that validates a trusted private draft, asks Allow/Decline, installs the fixed
file atomically and supports `--status`/`--revoke`. This guide does not provide
a native Codex launcher that derives that draft from trusted workspace facts.
The current broker's own terminal prompt also displays digest and role/scope
mechanics. Treat direct broker use as evaluator integration, not proof that the
ordinary Codex UX hides machine fields or that an ordinary task activates and
follows KDNA without an explicit MCP instruction.

Earlier Host receipts are superseded and are not current authority. A rebuilt
check must separately prove delivery, non-empty Runtime Capsule coordinates,
and semantic adoption for the same frozen task; component tests and tool output
alone do not establish those results.

One qualified Host can close one functional consumption loop. Codex is one
coordinate in the separate Codex+OpenCode `PORTABILITY_BENCHMARK`; two Hosts
are not a product minimum for one user, task, or installation. Studio
integration is deferred.

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
Do not add creation writes to the read/load-only MCP tool list. This guide
does not establish Codex Creation Engine acceptance.
