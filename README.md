# KDNA Skills

Install KDNA domain cognition for any AI agent. One skill, one format, multiple agents.

KDNA tells AI how to think within a domain. This repo helps you install the `kdna-loader` skill into your agent of choice.

## Supported Agents

| Agent | Skill location | KDNA data location |
|---|---|---|
| **Codex** (OpenAI) | `~/.codex/skills/kdna-loader/SKILL.md` | `~/.codex/Kdna/` |
| **Claude Code** (Anthropic) | `~/.claude/skills/kdna-loader/SKILL.md` | `~/.claude/Kdna/` |
| **OpenCode** | `~/.agents/skills/kdna-loader/SKILL.md` | `~/.agents/Kdna/` |
| **Cursor** | `~/.cursor/skills/kdna-loader/SKILL.md` | `~/.cursor/Kdna/` |
| **GitHub Copilot** | `~/.agents/skills/kdna-loader/SKILL.md` | `~/.agents/Kdna/` |

## Quick Install

Interactive installer — detects your agents and asks where to install:

```bash
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
```

Or install for a specific agent:

```bash
# Codex
./install.sh --codex

# Claude Code
./install.sh --claude

# OpenCode
./install.sh --opencode

# All detected agents
./install.sh --all
```

## What Gets Installed

1. The `kdna-loader` skill (`SKILL.md`) — tells the agent how to find, load, and apply KDNA.
2. A KDNA data directory — where domain packages live (e.g., `~/.codex/Kdna/communication_expert/`).
3. An example `registry.json` — helps the agent discover domains by keyword.

## Manual Installation

Copy the skill directly:

```bash
# Codex
mkdir -p ~/.codex/skills/kdna-loader
cp SKILL.md ~/.codex/skills/kdna-loader/SKILL.md

# Claude Code
mkdir -p ~/.claude/skills/kdna-loader
cp SKILL.md ~/.claude/skills/kdna-loader/SKILL.md

# OpenCode
mkdir -p ~/.agents/skills/kdna-loader
cp SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
```

Then add KDNA domains to the data directory. See [KDNA](https://github.com/aikdna/KDNA) for available domains.

## What This Skill Does

When loaded by your agent, `kdna-loader`:
- Detects which domain the user's question belongs to
- Loads `KDNA_Core.json` and `KDNA_Patterns.json` for that domain
- Loads optional files (scenarios, cases, reasoning, evolution) based on the task
- Applies domain axioms, terminology, and self-checks before the agent responds

The user sees a domain-shaped answer — not a summary of KDNA.

## Adding Domains

Install a domain into your KDNA data directory:

```bash
# Clone a domain package
git clone https://github.com/aikdna/kdna-communication.git

# Copy to your KDNA data dir
mkdir -p ~/.codex/Kdna/communication_expert
cp kdna-communication/KDNA_*.json ~/.codex/Kdna/communication_expert/
```

Or create your own from the [minimal template](https://github.com/aikdna/KDNA/tree/main/templates/minimal-domain).

## License

Apache-2.0
