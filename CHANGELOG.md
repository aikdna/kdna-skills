# Changelog

## 2026-07 (MCP v0.3.0)

- Move the MCP server to the single current Core API and CBOR fixtures.
- Return Runtime Capsules instead of reading or rendering raw payload content.
- Rewrite the loader contract around toolchain-only parsing, single-asset
  default, and explicit Cluster mode.

## 2026-06
- kdna-loader skill updated for the packaged KDNA runtime.
- install script updated to install @aikdna/kdna-cli.

## 2026-06 (v0.2.4)
- MCP server: add prepublishOnly gate with release-check.
- Add CODEOWNERS, DCO, CI workflow.
- Shell script linting fixes.

## 2026-05 (v0.2.0)
- Initial public release of kdna-loader skill and MCP server.
- Cross-agent support: Claude Code, Codex, OpenCode, Cursor.
