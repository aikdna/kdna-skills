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
- `kdna.available` (legacy registry compatibility)

## Quick Install

```bash
npm i -g @aikdna/kdna-cli
kdna setup
kdna validate ./writing-v1.kdna --runtime
kdna plan-load ./writing-v1.kdna --json
kdna load ./writing-v1.kdna --profile=compact --as=prompt
kdna doctor --agents
```

## After Installing

### Load domain cognition

The agent automatically decides per task whether KDNA applies. When a domain fits, it loads silently -- applying axioms, using preferred terminology, honoring boundaries, and running self-checks. The user sees better judgment, not KDNA internals.

### Install more domains

```bash
kdna validate ./writing.kdna --runtime
kdna plan-load ./writing.kdna --json
kdna load ./writing.kdna --profile=compact --as=prompt
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
kdna validate ./my_domain.kdna --runtime
kdna plan-load ./my_domain.kdna --json
kdna load ./my_domain.kdna --profile=compact --as=prompt
```

Human Lock, signatures, release evidence, encryption, and paid authorization
are optional or future trust layers. They are not KDNA Core v1 format-validity
requirements.

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
