> 🧬 [aikdna.com](https://aikdna.com) — Official website · [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli-cli)

# KDNA Skills

Install KDNA domain cognition for any AI agent. Requires `@aikdna/kdna` CLI:

```bash
npm i -g @aikdna/kdna-cli
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
```

Two skills, one installer, multiple agents.

## Skills

| Skill | Purpose |
|---|---|
| **kdna-loader** | Loads KDNA domain cognition before responding. Detects domains, applies axioms, uses preferred terminology, runs self-checks. |
| **kdna-create** | Creates, downloads, or imports KDNA domains. Interview-based creation, registry download, URL import, template scaffolding. |

## Supported Agents

| Agent | Skill location | KDNA data location |
|---|---|---|
| **All Agents** | (varies by Agent) | `~/.kdna/` (unified, symlink if needed) |
| **GitHub Copilot** | `~/.agents/skills/kdna-loader/SKILL.md` | `~/.agents/Kdna/` |

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
```

The installer auto-detects your agents and installs both skills.

Or install for a specific agent:

```bash
./install.sh --codex    # Codex
./install.sh --claude   # Claude Code
./install.sh --opencode # OpenCode
./install.sh --all      # All detected
```

## What You Can Do After Installing

### Load domain cognition
```
"Use kdna-loader to review this sales page."
→ Agent loads sales KDNA, diagnoses certainty deficits, applies domain terminology.
```

### Create a new domain
```
"Create a KDNA for real estate negotiation expertise."
→ kdna-create interviews you, extracts axioms and patterns, writes validated JSON.
```

### Download from the official registry
```
"Download the communication KDNA from the registry."
→ kdna-create fetches the registry, clones the repo, copies files to your KDNA directory.
```

### Import from a URL
```
"Import KDNA from https://github.com/someone/kdna-cybersecurity"
→ kdna-create clones the repo, validates the files, installs to your KDNA directory.
```

## Manual Installation

```bash
# Codex
mkdir -p ~/.codex/skills/kdna-loader
cp kdna-loader/SKILL.md ~/.codex/skills/kdna-loader/SKILL.md
mkdir -p ~/.codex/skills/kdna-create
cp kdna-create/SKILL.md ~/.codex/skills/kdna-create/SKILL.md

# Claude Code
mkdir -p ~/.claude/skills/kdna-loader
cp kdna-loader/SKILL.md ~/.claude/skills/kdna-loader/SKILL.md
mkdir -p ~/.claude/skills/kdna-create
cp kdna-create/SKILL.md ~/.claude/skills/kdna-create/SKILL.md

# OpenCode
mkdir -p ~/.agents/skills/kdna-loader
cp kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
mkdir -p ~/.agents/skills/kdna-create
cp kdna-create/SKILL.md ~/.agents/skills/kdna-create/SKILL.md
```

## How kdna-create Works

Four paths to obtain a KDNA domain:

| Path | How |
|---|---|
| **Create from conversation** | Agent interviews you about your domain expertise, extracts axioms/patterns/misunderstandings, writes KDNA files |
| **Download from registry** | Fetches [kdna-registry/domains.json](https://github.com/aikdna/kdna-registry/blob/main/domains.json), clones the domain repo, copies to your KDNA directory |
| **Import from URL** | Clones or downloads a KDNA package from any git repo or URL, validates, installs |
| **Create from template** | Copies the [minimal template](https://github.com/aikdna/KDNA/tree/main/templates/minimal-domain), renames for your domain |

All paths validate the result before saving.

## License

Apache-2.0

[中文](./README.zh.md)
