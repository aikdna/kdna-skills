> [aikdna.com](https://aikdna.com) -- 官方网站 . [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

# KDNA 技能安装

**一个 Loader。多个领域。**

这个仓库不是把 KDNA 变成 Skill。它提供的是适配器 Skill，让不同 AI Agent 能够加载 KDNA。

`kdna-loader` 技能教会 AI Agent 一套协议，用于发现、加载和应用本地 KDNA Core v1 `.kdna` 判断资产。资产是文件，不是独立的技能。

需要 `@aikdna/kdna-cli` CLI：

```bash
npm i -g @aikdna/kdna-cli
kdna setup
```

## 架构

| 角色 | 说明 |
|---|---|
| **kdna-loader**（唯一技能） | 由 `kdna setup` 安装到你的 Agent。教会 Agent 发现和应用 KDNA 的协议。 |
| **KDNA 资产**（数据） | 本地 `.kdna` 文件。通过 `kdna validate` 校验，通过 `kdna plan-load` 判断能否加载，再通过 `kdna load` 加载。按任务按需进入上下文。 |
| **kdna CLI**（工具） | `kdna inspect`、`kdna validate`、`kdna plan-load`、`kdna pack`、`kdna unpack`、`kdna load`。已有资产的运行控制平面。 |

## 支持的 Agent

`kdna setup` 自动检测并安装 `kdna-loader` 到：

- **Codex** — `~/.codex/skills/kdna-loader/`
- **Claude Code** — `~/.claude/skills/kdna-loader/`
- **OpenCode** — `~/.agents/skills/kdna-loader/`
- **Cursor** — `~/.cursor/skills/kdna-loader/`
- **GitHub Copilot** — `~/.agents/skills/kdna-loader/`

所有 Agent 可以共享同一批本地 `.kdna` 文件；当前 v1 路径不要求公开 registry。

## 一键安装

```bash
npm i -g @aikdna/kdna-cli
kdna setup
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna --runtime
kdna plan-load ./minimal.kdna --json
kdna load ./minimal.kdna --profile=compact --as=prompt
kdna doctor --agents
```

## 安装后可以做什么

### 加载领域认知

Agent 在每个任务中自动判断是否需要 KDNA。当领域匹配时，静默加载——应用公理、使用首选术语、遵守边界、运行自检。用户看到的是更好的判断，而不是 KDNA 内部结构。

### 使用真实领域资产

```bash
kdna validate ./writing-v1.kdna --runtime
kdna plan-load ./writing-v1.kdna --json
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

### 创建自己的 v1 KDNA

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my_expertise --name @yourscope/my_expertise
kdna-studio card add my_expertise axiom \
  --field one_sentence="Prefer specific evidence over broad claims" \
  --field full_statement="When reviewing content, prefer specific evidence over broad claims because unsupported generalizations make the judgment impossible to verify or improve." \
  --field why="Broad claims hide the actual reason for a judgment, so reviewers cannot tell whether the conclusion is evidence based, reusable, or merely plausible sounding." \
  --field applies_when='["reviewing content"]' \
  --field does_not_apply_when='["pure formatting"]' \
  --field failure_risk="generic advice"
kdna-studio card approve my_expertise --all --by expert --statement "I confirm this judgment."
kdna-studio export my_expertise --format v1 --out dist/my_expertise.kdna
kdna validate dist/my_expertise.kdna --runtime
kdna plan-load dist/my_expertise.kdna --json
```

Agent 和 Skills 不创建正式 KDNA。它们可以帮助提出判断草稿或候选卡片，但 v1 `.kdna` 导出、校验和加载应通过 Studio CLI 与官方 CLI 完成。签名和加密属于后续 gated 阶段。

## kdna-loader 如何工作（七步协议）

1. **判断** KDNA 是否适用于当前任务（格式化、查询、代码执行等场景跳过）
2. **发现** 可用的本地 `.kdna` 资产
3. **评估** 每个候选领域的匹配度（检查适用边界）
4. **选择** 0 或 1 个领域（绝不静默混合多个）
5. **计划加载** 通过 `kdna plan-load <asset.kdna> --json`
6. **加载** 仅当 `can_load_now=true` 时，通过 `kdna load <asset.kdna> --profile=compact --as=prompt`
7. **应用** 静默执行——基于公理推理，不向用户引用 KDNA
8. **遵守** 边界——用户意图 > 证据 > 安全 > 技能

## 手动安装

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

## 许可

Apache-2.0
