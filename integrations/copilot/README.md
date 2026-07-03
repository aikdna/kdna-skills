# KDNA on GitHub Copilot-Compatible Agents

Load local KDNA Core v1 assets in agents that read OpenCode-style skills from
`~/.agents/skills`.

> New to KDNA? See [Start Here](https://github.com/aikdna/kdna/blob/main/docs/start-here.md).

## 60-Second Check

```bash
npm install -g @aikdna/kdna-cli
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=prompt
```

## Manual Skill Installation

```bash
mkdir -p ~/.agents/skills/kdna-loader
cp /path/to/kdna-skills/kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `kdna` command not found | Install `@aikdna/kdna-cli` globally |
| Agent does not see the skill | Confirm it reads `~/.agents/skills` or copy the same `kdna-loader/SKILL.md` into the agent's documented skill directory |
| Asset fails validation | Fix or regenerate the `.kdna` file before loading |
| Agent ignores KDNA | Confirm the loader skill exists and the task matches the loaded domain |
