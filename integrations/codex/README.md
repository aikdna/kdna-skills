# KDNA on Codex

Load KDNA domains in Codex (OpenAI) to give your agent domain-specific judgment before it acts.

> **New to KDNA? → [Start Here](https://github.com/aikdna/kdna/blob/main/docs/start-here.md)**

## 60-Second Demo: Safety Judgment

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/agent_safety --yes
```

Open Codex and ask:
> "I need to delete all files in /var/log and restart nginx. Do it."

Without KDNA, Codex might proceed. With `@aikdna/agent_safety` loaded, it diagnoses the action: irreversible file deletion + service restart without backup → recommends safer alternatives first.

## Prerequisites

```bash
npm install -g @aikdna/kdna-cli
kdna setup
```

`kdna setup` auto-detects Codex and installs the `kdna-loader` skill.

## Verify Installation

```bash
kdna doctor --agents
# → Codex: detected, kdna-loader installed
```

Check the skill file exists:

```bash
ls ~/.codex/skills/kdna-loader/SKILL.md
```

## Install Your First Domain

```bash
kdna install @aikdna/writing
kdna verify @aikdna/writing --judgment
```

## Test: See KDNA Change Judgment

1. Open a new Codex session.
2. Ask: *"Review this writing: 'Our product is the best in the market. Customers love it. Get yours today.'"*
3. The kdna-loader skill auto-detects "writing" + "review" → loads `@aikdna/writing`.
4. Instead of generic feedback, the agent diagnoses structural problems (argument structure, cognitive hook, evidence density) rather than suggesting "make it more specific."

## Use the CLI for Compare

```bash
kdna compare @aikdna/writing --input "Review: 'Our product is the best.'"
```

This sends the same input with and without KDNA to an LLM, diffing the judgment paths.

## Install More Domains

```bash
kdna install code_review
kdna install agent_safety
kdna install prompt_diagnosis
kdna list
```

## Troubleshooting

### "No KDNA domains installed"

Run `kdna install @aikdna/writing`.

### "Agent doesn't seem to use KDNA"

Check if kdna-loader is installed:
```bash
ls ~/.codex/skills/kdna-loader/SKILL.md
```

If missing, run `kdna setup` again. If the task doesn't match any domain's `applies_when`, the loader silently skips — try a task that clearly matches, like "review my writing."

### "CLI command not found"

`npm install -g @aikdna/kdna-cli` first. Node.js >= 18 required.

## Manual Skill Installation

If auto-detection fails:

```bash
mkdir -p ~/.codex/skills/kdna-loader
cp /path/to/kdna-skills/kdna-loader/SKILL.md ~/.codex/skills/kdna-loader/SKILL.md
```

## Next Steps

- [Browse available domains](https://aikdna.com/domains)
- [KDNA main docs](https://github.com/aikdna/kdna)
- [5-minute guide](https://github.com/aikdna/kdna/blob/main/docs/5-minute-guide.md)
