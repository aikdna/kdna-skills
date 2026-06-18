# KDNA on Claude Code

Load local KDNA Core v1 assets in Claude Code to give the agent
domain-specific judgment before it acts.

> New to KDNA? See [Start Here](https://github.com/aikdna/kdna/blob/main/docs/start-here.md).

## 60-Second Check

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

`kdna setup` auto-detects Claude Code and installs the `kdna-loader` skill.

## Real Domain Assets

Use a checked-in or locally exported v1 asset:

```bash
kdna validate ./writing-v1.kdna
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

The loader should apply KDNA silently. The user should see better judgment, not
KDNA internals quoted back.

## Manual Skill Installation

```bash
mkdir -p ~/.claude/skills/kdna-loader
cp /path/to/kdna-skills/kdna-loader/SKILL.md ~/.claude/skills/kdna-loader/SKILL.md
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `kdna` command not found | Install `@aikdna/kdna-cli` globally |
| Claude Code not detected | Run `kdna setup --claude` |
| Asset fails validation | Fix or regenerate the `.kdna` file before loading |
| Agent ignores KDNA | Confirm the loader skill exists and the task matches the loaded domain |
