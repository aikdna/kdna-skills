# KDNA on Claude Code

Load KDNA domains in Claude Code to give Claude domain-specific judgment before it acts.

## Prerequisites

```bash
npm install -g @aikdna/kdna-cli
kdna setup
```

`kdna setup` auto-detects Claude Code and installs the `kdna-loader` skill.

## Verify Installation

```bash
kdna doctor --agents
# → Claude Code: detected, kdna-loader installed
```

Check the skill file exists:

```bash
ls ~/.claude/skills/kdna-loader/SKILL.md
```

## Install Your First Domain

```bash
kdna install @aikdna/writing
kdna verify @aikdna/writing --judgment
```

## Test: See KDNA Change Judgment

1. Open a new Claude Code session.
2. Ask: *"Review this writing: 'Our product is the best in the market. Customers love it. Get yours today.'"*
3. Claude detects "writing" + "review" → loads `@aikdna/writing`.
4. Instead of generic feedback ("make it more specific"), Claude diagnoses structural problems: argument structure, cognitive hook, evidence density.

## Use the CLI for Side-by-Side Compare

```bash
kdna compare @aikdna/writing --input "Review: 'Our product is the best.'"
```

Sends the same input with and without KDNA, diffing the judgment paths.

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

### "Claude doesn't seem to use KDNA"

Check if kdna-loader is installed:
```bash
ls ~/.claude/skills/kdna-loader/SKILL.md
```

If missing, run `kdna setup` again. If the task doesn't match any domain's `applies_when`, the loader silently skips — try a task that clearly matches.

### "CLI command not found"

`npm install -g @aikdna/kdna-cli` first. Node.js >= 18 required.

## Manual Skill Installation

If auto-detection fails:

```bash
mkdir -p ~/.claude/skills/kdna-loader
cp /path/to/kdna-skills/kdna-loader/SKILL.md ~/.claude/skills/kdna-loader/SKILL.md
```

## Next Steps

- [Browse available domains](https://aikdna.com/domains)
- [KDNA main docs](https://github.com/aikdna/kdna)
- [5-minute guide](https://github.com/aikdna/kdna/blob/main/docs/5-minute-guide.md)
