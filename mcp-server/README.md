# KDNA MCP Server

`@aikdna/kdna-mcp-server` exposes KDNA as MCP tools so agent runtimes can use
`.kdna` assets without learning the container internals.

The server is intentionally small and stdio-only. It depends on
`@aikdna/kdna-core` for asset-first loading and verification.

## Tools

| Tool | Purpose |
| --- | --- |
| `kdna.inspect` | Inspect a `.kdna` asset: manifest, entries, digests, quality, risk. |
| `kdna.verify` | Verify asset integrity, digest, and optionally signature. |
| `kdna.load` | Load and render a `.kdna` profile for agent context. |
| `kdna.match` | Rank candidate assets for a task string. |
| `kdna.available` | List entries from a local Registry `domains.json`. |

## Run

```bash
npm install -g @aikdna/kdna-mcp-server
kdna-mcp
```

For local development:

```bash
cd mcp-server
npm install
node bin/kdna-mcp.mjs
```

Set `KDNA_REGISTRY_FILE=/path/to/domains.json` to enable `kdna.available`.
