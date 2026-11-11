# 让你的 Agent 读懂并共创 KDNA（`kdna-skills`）

[English](./README.md) | 简体中文 · [官方网站](https://aikdna.com/zh) · [KDNA Reader](https://aikdna.com/zh/reader) · [集成指南](https://aikdna.com/zh/docs/integrations)

**面向 `.kdna` 判断作品共创、按需读取与版本修订的 Agent 技能包（`kdna-creator`、`kdna-loader`）及本地 MCP 服务。**

在使用 Claude Code、Codex、Cursor、OpenCode、Copilot 或 Antigravity 时，这套技能让你的 Agent 懂得如何协助你把真实经验与文稿提炼成结构清晰的 `.kdna` 判断作品、如何在本地用口令加密保护敏感作品，以及如何在具体任务中只读取相关判断并完整保留它的前提与停手边界——而不是把你来之不易的取舍磨平为四平八稳的套话。

本仓库全部流程**永久无需注册任何在线账号**，基于 **Node.js `>=22`** 在本地直接运行。

---

## 60 秒快速安装

```sh
git clone https://github.com/aikdna/kdna-skills && cd kdna-skills
bash install-cli.sh           # 在当前目录安装经过校验的本地离线 CLI（不污染全局）
bash install.sh --claude      # 或选择：--codex | --cursor | --opencode | --copilot | --antigravity | --dir <目录>
```

| Agent 客户端 | 安装命令（`install.sh` 会同时安装 `kdna-loader` 与完整 `kdna-creator`） |
| --- | --- |
| Claude Code | `bash install.sh --claude` (`~/.claude/skills/`) |
| Codex | `bash install.sh --codex` (`~/.codex/skills/`) |
| Cursor | `bash install.sh --cursor` (`~/.cursor/skills/`) |
| OpenCode / Copilot | `bash install.sh --opencode` 或 `--copilot` (`~/.agents/skills/`) |
| Antigravity | `bash install.sh --antigravity` (`~/.gemini/antigravity/skills/`) |
| 自定义目录 | `bash install.sh --dir /path/to/skills` |

- `install.sh` 会向你明确指定的客户端同时安装 [`kdna-loader`](./kdna-loader/SKILL.md)（按任务范围精确读取判断）与 [`kdna-creator`](./kdna-creator/SKILL.md)（访谈提炼、既有作品萃取、研究整理与版本修订）。重复执行且文件一致时返回 `0`；若本地已有修改则返回 `2` 并给出 `diff -u` 对比命令，除非显式传入 `--force`（亦支持 `--only loader|creator`）。
- 若偏好全局安装命令行，也可直接运行 `npm install -g @aikdna/kdna-cli@0.43.4`（支持 `init`、`validate-input`、`compile`、`create --draft`、`protect`、`validate`、`read`、`diff`）。

---

## 三句开箱即用的协作提示词

安装完成后，你可以直接对 Agent 说（也可以先在 [KDNA Reader](https://aikdna.com/reader/?sample=kdna-whitepaper) 或 [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) 获取首部公开判断作品 **《KDNA 白皮书》v1.0.0**，张零 · `CC BY 4.0` · `45` 题）：

1. **在真实任务中采用一份判断作品（拒绝“判断污染”）：**
   > *“请使用 `kdna-loader` 读取 `/绝对路径/work.kdna` 来协助完成这项任务：`<你的任务>`。请先读取 `catalog` 目录，只选取与当前任务真正相关的判断 ID（若都不适用则一条也不选），严格带着它们的适用条件与边界来工作，并在最后告诉我本次采用了哪几条判断。”*
2. **与 AI 共创一份 `.kdna` 判断作品（访谈、文稿萃取或专题研究）：**
   > *“请使用 `kdna-creator` 帮我围绕 `<主题>` 共创一份 `.kdna` 判断作品。每次只追问我 1–2 个具体的两难取舍（或从 `<我的文稿路径>` 提炼），在打包前先列出审阅表供我逐条确认（采用 / 修改 / 舍弃），通过 `validate-input` 校验后保存到 `<新目录>/first.kdna`。”*
3. **升级版本前先看清改了什么：**
   > *“请用 `kdna diff --format human` 对比 `first.kdna` 与 `revised.kdna`，向我说明新增、删减或收紧了哪些判断与边界，等我确认后再切换到新版本。”*

---

## 可选：本地 stdio MCP 服务（`mcp-server/`）

面向支持 MCP 协议的客户端，[`mcp-server/`](./mcp-server/README.md) 提供受控的本地 stdio MCP 服务，无需放开全盘目录扫描即可按目录与精确选取方式读取指定的 `.kdna` 文件。详细配置说明见 [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md) 与 [`integrations/`](./integrations)。

---

## 内置的三条协作护栏

1. **作者原意与 AI 建议严格区分。** 在 `kdna-creator` 流程中，哪些来自你的真实材料、哪些是 AI 的补充提议、哪些已经过你本人拍板，全程分明，绝不虚构经历或捏造真实案例结果。
2. **禁止把 `.kdna` 解压成普通文本硬塞上下文。** `kdna-loader` 始终通过 `kdna read`（先读 `catalog` 目录，再按需 `exact_selection` 精确读取）进入作品，确保每条被选中的判断都带着它不可拆分的支撑前提与边界限制。
3. **每次采用均需你的明确选择。** 安装技能或本地存有 `.kdna` 文件，不会让它在无关会话中自动生效；读取判断内容也绝不授予文件改写、联网或外部执行权限。

---

## 本地校验与开源许可

```sh
node scripts/check-current-names.mjs
node scripts/validate-creation-agent.js
node scripts/validate-agent-support.js
```

代码采用 [Apache-2.0](./LICENSE) 开源许可。
