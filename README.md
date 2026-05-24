> [aikdna.com](https://aikdna.com) -- Official website . [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

# KDNA Skills

**One loader. Many domains.**

The `kdna-loader` skill teaches AI agents a protocol for discovering, loading, and applying KDNA domain cognition packages. Domains are data assets managed by `kdna` CLI, not separate skills.

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
| **KDNA domains** (data) | Installed via `kdna install <name>`. Live in `~/.kdna/domains/`. Loaded on demand per task. |
| **kdna CLI** (tool) | `kdna init`, `kdna install`, `kdna verify`, `kdna publish`. Stable interface for domain management. |

## Supported Agents

`kdna setup` auto-detects and installs `kdna-loader` into:

- **Codex** — `~/.codex/skills/kdna-loader/`
- **Claude Code** — `~/.claude/skills/kdna-loader/`
- **OpenCode** — `~/.agents/skills/kdna-loader/`
- **Cursor** — `~/.cursor/skills/kdna-loader/`
- **GitHub Copilot** — `~/.agents/skills/kdna-loader/`

All agents share the same KDNA data root: `~/.kdna/domains/`.

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

### Create your own domain

```bash
kdna init my_expertise
# Fill in KDNA_Core.json and KDNA_Patterns.json
kdna validate my_expertise
kdna publish my_expertise
```

Or use the **KDNAChat** Mac App or **VS Code extension** for guided authoring.

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
