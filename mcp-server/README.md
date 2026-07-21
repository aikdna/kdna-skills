# KDNA MCP Server

`@aikdna/kdna-mcp-server` exposes KDNA as MCP tools so agent runtimes can use
packaged `.kdna` assets without learning the container internals. Stdio-only,
minimal footprint. The npm package source lives in this repository under
[`mcp-server/`](./); there is no separate public `kdna-mcp-server` repository.

## Adapter status

The MCP server is an experimental structured bridge. The `kdna-loader` Skill is
currently Unassessed. Neither adapter may create user authorization by finding
or matching a file.

| Approach | Best for |
|----------|----------|
| `kdna-loader` skill | Unassessed thin adapter for one exact approved attachment |
| MCP server | Experimental inspect/verify/plan/load tools for an explicit file |

## Tools

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `kdna.inspect` | Inspect a `.kdna` asset | File path | Structured metadata |
| `kdna.verify` | Verify asset integrity state | File path | Pass/fail with reasons |
| `kdna.plan-load` | Return Core LoadPlan before loading | File path, optional password-presence or entitlement state | LoadPlan JSON |
| `kdna.load` | Load an authorized `.kdna` profile | File path, optional profile, password, or entitlement state | Runtime Capsule |
| `kdna.available-local` | List local `.kdna` assets | Root directory | Local asset inventory |
| `kdna.match` | Rank candidate assets for a task string | Task description | Scored list with fit signals |

## Install & Run

The commands below currently resolve the published MCP 0.4.1 package. They do
not install or prove the MCP 0.4.2 / Core 0.20.0 source checkpoint described in
this repository's current changelog; those candidates must remain a coordinated
package set and must not be mixed with the published wave.

```bash
npm install -g @aikdna/kdna-mcp-server
kdna-mcp
```

### Configure in your MCP client

**Claude App / Claude Code (`claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "kdna": {
      "command": "npx",
      "args": ["-y", "@aikdna/kdna-mcp-server"]
    }
  }
}
```

**Codex:**

```json
{
  "mcpServers": {
    "kdna": {
      "command": "npx",
      "args": ["-y", "@aikdna/kdna-mcp-server"]
    }
  }
}
```

**OpenCode (`opencode.json`):**

```json
{
  "mcpServers": {
    "kdna": {
      "command": "npx",
      "args": ["-y", "@aikdna/kdna-mcp-server"]
    }
  }
}
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `KDNA_ASSET_DIR` | Root directory for `kdna.available-local`; overrides the default |
| `KDNA_PACKAGE_DIR` | Package directory fallback for `kdna.available-local` |
| `KDNA_DATA_ROOT` | Override KDNA data directory (default: `~/.kdna`) |

When no override is provided, `kdna.available-local` scans
`~/.kdna/packages`. Explicit local roots can be provided when a user keeps
assets elsewhere.

This is a published implementation behavior, not the canonical KDNA user
model. Inventory output is never consent, authorization, applicability, or a
recommendation. New integrations should pass an explicit asset path to
`inspect`, `plan-load`, and `load`.

## Local Development

```bash
cd mcp-server
npm install
node bin/kdna-mcp.mjs
```

## Example: Verify and Load a Domain via MCP

```
# Client calls kdna.available-local { root: "./dist" }
# Client calls kdna.verify { assetPath: "./dist/writing.kdna" }
# Client calls kdna.plan-load { assetPath: "./dist/writing.kdna" }
# Or kdna.plan-load { assetPath: "./dist/writing.kdna", entitlementStatus: "active" }
# Client calls kdna.load { assetPath: "./dist/writing.kdna", profile: "compact" }
# Agent consumes only the returned Runtime Capsule context
```

In the 0.4.2 source checkpoint, the returned Capsule uses
`type: "kdna.runtime-capsule"` and
`contract_version: "0.1.0"`. The KDNA Agent Host protocol has the independent
coordinate `protocol_version: "0.1.0"`; it is not the MCP transport's
`protocolVersion`. This bridge does not execute an Agent Host and therefore
does not create or claim a Host receipt or Judgment Trace. A consuming Host
must use Core's correlated runtime-contract APIs for that boundary.

## Host responsibility

The MCP client must receive one explicit file or exact user-approved
attachment, keep active identity/version/scope/reason visible, and provide
disable/switch/rollback controls. It must not use `available-local` plus `match`
as autonomous authority.
