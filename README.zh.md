# KDNA Agent 适配器

本仓库保留 KDNA 的 Agent、Skill 与 MCP 集成使命。当前 `kdna-loader` Skill 在
重新验证用户授权与 Host 可见性合同期间，状态为 **Unassessed（未评估）**。

KDNA 不是 Skill。`.kdna` 文件是可携带的判断资产；适配器只是 Host 调用官方
KDNA 工具链的一种方式。

## 当前安全路径

显式使用单个文件：

```bash
npm install -g @aikdna/kdna-cli
kdna load ./judgment.kdna --profile=compact --as=json
```

npm 已发布的 CLI `0.36.0` 会在这一条 `load` 内完成校验和计划。若原始指令已经
绑定精确文件、任务/用途、当前 Host、具名处理者和最小投影，就不再追加确认；
若缺少任一实质维度，Host 只补一次合并确认。随后 Agent 不得把
validate/plan/load 拆成三次重复审批。单次路径不创建 attachment 或持久工作区
状态；`validate` 与 `plan-load` 只是可选诊断，不是加载前必走步骤。受保护文件
最多追加一次必要的密码授权，并且只能走有界 stdin，密码不得进入 argv、环境、
任务文件或输出。

已发布的 `0.5.0` MCP server 也通过其精确的 `@aikdna/kdna-cli@0.36.0` 源码依赖
支持用户批准的工作区关系。这些命令在该已发布版本中可用：

```bash
secure-host-attachment-json | kdna attach ./judgment.kdna \
  --cwd ./my-project --attachment-stdin --preview
secure-host-attachment-json | kdna attach ./judgment.kdna \
  --cwd ./my-project --attachment-stdin --yes \
  --consent-digest sha256:<digest-from-preview>
kdna attachments --cwd ./my-project
```

`secure-host-attachment-json` 代表 Host 的有界、严格 UTF-8 stdin 生产器。两次
调用必须使用完全相同的最终 role、正向范围、可选负向范围与批准来源字节。Agent
和 MCP 集成不得把这些可能私密的字段放进 argv，也不能用未绑定收据的裸
`--yes` 代替预览确认。

随后由 Host 调用薄 MCP 的工作区状态、解析和加载工具。MCP 不能创建或修改附加
关系，只暴露这三个受工作区约束的工具，不暴露任意路径显式文件工具；用户选择
单个文件时使用上面的官方 CLI 路径。

MCP 组件可以由原生 Host secret provider 通过一个全新、当前用户所有且权限为
`0600` 的临时授权文件提供密码。路径和值都不进入工具参数，适配器只通过固定
CLI 的密码 stdin 传值。这只证明进程边界，不是当前 Codex/OpenCode 普通用户
路径：用户不得手工造文件、导出坐标或在聊天中发送密码。标准 Host 尚未提供并
验证模型不可见 provider 与清理前，受保护 MCP 消费保持 deferred；受保护显式
文件的 CLI stdin 是已测试底层能力，普通公开资产完全不需要秘密 provider。

批准 attachment 不等于同意把解密 Capsule 交给模型。工作区加载前，Host 必须
就精确资产、Host 身份、具名处理目的地与最小投影取得一次自然语言批准，并通过
Host 私有、可轮换的 consent 文件机械绑定。用户只看名称和允许/拒绝；attachment
ID、digest、Schema、scope mode、approval source 与 profile 都由 Host 隐藏。

CLI `0.36.0` 源码候选包含人读 `kdna host-consent --from-workspace` 表面：从用户
已批准的工作区附加记录推导 Host 处理同意草稿，终端提示隐藏 digest、附加 ID 和
scope 坐标。机器草稿路径（`--input-file`/stdin）仍是可信 launcher 的低层
broker，不允许模型或用户手工拼装。

必须先由用户选择文件，或批准一个精确的 Host 附加项。适配器不能扫描全局资产
库、根据任务关键词自行选择资产、从文件存在推断同意，也不能隐藏是否使用了
KDNA。

## 适配器合同

- 只接收一个显式文件或精确的用户已批准附加项；
- 把解析、完整性、授权、解密和投影交给 Core；
- 只有 LoadPlan 允许，或唯一剩余条件是由真实 CLI stdin 加载验证的密码时才加载；
- 显示当前资产身份、版本或摘要、作用域和原因；
- 显示可用控制，并把停用、启用、切换、回滚、移除和清理等附加项写操作指向
  官方 CLI；MCP 适配器本身不修改附加项；
- 当前事实、用户意图、法律、安全、系统规则与 Host 权限高于资产内容。

详见[加载器合同](docs/KDNA_LOADER_CONTRACT.md)和
[支持矩阵](docs/agent-support-matrix.json)。

## 仓库组件

| 组件                    | 当前状态                                            |
| ----------------------- | --------------------------------------------------- |
| `kdna-loader/SKILL.md`  | 未评估的 fallback 适配器候选                        |
| `kdna-creator/SKILL.md` | 终端 Creation Engine 引导源码候选；尚未评估         |
| MCP server              | `0.5.0` 三工具工作区源码候选；组件测试通过           |
| Codex / OpenCode        | OpenCode `1.18.11` 为 `VERIFIED_SINGLE_HOST_ORDINARY_TASK`；Codex `0.144.3` 为 `RECHECK_REQUIRED`（普通任务重测待账户额度恢复） |
| 其他 Agent 放置指南     | 未评估的集成说明                                    |
| 安装脚本                | 每次只安装到用户明确指定的一个 Host；不检测、不全装 |

组件测试不等于 Host 交付、语义采用、Creation-to-Consumption 联合集成或真人
验收。当前已有私有机器权威，其原始 Host 核对在 OpenCode `1.18.11` 上通过普通
任务单 Host 闭环（`VERIFIED_SINGLE_HOST_ORDINARY_TASK`）；Codex+OpenCode 语义
benchmark 在 preference-rename 判据上通过，Codex 普通任务重测待账户额度恢复。
真人验收仍为 `NOT_RUN`。Codex 与 OpenCode 只是本轮 benchmark 坐标，不是产品
限定的 Host 品牌。

一个合格 Host 在真实交付 Runtime Capsule，并证明授权、可见、可逆的语义采用
后，就可以闭合一次功能消费。Codex+OpenCode 两者是本轮单独的
`PORTABILITY_BENCHMARK`，不是要求每位用户、每次安装或第三方 Host 同时运行
两个 Host。Studio 应用接入属于后续产品集成，并且必须复用 CLI/Core 的同一附件
Schema，不能另建状态权威。

npm 当前发布的 MCP 是 `0.5.0`；更早的 `0.4.2` 是历史版本。
Skill 文件存在、`kdna setup` 成功或找到本地文件，都不能证明 Agent 集成正确。

## 创作适配器

[`kdna-creator`](kdna-creator/SKILL.md) 引导终端 Agent 调用 Studio CLI 的统一
Creation Engine，不要求 Studio App。它与只读加载器分离：创作会写入一个显式
项目工作区，加载则只消费显式 `.kdna` 文件或用户批准的工作区附加项。

[Creation Agent 合同](docs/KDNA_CREATION_AGENT_CONTRACT.md)定义自然语言
Host 边界、无正文 inventory、私有材料交付、诚实的权限暂停、工作区内受管
测试候选、相互独立的三道门与最终同字节交付。内部 ID、签名材料和应用证据
属于 Host 编排，不是用户输入。这些源码文档本身不建立 Host 支持或 Studio
产品验收结论；只有 clean install 的全新 Host 走通公开路径后，creator Skill
才能从“尚未评估”升级。
