> [aikdna.com](https://aikdna.com) -- Official website . [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

# KDNA Skills

**One loader. Many domains.**

This repository does not turn KDNA into a skill. It provides adapter skills that allow AI agents to load KDNA.

The `kdna-loader` skill is the official agent adapter for the KDNA toolchain. It teaches AI agents how to discover, load, and apply `.kdna` assets managed by the official KDNA CLI.

**KDNA shapes judgment, not tool permission.** KDNA does not override system or safety policy. The runtime trace vocabulary records explicit status values (version_incompatible, failed_to_parse, failed_to_decrypt, signature_invalid, blocked_by_runtime_policy) so that the loader cannot quietly succeed while producing garbage. See KDNA Core trace vocabulary.

Requires `@aikdna/kdna-cli` CLI:

```bash
npm i -g @aikdna/kdna-cli
kdna setup
```

## How it works

| What | Where |
|---|---|
| **kdna-loader** (single skill) | Installed into your agent by `kdna setup`. Teaches the agent the protocol for KDNA discovery and application. |
| **KDNA assets** (data) | Local v1 `.kdna` containers. Discover them through local paths or MCP `kdna.available-local`; load them on demand per task. |
| **kdna CLI** (tool) | `kdna inspect`, `kdna validate`, `kdna plan-load`, `kdna load`. Stable runtime control plane for v1 assets. |

## Supported Agents

`kdna setup` auto-detects and installs `kdna-loader` into:

| Agent | Skill Path | Guide |
|-------|-----------|-------|
| **Codex** | `~/.codex/skills/kdna-loader/` | [Setup guide →](integrations/codex/) |
| **Claude Code** | `~/.claude/skills/kdna-loader/` | [Setup guide →](integrations/claude-code/) |
| **OpenCode** | `~/.agents/skills/kdna-loader/` | [Setup guide →](integrations/opencode/) |
| **Cursor** | `~/.cursor/skills/kdna-loader/` | [Setup guide →](integrations/cursor/) |
| **GitHub Copilot** | `~/.agents/skills/kdna-loader/` | Manual setup required |

All agents share the same KDNA asset store: `~/.kdna/packages/` plus `~/.kdna/index.json`.

## MCP Server

This repository also includes a minimal MCP adapter in
[`mcp-server/`](./mcp-server). Use it when an agent runtime supports MCP and
should access KDNA through stable tools instead of reading KDNA internals
directly.

Exposed tools:

- `kdna.inspect`
- `kdna.verify`
- `kdna.plan-load` (planned)
- `kdna.load`
- `kdna.available-local`
- `kdna.match`
- `kdna.available` (legacy registry compatibility)

## Quick Install

```bash
npm i -g @aikdna/kdna-cli
kdna setup
kdna validate ./writing-v1.kdna
kdna plan-load ./writing-v1.kdna --json
kdna load ./writing-v1.kdna --profile=compact --as=prompt
kdna doctor --agents
```

## After Installing

### Load domain cognition

The agent automatically decides per task whether KDNA applies. When a domain fits, it loads silently -- applying axioms, using preferred terminology, honoring boundaries, and running self-checks. The user sees better judgment, not KDNA internals.

### Install more domains

```bash
kdna load ./writing.kdna --profile=compact --as=prompt
kdna validate ./writing.kdna
```

### Create your own KDNA

Agents and skills do not create formal KDNA assets. They may help draft
judgment proposals or candidate cards, but Human Lock and compile/export must
happen in KDNA Studio or a Studio-compatible compiler.

A `.kdna` asset is not created by writing JSON files. It is compiled by a
Studio-compatible authoring pipeline that performs human confirmation,
validation, canonicalization, identity generation, digest computation, and
provenance recording. Signature and encryption are future security phases, not
part of the current open v1 toolchain baseline.

Use the **KDNA Studio CLI** or Studio-compatible SDK/CLI to create and export
v1 `.kdna` containers.

## How kdna-loader works (7-part protocol)

1. **Decide** whether KDNA applies at all (skip for formatting, lookup, code execution)
2. **Discover** local domains via the CLI or MCP local inventory
3. **Evaluate** fit per domain (checks `applies_when` / `does_not_apply_when`)
4. **Select** 0 or 1 domain (never silently blend multiple)
5. **Plan** via `kdna plan-load <file.kdna> --json`
6. **Load** only when Core/CLI reports `can_load_now=true`, via `kdna load <file.kdna> --profile=compact --as=prompt`
7. **Apply** silently -- reason from axioms, never quote KDNA to user
8. **Respect** boundaries -- user intent > evidence > safety > skills

See [docs/KDNA_LOADER_CONTRACT.md](docs/KDNA_LOADER_CONTRACT.md).

## Manual Installation

```bash
# Codex
mkdir -p ~/.codex/skills/kdna-loader
cp kdna-loader/SKILL.md ~/.codex/skills/kdna-loader/SKILL.md

# Claude Code
mkdir -p ~/.claude/skills/kdna-loader
cp kdna-loader/SKILL.md ~/.claude/skills/kdna-loader/SKILL.md

# OpenCode
mkdir -p ~/.agents/skills/kdna-loader
cp kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
```

## License

Apache-2.0

[中文](./README.zh.md)
