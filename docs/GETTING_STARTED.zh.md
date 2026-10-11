# 让 Agent 带你完成一次真正有用的任务

从一个具体问题和有权使用的材料开始。领域判断系统可以帮助你处理反复出现的
问题，说明判断的理由和限制，并在使用后继续改进。不同领域可以分别保存，
不要求凑够多少问题或多少份资产。

把这份指南和[本仓库](../README.zh.md)交给具备工具调用能力的 Agent。由它完成
安装和工具操作，最后交付可用文件或答案。下面的步骤描述 Agent 应做的工作，
不要求你填写技术表格。

## 你需要提供什么

说明用途、面向的人和允许使用的材料。读取已有资产时，指定文件和问题；创建
或修改时，指定保存位置，说明当前是草稿还是打算采用的内容。明确哪些 Agent
或其他处理方可以接收材料。本地工具不代表连接云端模型的 Agent 只在本机处理。

Agent 应复用对话中已经明确的选择，只在缺少实质信息时用一句普通问题补齐。
文件摘要、合同坐标、标识和句柄由它处理。读取许可不能自动扩展为修改、公开
发布、调用其他服务商或执行建议的许可。

## Agent 安装核查步骤

1. 先确认[官方仓库](https://github.com/aikdna/kdna-skills)和实际发行或源码候选状态，
   再选定 revision。检出目录自带的摘要不能独立认证其来源。
   使用明确 Git revision 的完整检出，包含
   `mcp-server/package-lock.json` 和全部 `vendor/` 依赖归档，记录实际 revision。
   不混用不同版本的文件，不从全局安装替换同名版本。当前 MCP 只以源码交付，
   不能假定 npm 上已有对应发行。
2. 检查本地运行时。安装脚本要求 `bash`、`tar`、Node.js 22 或更新版本及 npm；当前稳定配套
   依赖图已在 Node.js 22.23.1、npm 11.17.0 下运行。必要时在已有安装授权范围内
   选用隔离运行时，不为这次任务顺手修改用户的全局运行时。
3. 把选定的 Node 和 npm 放入本次进程 `PATH`，从检出目录运行
   `bash install-cli.sh`。脚本核对 manifest、lock 和归档字节，离线安装，禁用
   安装钩子与可选依赖，随后核对实际安装图。十二个必需依赖均来自本地归档。
   它不安装全局 CLI，也不启动 MCP 服务。
4. 用同一 Node 解释器调用脚本打印的精确 CLI 路径。原生创作和直接读取都可
   通过该 CLI 完成。从检出目录阅读相应 Skill 及相对引用；一次任务不必先把
   Skill 永久放入 Agent 配置目录。
5. 需要 MCP 连接时，按[具名 Host 指南](agent-support-matrix.json)为已选文件和
   用途准备配置。实际启动绑定由用户、操作者或可信启动器掌握；模型不能靠
   工具参数自授权限或扩大文件范围。核查该 Agent 软件的真实连接和工具结果。

仓库中的 `install.sh` 可按一个明确选择的 Host 放置 `kdna-loader`，支持
`--codex`、`--claude`、`--opencode`、`--cursor`、`--copilot`。它拒绝覆盖不同的
既有内容，也不启用 MCP。只在本次确实需要永久安装时使用。Creator 没有对应
安装脚本；可以直接使用检出目录中的 Skill，或在获准安装时保留它的完整目录，
包括 `references/` 和 `scripts/`。

安装失败时，指出实际缺失的输入或未通过的检查。缺归档就取得该 revision 的
完整源码，字节不符就核对可信来源，Host 无连接就确认它实际支持的入口。不要
退回 `latest`、私有 payload 解析器或无关的全局 CLI。如果 Host 允许执行 CLI，
且用户已授权该文件和处理用途，直接 CLI 读取仍是一条可用路径。

## 创建、使用、再修改

先根据文件实际声明的格式及创作路径，选择匹配的读取入口：

| 已保存资产 | 读取入口 | 权限与凭据 |
| --- | --- | --- |
| 原生公开容器 `0.6.0` | 官方原生 CLI 或本地 MCP，Read `0.7.0-candidate` | 选定文件及明确读取许可 |
| Studio 公开容器 `0.5.0` | [Studio Host](../kdna-creator/references/studio-protected-host.md)，Read `0.6.4` | 可信启动器绑定文件与读取许可；省略密码和恢复选项 |
| Studio 受保护容器 `0.5.0` | 同一 [Studio Host](../kdna-creator/references/studio-protected-host.md) | 可信读取绑定与独立凭据管道；Source／修改另需许可 |

Studio 指南给出了普通和受保护文件的精确安装组合及子进程参数。不要把 Studio
文件送入原生 MCP，也不要从 `.kdna` 后缀推断格式。配套包版本相同不代表两条
文件路径可互换；输入不支持时不能自动转码或绕过工具读取原始 payload。

创建时，按 [`kdna-creator`](../kdna-creator/SKILL.md) 和
[原生创作说明](../kdna-creator/references/native-asset-authoring.md)操作。先整理
真实问题、判断、理由、例子和必要的共同概念，再编码保存。和用户核对来源、
适用范围，区分作者判断、推断和构造例子。用官方 CLI 保存草稿，重新打开实际
文件，逐项核对完整内容是否忠实保留，再通过官方运行时用于一个具体任务。

创建失败时，按[完整诊断路径](../kdna-creator/references/native-asset-authoring.md#read-the-whole-diagnostic)
呈现问题：CLI 输入错误可能在顶层给出 `code` 和 `diagnostic.field`；Core 错误
同时保留 `core.reason` 及每个 `core.diagnostics` 条目的 `code`、`subject`、`field`。
读取全部条目，区分缺省字段与明确的 null。可以用普通语言解释，但不能只显示
简短状态、隐藏原始错误码、字段指针或完整因果结果。

读取已有资产时，按 [`kdna-loader`](../kdna-loader/SKILL.md) 操作。先读 catalog，
从返回的条目中选择本任务真正需要的问题，通过 `judgment_ids` 一次精确批读，
保留必须共同读取的上下文和限制。同一任务、同一快照、同一选择的内容已经取得
时直接使用，只有确实缺信息或需要核查才再次读取；需要更多细节时，只用同一
会话发出的 handle 扩展。回答时说明用了哪个资产、哪些判断。目录、技术检查
或未就绪的结果都不等于已经取得判断正文，不能把受限内容当作不存在。

Agent 可以显式选择 MCP 的[任务呈现](../mcp-server/README.md#optional-task-presentation-and-exact-audit)，
把完全相同的重复对象改用引用表达；默认仍是完整结果。Agent 负责独立的呈现
预算和全部别名还原，保留任务需要的作者正文及各项状态。只有确实需要时才通过
audit 取回那一次原始完整结果；签名、校验和、策略及是否发生新验证等判断相关
状态仍直接展示，Agent 必须一起读取。“未提供签名”不等于“签名已验证”，旧检查
也不等于新检查。audit 不新增读取许可。预算不足不能靠半截答案或
读取 Host 文件绕过。[另一次 Codex CLI 任务视图案例](../integrations/codex/README.md#observed-task-presentation-case)
通过一次批量选读取得就绪内容，并保留判断的范围和限制。此前完整呈现案例单独
保留。具名模型的 audit 使用、扩展和其它 Host 品牌仍未验；强制 Host 显示截断的
案例只证明了停止，没有证明截断后能继续读完。

修改时，按官方 Source 流程另存新文件，保留原件并记录真实改动。在新进程中
重开新版本，检查改动涉及的判断，也检查应保持的内容，再用同一个实际问题
观察修改是否达到目的。已运行的 MCP 进程保留最初绑定的字节；修订文件需要
可信启动器启动新的进程。

交付应包括文件位置、创建或修改了什么、从已保存资产得到的实际答案，以及
尚未完成的内容或检查。机器校验、Agent 内容审阅、真人接受分别说明。构造例子
不能写成现实中已经观察到的成果。

## 应用开发者

先选应用实际需要的接入层：

| 入口 | 适用情况 | 现有实现或示例 |
| --- | --- | --- |
| 官方 CLI | 应用或 Agent 能调用本地进程完成创建、读取和修改 | [原生流程示例](https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs)及[周报材料](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md) |
| 本地 MCP | 具名 Host 通过工具读取一个已经选定的原生公开资产 | [MCP 接口](../mcp-server/README.md)和对应 Host 指南 |
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
源码链接，不证明当前稳定包组合已经发行。

让应用用户用普通语言选择文件、用途和允许处理材料的对象。应用可以隐藏安装
细节和机器字段，同时明确告知资产在何处影响了答案。当前原生本地 MCP 适配器
每个进程只接收一个操作者绑定的文件；它不发现资产、不管理账号、不写工作区
附件，也不提供云资产库。

使用精确的官方 CLI/Core/Read 字节与[Loader 合同](KDNA_LOADER_CONTRACT.md)。
可信启动器和模型工具请求要有实际隔离，不能让模型通过执行代码或改配置扩大
绑定范围；本地 stdio 本身不提供这种隔离。区分就绪正文、必需上下文、拒绝结果
和传输失败。停止或 cancel 结束后续使用，但不会撤回已交付的文本。创建与修改
各自需要明确写入范围，通过原生 CLI 完成，不通过 MCP 读取工具完成。

[MCP 说明](../mcp-server/README.md)提供源码和打包消费检查。还要使用真实
Agent、真实材料和一次修改，验证自己的实际链路：进程测试不能认证某个 Host，
也不能证明回答质量。[支持矩阵](agent-support-matrix.json)单独记录当前 MCP
证据，不与直接 CLI 能力混为一谈。

消费 MCP 返回值的应用应明确区分呈现形状：省略参数或 `presentation: full`
返回原官方结果；`presentation: task` 必须提供独立 `view_budget_bytes`，返回
`kdna.mcp.task-presentation/0.1.0`。两者仍使用原来的官方 `budget_bytes`。
别名是指向完全相同规范对象的外置指针，不是另一套作者格式；理解内容前先
还原完整结构。`kdna.audit` 只是可选的原次结果取回，不续授权限。不能把适配器
不可用、引用过期或容量／预算失败当成官方拒绝，也不能当成成功读到空正文。

Studio 访谈、终端 session 和受保护文件有各自的
[Creator 说明](../kdna-creator/SKILL.md)。它们是使用不同容器合同的可选路径。
不能把受保护的 Studio 文件发给原生 MCP，也不能把一条路径的验收挪给另一条。

[English](GETTING_STARTED.md)
