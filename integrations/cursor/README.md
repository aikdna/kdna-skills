# KDNA on Cursor

Load local KDNA Core v1 assets in Cursor to give the agent domain-specific
judgment before it acts.

> New to KDNA? See [Start Here](https://github.com/aikdna/kdna/blob/main/docs/start-here.md).

## 60-Second Check

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna --runtime
kdna plan-load ./minimal.kdna --json
kdna load ./minimal.kdna --profile=compact --as=prompt
```

`kdna setup` installs the `kdna-loader` skill where supported. Cursor may
require manual skill placement depending on local setup.

## Real Domain Assets

Use a checked-in or locally exported v1 asset:

```bash
kdna validate ./writing-v1.kdna --runtime
kdna plan-load ./writing-v1.kdna --json
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

The loader should apply KDNA silently. The user should see better judgment, not
KDNA internals quoted back.

## Manual Skill Installation

```bash
mkdir -p ~/.cursor/skills/kdna-loader
cp /path/to/kdna-skills/kdna-loader/SKILL.md ~/.cursor/skills/kdna-loader/SKILL.md
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `kdna` command not found | Install `@aikdna/kdna-cli` globally |
| Cursor not detected | Install manually into your Cursor skills directory |
| Asset fails validation | Fix or regenerate the `.kdna` file before loading |
| Agent ignores KDNA | Confirm the loader skill exists and the task matches the loaded domain |
