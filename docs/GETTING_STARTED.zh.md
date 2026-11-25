# 让 Agent 带你完成一次真正有用的任务

从一个具体问题和有权使用的材料开始。领域判断系统可以帮助你处理反复出现的
问题，说明判断的理由、条件例外和停手限制，并在使用后持续改进。不同领域可以
分别保存，不要求凑够多少问题或多少份资产。

最快免克隆上手：只需把 [`https://aikdna.com/create.md`](https://aikdna.com/create.md)（国内：[`https://aikdna.cn/create.md`](https://aikdna.cn/create.md)）或 [`https://aikdna.com/use.md`](https://aikdna.com/use.md)（国内：[`https://aikdna.cn/use.md`](https://aikdna.cn/use.md)）配合 `npx -y @aikdna/kdna-cli@0.46.0` 交给具备终端工具能力的 Agent（Node.js `>=22`）。如需持久化安装 Skills 或配置可选的本地只读 MCP 服务，请把这份指南和[本仓库](../README.zh.md)交给 Agent。

## 你需要提供什么

说明用途、面向的人和允许使用的材料。读取已有资产时，指定文件和问题；创建
或修改时，指定保存位置，说明当前是草稿还是打算采用的内容。明确哪些 Agent
或其他处理方可以接收材料。本地工具不代表连接云端模型的 Agent 只在本机处理。

Agent 应复用对话中已经明确的选择，只在缺少实质信息时用一句普通问题补齐。
文件摘要、合同坐标、标识和句柄由它处理。读取许可不能自动扩展为修改、公开
发布、调用其他服务商或执行建议的许可。

## Agent 安装核查步骤

1. **直接 CLI（默认推荐，免克隆）**：需要 Node.js `>=22`。直接运行
   `npx -y @aikdna/kdna-cli@0.46.0 --help`（或全局安装
   `npm install -g @aikdna/kdna-cli@0.46.0`；仅当国内直连 npm 超时时附加
   `--registry=https://registry.npmmirror.com`）。
2. **可选本地持久化 Skills 或离线 MCP 检出**：确认[官方仓库](https://github.com/aikdna/kdna-skills)
   的明确 Git revision，包含 `mcp-server/package-lock.json` 和全部 `vendor/`
   依赖归档。检出目录自带的摘要不能独立认证来源；不要混用不同 revision 的文件。
   `@aikdna/kdna-mcp-server@0.8.4` 是严格只读、单文件 OS `argv` 绑定的本地 MCP
   服务，内置经离线校验的 `0.45.2` / Core `0.37.11` / Read `0.13.5` 只读依赖图。
3. **离线安装 MCP 依赖图（`bash install-cli.sh`）**：需要 `bash`、`tar`、
   Node.js `>=22` 与 npm（已在 Node.js 22.23.1、npm 11.17.0 下核验）。从检出目录
   运行 `bash install-cli.sh`，核对 manifest、lock 和归档字节并离线安装十二个本地
   依赖，不安装全局 CLI，也不启动 MCP 服务。
4. **可选安装持久化 Skills（`bash install.sh`）**：按单个明确选择的宿主同时安装
   `kdna-loader` 与完整 `kdna-creator`（含 `SKILL.md`、`agents/`、全部四份现行
   `references/*.md` 与 `scripts/native-asset-review.mjs`），支持 `--codex`、
   `--claude`、`--opencode`、`--cursor`、`--copilot`、`--antigravity` 与
   `--dir <skills-root>`（可选 `--only loader|creator` 与 `--force`）。未传
   `--force` 时，已修改的目标文件会返回退出码 `2` 并给出 `diff -u` 提示，绝不
   静默覆盖，也不启用 MCP 或授予读取许可。
5. **默认走直接 CLI，仅在确需结构化工具调用时配置 MCP**：按[具名 Host 指南](agent-support-matrix.json)
   配置，由用户或可信启动器掌握启动 `argv`；模型绝不能靠工具参数自授权限或扩大
   文件范围。

安装失败时指出实际缺失的输入或未通过的检查，不要退回 `@latest`、私有解析器或
未经核验的全局工具。

## 创建、使用、再修改

按资产实际声明的容器格式、加密状态与调用模式选择匹配的读取入口与口令通道：

| 已保存资产与入口 | 匹配读取端 | 权限与口令通道 |
| --- | --- | --- |
| 原生公开容器 `0.6.0` | 官方原生 CLI（`@aikdna/kdna-cli@0.46.0`，优先），或可选本地 MCP（`@aikdna/kdna-mcp-server@0.8.4`），Read `0.7.0-candidate` | 选定文件及明确读取许可（`--allow-read`） |
| 原生口令保护容器 `0.6.0` · 直接 CLI 单次命令 | `@aikdna/kdna-cli@0.46.0` | 选定文件、`--allow-read`，以及 `--password-env <VAR>`（Agent 终端首选）、`--password-prompt`（人工交互终端）、`--password-file <0600路径>` 或 `--password-fd <n>`（`n >= 3`） |
| 原生口令保护容器 `0.6.0` · 直接 CLI `--session` | `@aikdna/kdna-cli@0.46.0`（或 `0.45.2`） | 选定文件、`--allow-read`，以及 `--password-env <VAR>`（`0.46.0`）、`--password-file <0600路径>` 或 `--password-fd <n>`（`n >= 3`）——**严禁使用 `--password-file /dev/stdin`**（`stdin` 用于传输 JSONL 请求） |
| 原生口令保护容器 `0.6.0` · 本地 MCP（`kdna-mcp.mjs`） | `@aikdna/kdna-mcp-server@0.8.4`（内置只读 `0.45.2` 依赖图） | 由操作者在启动 `argv` 中提供 `--asset <绝对路径> --allow-read` 及 `--password-file <0600路径>` 或 `--password-fd <n>`（`n >= 3`）——**严禁使用 `--password-file /dev/stdin`**（`stdin` 是 MCP JSON-RPC 传输通道） |

不要从 `.kdna` 后缀推断格式；输入不支持或缺少口令时，绝不能自动转码或解压
读取原始 payload。严禁把口令写进命令行参数（`argv`）、shell 历史或聊天记录。

创建时，按 [`kdna-creator`](../kdna-creator/SKILL.md) 及四份按需参考文档（[人机共创工艺](../kdna-creator/references/co-creation-craft.md)、[扩展 `kdna.draft/1` 与 16 方法角色表](../kdna-creator/references/draft-schema-and-methods.md)、[命令行创作与本地加密](../kdna-creator/references/authoring-and-protection.md)、[原生结构与诊断](../kdna-creator/references/native-asset-authoring.md)）执行：先做扩旧/新建分流与轻量/体系分级，按 `works` / `interview` / `research` 三路径分流（`research` 路径确认材料范围与采用边界，绝不让非专业用户认证领域真理），大语料（`>= 5` 文件或 `> 30 KB`）启用私有 `.kdna-work/` 暂存，经分层“采用 / 修改 / 舍弃”审阅表与 `kdna review` 审阅单确认后，用 `@aikdna/kdna-cli@0.46.0` 执行 `validate-input` 与 `create --draft`，冷重开并执行两层诚实校验（所有宿主执行 Tier 1 闭包与刹车冒烟检查；仅当宿主支持零历史隔离子 Agent 时执行 Tier 2 真盲测）。

创建失败时，按[完整诊断路径](../kdna-creator/references/native-asset-authoring.md#3-reading-complete-cli--core-diagnostics)
完整呈现全部错误码、字段指针及缺失/`null` 区分，不要只用一句简短状态掩盖原因。

读取已有资产时，按 [`kdna-loader`](../kdna-loader/SKILL.md) 操作：先读 `catalog`，
仅选择与当前任务真正相关的 1–5 条判断（都不适用则选 0 条），通过 `exact_selection`
搭配 `--format human` 或 `--compact` 一次批读，完整保留停手边界、条件例外、误用
提示与冲突刹车；同时授权多份 `.kdna` 且出现跨文件冲突时立即刹车交由用户裁决；
回答时明确标注引用资产与判断 ID。

通过本地 MCP 读取正文时，省略 `presentation` 默认返回已装 Read 包的 `body` 视图（若不支持投影则退回完整官方信封）。普通调用若需查看原始完整信封或核对完整签名与回执，应直接显式传 `presentation: "full"`；仅当此前显式使用 `presentation: "task"`（并指定 `view_budget_bytes`）拿到了 `audit.audit_ref` 时，才可通过 `kdna.audit` 取回那一次对应的原始完整结果（不执行新读取或续授权限）。若预算不足导致失败，请调大预算后重读，不要基于半截内容下结论。

修改时，始终以 **`draft.json` 作为唯一规范源文件**：修订 `draft.json`、递增
`asset.version`、通过 `create --draft` 生成新的兄弟 `.kdna` 文件，并用
`kdna diff <old.kdna> <revised.kdna> --format human`（口令轮换时可用
`--left-password-*` / `--right-password-*`）向作者呈现改动与下游影响。仅当修订
没有 `draft.json` 的外部 `.kdna`（或含 `members[]` 附件）时才使用 `source-open` /
`source-pack`。已运行的 MCP 进程固定了初始字节，切换修订版本需由可信启动器重启
新进程。

使用 `kdna protect` 进行本地离线口令加密时，请注意**外层 `manifest`（标题、摘要、
创建者、关键词）保持明文**以便未解锁时安全 `inspect`，仅 `payload.kdnab` 经 AEAD
加密；务必在本地私密保留未加密的 `draft.json` 与明文 `.kdna` 以便后续修订。

交付应包括文件位置、创建或修改了什么、按真实层级标注的校验结果以及尚未完成的
检查。机器校验、Agent 审阅、冒烟自检与真人接受分别报告，构造例子不能写成现实中
已经观察到的成果。

## 应用开发者

先选应用实际需要的接入层：

| 入口 | 适用情况 | 现有实现或示例 |
| --- | --- | --- |
| 官方 CLI | 应用或 Agent 能调用本地进程完成创建、读取和修改 | [原生流程示例](https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs)及[周报材料](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md) |
| 本地 MCP | 具名 Host 通过只读工具读取一个已经选定的原生资产 | [MCP 接口](../mcp-server/README.md)和对应 Host 指南 |
| 直接调用 Core + Read SDK | 应用负责字节准入、保留会话以及可信权限与交付 provider | [官方 CLI 的公共 API 接线](https://github.com/aikdna/kdna-cli/blob/main/src/public-cli.js) |

原生容器 0.6 / Read 0.7.0-candidate 路径使用这些正式入口：
`@aikdna/kdna-core/sections-node`、`@aikdna/kdna-core/sections-bytes-node`、
`@aikdna/kdna-core/retained-sections-node`、
`@aikdna/kdna-read/retained-sections-node`。使用实际选定的配套版本和导出类型；
仅 `/node` 是另一份合同。官方 CLI 展示了完整顺序：请求和 Whole 字节准入，
保留被接受的 snapshot，建立可信读取 authority/provider，然后依次调用
`admitRetainedSectionRequest` → `prepareRetainedSectionRead` →
`readRetainedSection`。先 `catalog`，再 `exact_selection`；扩展时复用同一
snapshot 发出的 handle，把完整结果 channel 与 envelope 交给应用。权限必须
来自实际任务，不能把无条件放行的 callback 复制到正式应用中。

[Core retained 类型](https://github.com/aikdna/kdna/blob/main/packages/kdna-core/src/public-contract/retained-sections-node.d.ts)
和 [Read retained 类型](https://github.com/aikdna/kdna/blob/main/packages/kdna-read/src/retained-sections-node.d.ts)
定义了这些接口。[原生周报示例](https://github.com/aikdna/kdna/blob/main/examples/native-team-update/README.md)
也解释了任务采用与修改，但保留的是历史 preview 包坐标。示例中的归档或 `main`
源码链接，不证明对应包组合已经发行。

让应用用户用普通语言选择文件、用途和允许处理材料的对象。当前原生本地 MCP 适配器
每个进程只接收一个操作者绑定的文件，保持严格只读，不发现资产、不管理账号、不编译
草稿，也不提供云资产库。

使用精确的官方 CLI/Core/Read 字节与[Loader 合同](KDNA_LOADER_CONTRACT.md)。
可信启动器和模型工具请求要有实际隔离，不能让模型通过执行代码或改配置扩大
绑定范围；本地 stdio 本身不提供这种隔离。区分就绪正文、必需上下文、拒绝结果
和传输失败。停止或 cancel 结束后续使用，但不会撤回已交付的文本。创建与修改
各自需要明确写入范围，通过原生 CLI 完成，不通过 MCP 读取工具完成。

[MCP 说明](../mcp-server/README.md)提供源码和打包消费检查。还要使用真实
Agent、真实材料和一次修改，验证自己的实际链路：进程测试不能认证某个 Host，
也不能证明回答质量。[支持矩阵](agent-support-matrix.json)单独记录当前 MCP
证据，不与直接 CLI 能力混为一谈。

消费 MCP 返回值的应用应明确区分呈现形状：省略 `presentation` 时默认返回已装 Read 包的
`body` 视图（若该包不支持投影则退回完整官方信封）；显式传 `presentation: "full"` 返回
完整官方信封；传 `presentation: "task"` 必须提供独立 `view_budget_bytes`，返回
`kdna.mcp.task-presentation/0.1.0`。三种模式仍共用原来的官方 `budget_bytes`。
别名是指向完全相同规范对象的外置指针，不是另一套作者格式；理解内容前先
还原完整结构。`kdna.audit` 仅用于凭前序 `task` 交付签发的 `audit.audit_ref` 取回那一次的
原完整结果，不触发新读取也不续授权限。不能把适配器不可用、引用过期或容量／预算失败
当成官方拒绝，也不能当成成功读到空正文。

[English](GETTING_STARTED.md)
