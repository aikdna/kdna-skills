# KDNA MCP Server

`@aikdna/kdna-mcp-server` exposes KDNA as MCP tools so agent runtimes can use
packaged `.kdna` assets without learning the container internals. Stdio-only,
minimal footprint. The npm package source lives in this repository under
[`mcp-server/`](./); there is no separate public `kdna-mcp-server` repository.

## Why MCP instead of the kdna-loader skill?

The `kdna-loader` skill teaches an agent the full KDNA protocol (7-part routing, silent loading, boundary respect). The MCP server provides a lower-level bridge — use it when you need programmatic access to `.kdna` assets through structured tool calls rather than letting the agent drive the CLI.

| Approach | Best for |
|----------|----------|
| `kdna-loader` skill | Full KDNA protocol: routing, fit evaluation, silent application |
| MCP server | Programmatic inspect/verify/load/match from any MCP-compatible runtime |

## Tools

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `kdna.inspect` | Inspect a v1 `.kdna` asset or legacy asset | File path | Structured metadata |
| `kdna.verify` | Verify asset integrity state | File path | Pass/fail with reasons |
| `kdna.plan-load` | Return Core LoadPlan before loading | File path, optional password or entitlement state | LoadPlan JSON |
| `kdna.load` | Load and render a `.kdna` profile for agent context | File path, optional profile | Prompt-mode text or raw JSON |
| `kdna.available-local` | List local v1 `.kdna` assets without registry dependency | Root directory | Local v1 asset inventory |
| `kdna.match` | Rank candidate assets for a task string | Task description | Scored list with fit signals |
| `kdna.available` | Legacy registry compatibility only | `domains.json` path | Legacy domain list |

## Install & Run

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
| `KDNA_REGISTRY_FILE` | Legacy path to `domains.json` for `kdna.available` |
| `KDNA_DATA_ROOT` | Override KDNA data directory (default: `~/.kdna`) |

When no override is provided, `kdna.available-local` scans
`~/.kdna/packages`. Older `~/.kdna/assets` paths are legacy compatibility or
explicitly configured roots, not the current default.

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
# Agent injects prompt text into system context
```

## Relationship to kdna-loader skill

The MCP server and kdna-loader skill are complementary:
- **kdna-loader** = agents that can run CLI commands (Codex, Claude Code, OpenCode, Cursor)
- **MCP server** = any MCP-compatible runtime (including the above, plus custom agents)

For most users, the kdna-loader skill (installed by `kdna setup`) is the recommended path. Use the MCP server when you need programmatic, tool-based access.
