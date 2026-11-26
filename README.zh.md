# 让你的 Agent 读懂并共创 KDNA（`kdna-skills`）

[English](./README.md) | 简体中文 · [官方网站](https://aikdna.com/zh) · [对比案例与实测](https://aikdna.com/zh/explore/systems) · [KDNA Reader (macOS)](https://aikdna.com/zh/downloads) · [集成指南](https://aikdna.com/zh/docs/integrations)

**面向 `.kdna` 判断作品共创、按需读取与版本修订的 Agent 技能包（`kdna-creator`、`kdna-loader`）及本地 MCP 服务。**

在使用 Claude Code、Codex、Cursor、OpenCode、Copilot 或 Antigravity 时，这套技能让你的 Agent 懂得如何协助你把真实经验、文稿或参考资料提炼成结构清晰的 `.kdna` 判断作品、如何在本地用口令加密保护敏感作品，以及如何在具体任务中只读取相关判断并完整保留它的前提、条件例外与停手边界。

本仓库全部流程**永久无需注册任何在线账号**，基于 **Node.js `>=22`** 在本地直接运行。

---

## 免克隆快速开始（10 秒上手）

创作或使用 `.kdna` 作品**无需先克隆本仓库**。只要你的 Agent 支持终端命令（Node.js `>=22`），直接配合 `@aikdna/kdna-cli@0.46.0` 与在线入口文档即可开始：

- **创作 `.kdna` 作品（`create.md`）**：把 [`https://aikdna.com/create.md`](https://aikdna.com/create.md)（国内镜像：[`https://aikdna.cn/create.md`](https://aikdna.cn/create.md)）交给 Agent，按 `works` / `interview` / `research` 三路径使用 `npx -y @aikdna/kdna-cli@0.46.0` 共创。
- **使用收到的 `.kdna` 作品（`use.md`）**：把 [`https://aikdna.com/use.md`](https://aikdna.com/use.md)（国内镜像：[`https://aikdna.cn/use.md`](https://aikdna.cn/use.md)）连同 `.kdna` 文件路径交给 Agent。
- **直接调用 CLI**：
  ```sh
  npx -y @aikdna/kdna-cli@0.46.0 --help
  # 或全局安装：
  npm install -g @aikdna/kdna-cli@0.46.0
  # 仅当国内直连 npm 超时时使用镜像回退：
  npx --registry=https://registry.npmmirror.com -y @aikdna/kdna-cli@0.46.0 --help
  ```

---

## 可选：本地持久化安装 Skills（`kdna-creator` + `kdna-loader`）

若希望 Agent 长期内置多文件暂存工艺（`.kdna-work/`）、16 种形成方法角色表与多资产冲突裁决规范，无需每次拉取远程说明，可克隆后按宿主安装：

```sh
git clone https://github.com/aikdna/kdna-skills && cd kdna-skills
bash install.sh --claude      # 或选择：--codex | --cursor | --opencode | --copilot | --antigravity | --dir <目录>
# 可选：为本地只读 MCP 服务（@aikdna/kdna-mcp-server@0.8.4）安装离线校验依赖图：
bash install-cli.sh
```

| Agent 客户端 | 安装命令（`install.sh` 会同时安装 `kdna-loader` 与完整 `kdna-creator`） |
| --- | --- |
| Claude Code | `bash install.sh --claude` (`~/.claude/skills/`) |
| Codex | `bash install.sh --codex` (`~/.codex/skills/`) |
| Cursor | `bash install.sh --cursor` (`~/.cursor/skills/`) |
| OpenCode / Copilot | `bash install.sh --opencode` 或 `--copilot` (`~/.agents/skills/`) |
| Antigravity | `bash install.sh --antigravity` (`~/.gemini/antigravity/skills/`) |
| 自定义目录 | `bash install.sh --dir /path/to/skills` |

- `install.sh` 会向你明确指定的客户端同时安装 [`kdna-loader`](./kdna-loader/SKILL.md)（按任务范围精确读取、`--password-env` 解锁与多资产冲突裁决）与 [`kdna-creator`](./kdna-creator/SKILL.md)（三路径共创、扩展 `kdna.draft/1`、`draft.json` 单真相源修订、两层诚实校验与离线加密）。重复执行且文件一致时返回 `0`；若本地已有修改则返回 `2` 并给出 `diff -u` 对比命令，除非显式传入 `--force`（亦支持 `--only loader|creator`）。

---

## 开箱即用的 Agent 协作提示词（一键复制）

在 Claude Code、Cursor、Codex、OpenCode、Copilot 或 Antigravity 中直接粘贴即可使用（需 **Node.js `>=22`**）。若需在 macOS 桌面端亲自阅读 `.kdna` 作品，可前往 [`aikdna.com/zh/downloads`](https://aikdna.com/zh/downloads) 下载 **KDNA Reader（macOS 桌面版）**，或前往 [`aikdna.com/zh/explore/systems`](https://aikdna.com/zh/explore/systems) 免登录体验官方双语示范体系与 192 次无泄漏实测（[活人感写作 `v1.0.1`](https://aikdna.com/zh/explore/human-writing) · [代码审查 `v1.0.2`](https://aikdna.com/zh/explore/code-review)），亦可直接下载首部公开判断作品 **《KDNA 白皮书》`v1.0.2`**（张零 / Zhang Ling · `CC BY 4.0` · `45` 题）：[中文版 `.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna)、[英文版 `.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna) 或 [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets)：

1. **免配置直接让 Agent 精读《KDNA 白皮书》`v1.0.2`：**
   > *“请先下载《KDNA 白皮书》（`curl -fsSLo kdna-whitepaper-1.0.2.zh-CN.kdna https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna`），用 `npx -y @aikdna/kdna-cli@0.46.0 read kdna-whitepaper-1.0.2.zh-CN.kdna --mode catalog --format human --allow-read` 查看全部 45 个议题目录；再根据我的问题，用 `--mode exact_selection --judgment-id <id1,id2> --format human --allow-read` 按需精读对应判断（切勿用 `whole_asset` 读正文）。”*
2. **在真实任务中采用本地 `.kdna` 判断作品（拒绝“判断污染”）：**
   > *“请按 `https://aikdna.cn/use.md`（或已安装的 `kdna-loader`）读取 `/绝对路径/work.kdna` 来协助完成这项任务：`<你的任务>`。先用 `--mode catalog --format human --allow-read` 查看目录，只选取真正相关的 1–5 条判断 ID（都不适用则选 0 条），用 `--mode exact_selection --format human --allow-read` 精读并完整保留边界与条件例外，最后告诉我采用了哪几条判断。”*
3. **与 AI 共创你的第一份 `.kdna` 判断作品（免克隆 `/create.md` 或本地 `kdna-creator`）：**
   > *“请按 `https://aikdna.cn/create.md`（或已安装的 `kdna-creator/SKILL.md`）配合 `npx -y @aikdna/kdna-cli@0.46.0`，围绕我接下来提供的经验、既有文稿或参考资料，帮我整理分层审阅表（采用 / 修改 / 舍弃）与 `kdna review` 审阅单，确认后生成校验通过的 `0.6.0` `.kdna` 判断作品。”*
4. **升级版本前先看清改了什么：**
   > *“请用 `npx -y @aikdna/kdna-cli@0.46.0 diff first.kdna revised.kdna --format human` 对比两个版本，向我说明新增、删减或收紧了哪些判断、边界与条件例外，等我确认后再切换。”*

---

## 可选：本地 stdio MCP 服务（`@aikdna/kdna-mcp-server@0.8.4` · `mcp-server/`）

面向支持 MCP 协议的客户端，[`mcp-server/`](./mcp-server/README.md)（npm 包 [`@aikdna/kdna-mcp-server@0.8.4`](https://www.npmjs.com/package/@aikdna/kdna-mcp-server)，内置经过校验的离线只读 `0.45.2` / Core `0.37.11` / Read `0.13.5` 依赖图）提供严格只读、单文件 OS `argv` 绑定的本地 stdio MCP 服务，不开放全盘目录扫描。详细配置见 [`docs/GETTING_STARTED.zh.md`](./docs/GETTING_STARTED.zh.md) 与 [`integrations/`](./integrations)。

---

## 内置的三条协作护栏

1. **作者原意、外部来源与校验层级全程诚实。** `kdna-creator` 严格区分作者立场、整编综合与外部 `sources`，绝不让非专业用户替外部真理背书，也绝不把同会话自测冒充“盲测”。
2. **禁止把 `.kdna` 解压成普通文本硬塞上下文。** `kdna-loader` 始终通过 `kdna read`（先读 `catalog`，再按需 `exact_selection`）进入作品，确保前提、停手边界、条件例外与冲突刹车不脱落。
3. **每次采用均需你的明确选择。** 安装技能或本地存有 `.kdna` 文件不会自动跨会话生效；读取判断内容也绝不授予文件改写、联网或外部执行权限。

---

## 本地校验与开源许可

```sh
node scripts/check-current-names.mjs
node scripts/validate-creation-agent.js
node scripts/validate-agent-support.js
node --test scripts/test-*.mjs
```

代码采用 [Apache-2.0](./LICENSE) 开源许可。
