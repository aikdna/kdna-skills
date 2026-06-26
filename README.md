> [aikdna.com](https://aikdna.com) — Official website
>
> [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

# KDNA Skills

**One loader. Many domains.**

**Current status: preview / experimental.** The loader and MCP server adapters
are functional for supported agents, but per-agent integration quality varies.
Not all agent runtimes have been tested. Production hardening is deferred until
the KDNA Core v1 official toolchain baseline is complete.

This repository does not turn KDNA into a skill. It provides adapter skills that allow AI agents to load KDNA.

The `kdna-loader` skill is the official agent adapter for the KDNA toolchain. It teaches AI agents how to discover, load, and apply `.kdna` assets managed by the official KDNA CLI.

**KDNA shapes judgment, not tool permission.** KDNA does not override system or safety policy. The runtime trace vocabulary records explicit status values (version_incompatible, failed_to_parse, failed_to_decrypt, signature_invalid, blocked_by_runtime_policy) so that the loader cannot quietly succeed while producing garbage. See KDNA Core trace vocabulary.

Requires `@aikdna/kdna-cli` CLI:

```bash
npm i -g @aikdna/kdna-cli
```

## How it works

| What | Where |
|---|---|
| **kdna-loader** (single skill) | Installed manually into your agent. Teaches the agent the protocol for KDNA discovery and application. |
| **KDNA assets** (data) | Local `.kdna` KDNA Asset Containers. Discover them through local paths or MCP `kdna.available-local`; load them on demand per task. |
| **kdna CLI** (tool) | `kdna inspect`, `kdna validate`, `kdna plan-load`, `kdna load`. Stable runtime control plane for KDNA Core v1 assets. |

## Supported Agents

`kdna setup` auto-detects and installs `kdna-loader` into:

| Agent | Skill Path | Guide |
|-------|-----------|-------|
| **Codex** | `~/.codex/skills/kdna-loader/` | [Setup guide →](integrations/codex/) |
| **Claude Code** | `~/.claude/skills/kdna-loader/` | [Setup guide →](integrations/claude-code/) |
| **OpenCode** | `~/.agents/skills/kdna-loader/` | [Setup guide →](integrations/opencode/) |
| **Cursor** | `~/.cursor/skills/kdna-loader/` | [Setup guide →](integrations/cursor/) |
| **GitHub Copilot** | `~/.agents/skills/kdna-loader/` | Manual setup required |

All agents can share the same local KDNA package store:
`~/.kdna/packages/`. Explicit file paths and MCP `kdna.available-local` roots
are also supported.

## MCP Server

This repository also includes a minimal MCP adapter in
[`mcp-server/`](./mcp-server). Use it when an agent runtime supports MCP and
should access KDNA through stable tools instead of reading KDNA internals
directly.

Exposed tools:

- `kdna.inspect`
- `kdna.verify`
- `kdna.plan-load`
- `kdna.load`
- `kdna.available-local`
- `kdna.match`

## Quick Install

```bash
npm i -g @aikdna/kdna-cli
```

## Try a Demo Asset

```bash
# Download from kdna-assets
curl -LO https://github.com/aikdna/kdna-assets/releases/download/viral-topic-selection-v1.1.0/viral-topic-selection.kdna

kdna validate ./viral-topic-selection.kdna
kdna plan-load ./viral-topic-selection.kdna
kdna load ./viral-topic-selection.kdna --profile=compact --as=prompt
```

## After Installing

### Load a `.kdna` asset

The agent automatically decides per task whether KDNA applies. When a domain fits, it loads silently -- applying axioms, using preferred terminology, honoring boundaries, and running self-checks. The user sees better judgment, not KDNA internals.

### Use another `.kdna` file

```bash
kdna validate ./your-domain.kdna
kdna plan-load ./your-domain.kdna
kdna load ./your-domain.kdna --profile=compact --as=prompt
```

### Create your own KDNA

Humans, agents, tools, and hybrid workflows can create `.kdna` assets when they
use the official KDNA toolchain or compatible SDKs. The public beta authoring
path is:

```bash
npm i -g @aikdna/kdna-studio-cli @aikdna/kdna-cli
kdna-studio create my_domain --name @yourscope/my_domain
kdna-studio card add my_domain axiom --field one_sentence="..."
kdna-studio export my_domain --format v1 --out ./my_domain.kdna
kdna validate ./my_domain.kdna
kdna plan-load ./my_domain.kdna
kdna load ./my_domain.kdna --profile=compact --as=prompt
```

Review evidence and provenance records can be added by authoring tools when a
publisher needs them. They are not KDNA Core v1 format-validity requirements.

## How kdna-loader works (8-part protocol)

1. **Decide** whether KDNA applies at all (skip for formatting, lookup, code execution)
2. **Discover** local domains via the CLI or MCP local inventory
3. **Evaluate** fit per domain (checks `applies_when` / `does_not_apply_when`)
4. **Select** 0 or 1 domain (never silently blend multiple)
5. **Plan** via `kdna plan-load <file.kdna>`
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
