> [aikdna.com](https://aikdna.com) — Official website
>
> [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

# KDNA Skills

**One loader. Many domains.**

This repository provides adapter skills that allow AI agents to load KDNA judgment assets. It does not turn KDNA into a skill — it gives agents the ability to discover and load `.kdna` files.

The `kdna-loader` skill is the official agent adapter for the KDNA toolchain.
It teaches AI agents when and how to load `.kdna` judgment assets — and when to
skip. Supported placements are tracked in [`docs/agent-support-matrix.json`](docs/agent-support-matrix.json): **OpenCode, Codex, Claude Code, Cursor**, with **GitHub Copilot-compatible agents** available through manual-compatible skill placement.

**KDNA shapes judgment, not tool permission.** KDNA does not override system or safety policy. The runtime trace vocabulary records explicit status values (version_incompatible, failed_to_parse, failed_to_decrypt, signature_invalid, blocked_by_runtime_policy) so that the loader cannot quietly succeed while producing garbage. See KDNA Core trace vocabulary.

Requires `@aikdna/kdna-cli` CLI:

```bash
npm i -g @aikdna/kdna-cli
```

The current verified registry baseline is `@aikdna/kdna-cli@0.35.0`, with the
exact runtime dependency `@aikdna/kdna-core@0.20.0`. The loader bundled by that
CLI and this repository adapter both use the official
`inspect` → `plan-load` → `load` boundary. The unversioned install command
tracks npm's current `latest` CLI release.

## How it works

| What | Where |
|---|---|
| **kdna-loader** (single skill) | Installed manually into your agent. Teaches the agent the protocol for KDNA discovery and application. |
| **KDNA assets** (data) | Local `.kdna` KDNA Asset Containers. Discover them through local paths or MCP `kdna.available-local`; load them on demand per task. |
| **kdna CLI** (tool) | `kdna inspect`, `kdna validate`, `kdna plan-load`, `kdna load`. Runtime control plane for the current KDNA Asset Container. |

For most agent requests, the loader uses the conservative single-primary path.
Applications that need explicit multi-asset composition should use the CLI
consumption runtime and retain its trace and review controls; the loader does
not silently load every available asset.

## Supported Agents

`kdna setup` installs `kdna-loader` into the paths below when the target agent
is auto-detected where supported. Other compatible agents use the same skill
file with manual placement:

| Agent | Skill Path | Guide |
|-------|-----------|-------|
| **Codex** | `~/.codex/skills/kdna-loader/` | [Setup guide →](integrations/codex/) |
| **Claude Code** | `~/.claude/skills/kdna-loader/` | [Setup guide →](integrations/claude-code/) |
| **OpenCode** | `~/.agents/skills/kdna-loader/` | [Setup guide →](integrations/opencode/) |
| **Cursor** | `~/.cursor/skills/kdna-loader/` | [Setup guide →](integrations/cursor/) |
| **GitHub Copilot** | `~/.agents/skills/kdna-loader/` | [Setup guide →](integrations/copilot/) |

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
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

## After Installing

### Load a `.kdna` asset

The agent automatically decides per task whether KDNA applies. When a domain fits, it loads silently -- applying axioms, using preferred terminology, honoring boundaries, and running self-checks. The user sees better judgment, not KDNA internals.

### Use another `.kdna` file

```bash
kdna validate ./your-domain.kdna
kdna plan-load ./your-domain.kdna
kdna load ./your-domain.kdna --profile=compact --as=json
```

### Create your own KDNA

Humans, agents, tools, and hybrid workflows can create `.kdna` assets when they
use the official KDNA toolchain or compatible SDKs. The public beta authoring
path is:

```bash
npm i -g @aikdna/kdna-studio-cli @aikdna/kdna-cli
kdna-studio create my_domain --name @yourscope/my_domain
kdna-studio card add my_domain axiom --field one_sentence="..."
kdna-studio export my_domain --out ./my_domain.kdna
kdna validate ./my_domain.kdna
kdna plan-load ./my_domain.kdna
kdna load ./my_domain.kdna --profile=compact --as=json
```

Review evidence and provenance records can be added by authoring tools when a
publisher needs them. They are not KDNA format-validity requirements.

## How kdna-loader works (8-part protocol)

1. **Decide** whether KDNA applies at all (skip for formatting, lookup, code execution)
2. **Discover** local domains via the CLI or MCP local inventory
3. **Evaluate** fit per domain (checks `applies_when` / `does_not_apply_when`)
4. **Select** 0 or 1 domain (never silently blend multiple)
5. **Plan** via `kdna plan-load <file.kdna>`
6. **Load** only when Core/CLI reports `can_load_now=true`, then consume the Runtime Capsule from `kdna load <file.kdna> --profile=compact --as=json`
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

# Cursor
mkdir -p ~/.cursor/skills/kdna-loader
cp kdna-loader/SKILL.md ~/.cursor/skills/kdna-loader/SKILL.md

# GitHub Copilot-compatible agents
mkdir -p ~/.agents/skills/kdna-loader
cp kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
```

## License

Apache-2.0

[中文](./README.zh.md)
