> [aikdna.com](https://aikdna.com) -- Official website . [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

# KDNA Skills

**One loader. Many domains.**

This repository does not turn KDNA into a skill. It provides adapter skills that allow AI agents to load KDNA.

The `kdna-loader` skill teaches AI agents a protocol for discovering, loading, and applying KDNA domain cognition packages. Domains are `.kdna` assets managed by `kdna` CLI, not separate skills.

**KDNA shapes judgment, not tool permission.** KDNA does not override system or safety policy. Unsigned, yanked, or high-risk domains are not silently trusted. See [KDNA Governance](https://github.com/aikdna/kdna/blob/main/docs/GOVERNANCE.md).

Requires `@aikdna/kdna-cli` CLI:

```bash
npm i -g @aikdna/kdna-cli
kdna setup
```

## How it works

| What | Where |
|---|---|
| **kdna-loader** (single skill) | Installed into your agent by `kdna setup`. Teaches the agent the protocol for KDNA discovery and application. |
| **KDNA assets** (data) | Installed via `kdna install <name>`. Stored as immutable `.kdna` files under `~/.kdna/packages/` and indexed by `~/.kdna/index.json`. Loaded on demand per task. |
| **kdna CLI** (tool) | `kdna install`, `kdna verify`, `kdna load`, `kdna compare`, `kdna publish <file.kdna>`. Stable runtime control plane for existing assets. |

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
- `kdna.load`
- `kdna.match`
- `kdna.available`

## Quick Install

```bash
npm i -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing
kdna doctor --agents
```

## After Installing

### Load domain cognition

The agent automatically decides per task whether KDNA applies. When a domain fits, it loads silently -- applying axioms, using preferred terminology, honoring boundaries, and running self-checks. The user sees better judgment, not KDNA internals.

### Install more domains

```bash
kdna list --available    # Browse registry
kdna install code_review # Install a domain
kdna verify @aikdna/code_review --judgment
```

### Create your own trusted KDNA

Agents and skills do not create trusted KDNA assets. They may help draft
judgment proposals or candidate cards, but Human Lock and compile/export must
happen in KDNA Studio or a Studio-compatible compiler.

A `.kdna` asset is not created by writing JSON files. It is compiled by a
Studio-compatible authoring pipeline that performs human confirmation,
validation, canonicalization, identity generation, digest computation, signing,
optional encryption, and provenance recording.

```bash
kdna install @aikdna/writing
kdna verify @aikdna/writing --judgment
kdna load @aikdna/writing
```

Use the **KDNA Studio** Mac App or Studio-compatible SDK/CLI for Human Lock,
compile, and export.

## How kdna-loader works (7-part protocol)

1. **Decide** whether KDNA applies at all (skip for formatting, lookup, code execution)
2. **Discover** installed domains via `kdna available --json`
3. **Evaluate** fit per domain (checks `applies_when` / `does_not_apply_when`)
4. **Select** 0 or 1 domain (never silently blend multiple)
5. **Load** via `kdna load @scope/name` (prompt mode, ~30-50% smaller than raw JSON)
6. **Apply** silently -- reason from axioms, never quote KDNA to user
7. **Respect** boundaries -- user intent > evidence > safety > skills

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
