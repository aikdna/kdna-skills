# KDNA Agent 适配器

本仓库保留 KDNA 的 Agent、Skill 与 MCP 集成使命。当前 `kdna-loader` Skill 在
重新验证用户授权与 Host 可见性合同期间，状态为 **Unassessed（未评估）**。

KDNA 不是 Skill。`.kdna` 文件是可携带的判断资产；适配器只是 Host 调用官方
KDNA 工具链的一种方式。

## 当前安全路径

显式使用单个文件：

```bash
npm install -g @aikdna/kdna-cli
kdna validate ./judgment.kdna
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

`0.5.0` MCP 源码候选通过其精确的 `@aikdna/kdna-cli@0.36.0` 源码依赖支持
用户批准的工作区关系。npm 当前发布的 CLI 仍是 `0.35.1`，不能把以下命令当作
该已发布版本的能力：

```bash
kdna attach ./judgment.kdna --cwd ./my-project --role article-writing \
  --applies-to draft --does-not-apply-to code --yes
kdna attachments --cwd ./my-project
```

随后由 Host 调用薄 MCP 的工作区状态、解析和加载工具。MCP 不能创建或修改附加
关系。

必须先由用户选择文件，或批准一个精确的 Host 附加项。适配器不能扫描全局资产
库、根据任务关键词自行选择资产、从文件存在推断同意，也不能隐藏是否使用了
KDNA。

## 适配器合同

- 只接收一个显式文件或精确的用户已批准附加项；
- 把解析、完整性、授权、解密和投影交给 Core；
- 只有 LoadPlan 允许时才加载；
- 显示当前资产身份、版本或摘要、作用域和原因；
- 提供停用、切换和回滚控制；
- 当前事实、用户意图、法律、安全、系统规则与 Host 权限高于资产内容。

详见[加载器合同](docs/KDNA_LOADER_CONTRACT.md)和
[支持矩阵](docs/agent-support-matrix.json)。

## 仓库组件

| 组件                   | 当前状态                                            |
| ---------------------- | --------------------------------------------------- |
| `kdna-loader/SKILL.md` | 未评估的 fallback 适配器候选                        |
| `kdna-creator/SKILL.md` | 终端 Creation Engine 引导源码候选；尚未评估         |
| MCP server             | `0.5.0` 源码候选；Codex 与 OpenCode 已验证          |
| Codex / OpenCode       | 分别启用 MCP 后的源码候选已验证                     |
| 其他 Agent 放置指南    | 未评估的集成说明                                    |
| 安装脚本               | 每次只安装到用户明确指定的一个 Host；不检测、不全装 |

npm 当前发布的 MCP 仍是历史版本 `0.4.2`，不是这里的 `0.5.0` 工作区候选。
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
