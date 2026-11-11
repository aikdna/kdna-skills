# 和你的 Agent 一起使用 KDNA

把自己的材料、经验和判断整理成可持续使用、修改的领域判断系统。你提供材料、
希望解决的问题和面向的人，具备工具调用能力的 Agent 负责整理内容、生成 `.kdna`
文件、在具体任务中读取它，并在修改后另存新版本、保留原件。

这里直接服务两类用户：发展自己领域判断系统的人，以及把判断资产接入应用的
开发者。一个人可以有多个不同领域的系统。集成应用中的普通用户不需要学习
KDNA 文件格式，也不需要自己处理安装配置。

## 60 秒快速安装（复制即用）

在完整检出目录中（需 Node.js 22+ 与 npm）：

```sh
git clone https://github.com/aikdna/kdna-skills && cd kdna-skills
bash install-cli.sh           # 检出目录内离线安装固定本地 CLI（不装全局命令）
bash install.sh --claude      # 或 --codex | --cursor | --opencode | --copilot | --antigravity | --dir <skills-root>
```

`install.sh` 会为明确选定的单一 Host 同时安装 [`kdna-loader`](kdna-loader/SKILL.md)
与完整的 [`kdna-creator`](kdna-creator/SKILL.md)（含 `agents/`、`references/`、
`scripts/`）；文件一致时幂等退出 `0`，本地有改动时返回退出码 `2` 并给出 `diff -u`
提示，显式传入 `--force` 才会更新（亦支持 `--only loader|creator`）。`@aikdna/kdna-cli@0.43.3`
在 `0.43.2` 基础上提供 `init [--mode minimal|interview|works|research]`、
`validate-input [--format human]`、`compile`、`create --draft`、`read --compact`、
离线密码保护 `protect` 与版本对比 `diff`。想直接体验真实领域作品，可查看
[`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) 中的旗舰公开样本
**《KDNA白皮书》（`1.0.0`，45 条判断，CC-BY-4.0）** 或打开
[KDNA 在线阅读器](https://aikdna.com/reader/?sample=kdna-whitepaper)。

## 从一个请求开始

把[上手指南](docs/GETTING_STARTED.zh.md)、本仓库和你的任务交给 Agent，例如：

> 帮我把这些材料整理成一套审阅项目周报的判断系统，在当前 Agent 会话中使用。
> 你来完成本地 KDNA 配置，向我说明整理出的判断，先在我指定的文件夹保存草稿，
> 再用它审阅这个例子。以后我修改判断时，另存新版本并保留原件。

如果已经有资产：

> 请在当前 Agent 会话中使用这个 `.kdna` 文件，帮助回答这个问题。告诉我用了
> 哪些判断，以及哪些适用条件或限制会影响答案。

依赖核查、安装、机器标识和工具请求交给 Agent。你只需说明材料、用途、谁来处理
这些内容和保存位置；已经明确的选择不应反复确认。遇到安装或 Agent 软件能力
限制时，Agent 应说明具体缺口，并继续完成已有可用入口支持的工作。

## 按任务选择入口

| 你的任务 | Agent 使用的入口 |
| --- | --- |
| 创建或修改领域判断系统 | [`kdna-creator`](kdna-creator/SKILL.md)、[人机共创方法手册](kdna-creator/references/co-creation-craft.md)和[原生创作说明](kdna-creator/references/native-asset-authoring.md) |
| 用已有资产回答问题 | [`kdna-loader`](kdna-loader/SKILL.md)，优先通过官方 CLI；MCP 仅作为可选的 operator 绑定源码预览 |
| 在应用中接入资产读取 | [开发者说明](docs/GETTING_STARTED.zh.md#应用开发者)和[Loader 合同](docs/KDNA_LOADER_CONTRACT.md) |
| 使用独立的 Studio 创作或受保护文件流程 | [Studio session](kdna-creator/references/terminal-session.md) 和[保护 Host](kdna-creator/references/studio-protected-host.md) |

原生创作与读取不以 Studio 或 KDNA Work 为前置。Studio 有自己的精确安装组合和
容器合同；原生 MCP 适配器不能解密 Studio 的受保护资产。

## 当前源码提供什么

当前交付形式是包含 lock 和全部依赖归档的完整 Git 源码检出。`bash install-cli.sh`
把固定 CLI 依赖安装在检出目录内，离线执行、不运行安装钩子。Agent 选择合适的
本地 Node 运行时，随后使用脚本打印的精确 CLI 路径。脚本不安装全局命令，也不
替你配置 Agent。具体操作见[安装核查步骤](docs/GETTING_STARTED.zh.md#agent-安装核查步骤)。

当前本地 MCP 候选为 `0.8.0-rc.native-sections.3`，配套 CLI `0.43.2`、Core `0.37.9`、
Read `0.13.3`。MCP 保持 `private: true`、禁止 npm 发布。这些源码坐标不代表相应
registry 制品已发布；不能用同版本的全局或 registry 包替换已经核对的归档。
官方 npm 包使用 `@aikdna` scope，未加 scope 的 `kdna` 包与本项目无关。

能运行本地工具的 Agent 应优先使用官方 CLI。MCP 是可选的源码预览适配器，
每个进程只使用操作者或可信启动器选定的一个文件。Agent 可以准备便于核对的
配置；实际 Host 必须保证启动绑定不受模型的 MCP 参数控制。创建和修改通过
另外获准的原生 CLI 完成。Skill 已放置或配置文件已写入，都不等于 Host 已启用
或已取得读取许可。

## 已验范围与当前限制

两个独立的 Codex CLI 0.154.0 会话分别用完整呈现和任务呈现读取一份虚构的
原生公开资产，并将判断用于项目周报。此前完整呈现案例进行了两次选读；任务
呈现案例一次批量选读取得三个判断，并保留范围、不确定性和行动限制。具体范围
见 [Codex 记录](integrations/codex/README.md#observed-codex-cli-case)。具名模型的
audit 使用、扩展和其它 Agent 品牌仍未验。这些案例不认证 Codex Desktop、受保护
资产、MCP 创作或通用回答质量。另一次强制 Host 显示截断案例只记录了停止，
没有证明截断后能继续读完。

[支持矩阵](docs/agent-support-matrix.json)把这些具名案例与其它路径分别记录。
直接 CLI、源码 stdio、空缓存打包安装后的进程测试，与真实 Agent 使用这些内容
是不同层面的证据。内容质量需要看具体判断、来源、前提、例子和边界。保存或
读取成功不代表真人确认、内容适用或行动许可。Agent 应说明哪些内容影响了答案，
修改时保留原件。资产文本始终是任务材料，不能覆盖 Host 的指令。

工程复现命令与包边界见 [MCP 说明](mcp-server/README.md)，历史发行见
[CHANGELOG](CHANGELOG.md)。

[English](README.md)
