> 🧬 [aikdna.com](https://aikdna.com) — 官方网站 · [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli-cli)

# KDNA 技能安装

为任何 AI Agent 安装 KDNA 领域认知。需要 `@aikdna/kdna-cli` CLI：

```bash
npm i -g @aikdna/kdna-cli
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
```

两个技能，一个安装器，支持多个 Agent。

## 技能

| 技能 | 用途 |
|---|---|
| **kdna-loader** | 在回答前加载领域认知——检测领域、应用公理、运行自查 |
| **kdna-create** | 创建或获取 KDNA——对话式创建、注册表下载、URL 导入、模板搭建 |

## 支持的 Agent

| Agent | 技能位置 | KDNA 数据位置 |
|---|---|---|
| **所有 Agent** | (因 Agent 而异) | `~/.kdna/`（统一位置，必要时创建软链接） |
| **GitHub Copilot** | `~/.agents/skills/kdna-loader/SKILL.md` | `~/.agents/Kdna/` |

## 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
```

安装器会自动检测你的 Agent，然后安装两个技能。

或指定 Agent 安装：

```bash
./install.sh --codex    # Codex
./install.sh --claude   # Claude Code
./install.sh --opencode # OpenCode
./install.sh --all      # 全部检测到的 Agent
```

## 安装后可以做什么

### 加载领域认知
```
"用 kdna-loader 帮我审这篇销售文案。"
→ Agent 加载销售 KDNA，诊断确定性缺失，使用领域术语。
```

### 创建新领域
```
"帮我创建一个房产谈判领域的 KDNA。"
→ kdna-create 访谈你，提取公理和模式，生成校验过的 JSON 文件。
```

### 从官方注册表下载
```
"从注册表下载沟通领域的 KDNA。"
→ kdna-create 拉取注册表、克隆仓库、复制文件到你的 KDNA 目录。
```

### 从 URL 导入
```
"导入 https://github.com/someone/kdna-cybersecurity 的 KDNA。"
→ kdna-create 克隆仓库、校验文件、安装到 KDNA 目录。
```

## 手动安装

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

## kdna-create 的四种获取方式

| 方式 | 说明 |
|---|---|
| **对话创建** | Agent 访谈你的领域经验，提取公理/模式/误解，生成 KDNA 文件 |
| **注册表下载** | 从 [kdna-registry/domains.json](https://github.com/aikdna/kdna-registry/blob/main/domains.json) 查找并下载官方领域 |
| **URL 导入** | 从任意 Git 仓库或 URL 下载 KDNA 包，校验后安装 |
| **模板创建** | 复制[最小模板](https://github.com/aikdna/KDNA/tree/main/templates/minimal-domain)，重命名并逐项填写 |

所有方式都会在保存前进行校验。

## 许可

Apache-2.0
