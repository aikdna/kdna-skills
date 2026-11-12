# 让你的 Agent 读懂并共创 KDNA（`kdna-skills`）

[English](./README.md) | 简体中文 · [官方网站](https://aikdna.com/zh) · [KDNA Reader](https://aikdna.com/reader/) · [集成指南](https://aikdna.com/zh/docs/integrations)

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

## 开箱即用的 Agent 协作提示词（一键复制）

在 Claude Code、Cursor、Codex、OpenCode、Copilot 或 Antigravity 中直接粘贴即可使用（需 **Node.js `>=22`**）。你也可以在 [KDNA Reader（中文版）](https://aikdna.com/reader/?sample=kdna-whitepaper)、[KDNA Reader（英文版）](https://aikdna.com/reader/?sample=kdna-whitepaper-en) 或 [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) 在线阅读首部公开判断作品 **《KDNA 白皮书》`v1.0.1`**（张零 / Zhang Ling · `CC BY 4.0` · `45` 题）：

1. **免配置直接让 Agent 精读《KDNA 白皮书》`v1.0.1`：**
   > *“请先下载首份公开 `.kdna` 作品《KDNA白皮书》（`curl -fsSLo kdna-whitepaper-1.0.1.zh-CN.kdna https://aikdna.cn/reader/samples/kdna-whitepaper.kdna`；英文版可用 `https://aikdna.com/reader/samples/kdna-whitepaper-en.kdna`），用 `npx -y @aikdna/kdna-cli@0.43.4 read kdna-whitepaper-1.0.1.zh-CN.kdna --mode catalog --format human --allow-read` 查看全部 45 个议题目录；再根据我想讨论的问题，用 `--mode exact_selection --judgment-id <id1,id2> --format human --allow-read` 按需精读对应判断（切勿用 `whole_asset` 读正文，也不要不加 `--compact` / `--format human` 裸读大体积 JSON）。”*
2. **在真实任务中采用本地 `.kdna` 判断作品（拒绝“判断污染”）：**
   > *“请使用 `kdna-loader` 读取 `/绝对路径/work.kdna` 来协助完成这项任务：`<你的任务>`。请先用 `--mode catalog --format human --allow-read` 读取目录，只选取与当前任务真正相关的 1–5 条判断 ID（若都不适用则一条也不选；切勿调用 `whole_asset`），用 `--mode exact_selection --format human --allow-read` 精读并严格带着适用条件与停手边界工作，最后告诉我本次采用了哪几条判断。”*
3. **与 AI 共创你的第一份 `.kdna` 判断作品（访谈、文稿萃取或可信资料整编）：**
   > *“请克隆 `https://github.com/aikdna/kdna-skills` 并运行 `bash install-cli.sh` 与 `bash install.sh --claude`（或对应宿主参数），阅读 `kdna-creator/SKILL.md`；围绕我接下来提供的真实经验、既有文稿或可信参考资料，通过 `kdna init --mode interview`（或 `works` / `research`）与 `kdna.draft/1` 工作流帮我整理、列出审阅表供我确认（采用 / 修改 / 舍弃），校验通过后打包生成 `0.6.0` `.kdna` 判断作品。”*
4. **升级版本前先看清改了什么：**
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
