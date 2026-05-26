> [aikdna.com](https://aikdna.com) -- 官方网站 . [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

# KDNA 技能安装

**一个 Loader。多个领域。**

这个仓库不是把 KDNA 变成 Skill。它提供的是适配器 Skill，让不同 AI Agent 能够加载 KDNA。

`kdna-loader` 技能教会 AI Agent 一套协议，用于发现、加载和应用 KDNA 领域认知包。领域是数据资产，由 `kdna` CLI 管理，不是独立的技能。

需要 `@aikdna/kdna-cli` CLI：

```bash
npm i -g @aikdna/kdna-cli
kdna setup
```

## 架构

| 角色 | 说明 |
|---|---|
| **kdna-loader**（唯一技能） | 由 `kdna setup` 安装到你的 Agent。教会 Agent 发现和应用 KDNA 的协议。 |
| **KDNA 资产**（数据） | 通过 `kdna install <名称>` 安装。以不可变 `.kdna` 文件保存在 `~/.kdna/packages/`，并由 `~/.kdna/index.json` 索引。按任务按需加载。 |
| **kdna CLI**（工具） | `kdna init`、`kdna install`、`kdna verify`、`kdna publish`。领域管理的稳定接口。 |

## 支持的 Agent

`kdna setup` 自动检测并安装 `kdna-loader` 到：

- **Codex** — `~/.codex/skills/kdna-loader/`
- **Claude Code** — `~/.claude/skills/kdna-loader/`
- **OpenCode** — `~/.agents/skills/kdna-loader/`
- **Cursor** — `~/.cursor/skills/kdna-loader/`
- **GitHub Copilot** — `~/.agents/skills/kdna-loader/`

所有 Agent 共享同一 KDNA 资产存储：`~/.kdna/packages/` 和 `~/.kdna/index.json`。

## 一键安装

```bash
npm i -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing
kdna doctor --agents
```

## 安装后可以做什么

### 加载领域认知

Agent 在每个任务中自动判断是否需要 KDNA。当领域匹配时，静默加载——应用公理、使用首选术语、遵守边界、运行自检。用户看到的是更好的判断，而不是 KDNA 内部结构。

### 安装更多领域

```bash
kdna list --available    # 浏览注册表
kdna install code_review # 安装领域
kdna verify @aikdna/code_review --judgment
```

### 创建自己的领域

```bash
kdna dev init my_expertise
# 填写开发源工作区
kdna dev validate my_expertise
kdna publish my_expertise --output dist/my_expertise.kdna
```

或使用 **KDNaStudio** Mac App 或 **VS Code 插件** 进行引导式创作。

## kdna-loader 如何工作（七步协议）

1. **判断** KDNA 是否适用于当前任务（格式化、查询、代码执行等场景跳过）
2. **发现** 已安装的领域（`kdna available --json`）
3. **评估** 每个候选领域的匹配度（检查 `applies_when` / `does_not_apply_when`）
4. **选择** 0 或 1 个领域（绝不静默混合多个）
5. **加载** 通过 `kdna load @scope/name`（prompt 模式，比完整 JSON 小 30-50%）
6. **应用** 静默执行——基于公理推理，不向用户引用 KDNA
7. **遵守** 边界——用户意图 > 证据 > 安全 > 技能

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
