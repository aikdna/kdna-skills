# KDNA MCP Server

`@aikdna/kdna-mcp-server` exposes KDNA as MCP tools so agent runtimes can use
`.kdna` assets without learning the container internals. Stdio-only, minimal footprint.

## Why MCP instead of the kdna-loader skill?

The `kdna-loader` skill teaches an agent the full KDNA protocol (7-part routing, silent loading, boundary respect). The MCP server provides a lower-level bridge — use it when you need programmatic access to `.kdna` assets through structured tool calls rather than letting the agent drive the CLI.

| Approach | Best for |
|----------|----------|
| `kdna-loader` skill | Full KDNA protocol: routing, fit evaluation, silent application |
| MCP server | Programmatic inspect/verify/load/match from any MCP-compatible runtime |

## Tools

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `kdna.inspect` | Inspect a `.kdna` asset: manifest, entries, digests, quality, risk | File path or asset name | Structured metadata |
| `kdna.verify` | Verify asset integrity: digest, signature, trust gate | File path or asset name | Pass/fail with reasons |
| `kdna.load` | Load and render a `.kdna` profile for agent context | Asset name, optional format | Prompt-mode text or raw JSON |
| `kdna.match` | Rank candidate assets for a task string | Task description | Scored list with fit signals |
| `kdna.available` | List entries from a local Registry `domains.json` | Optional scope filter | Available domain list |

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
| `KDNA_REGISTRY_FILE` | Path to `domains.json` for `kdna.available` |
| `KDNA_DATA_ROOT` | Override KDNA data directory (default: `~/.kdna`) |

## Local Development

```bash
cd mcp-server
npm install
node bin/kdna-mcp.mjs
```

## Example: Verify and Load a Domain via MCP

```
# Client calls kdna.available → ["@aikdna/writing", "@aikdna/code_review"]
# Client calls kdna.verify { name: "@aikdna/writing" } → { valid: true }
# Client calls kdna.load { name: "@aikdna/writing", format: "prompt" } → prompt text
# Agent injects prompt text into system context
```

## Relationship to kdna-loader skill

The MCP server and kdna-loader skill are complementary:
- **kdna-loader** = agents that can run CLI commands (Codex, Claude Code, OpenCode, Cursor)
- **MCP server** = any MCP-compatible runtime (including the above, plus custom agents)

For most users, the kdna-loader skill (installed by `kdna setup`) is the recommended path. Use the MCP server when you need programmatic, tool-based access.
