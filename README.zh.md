# KDNA Agent 适配器

当前 Loader/MCP 是本地只读候选：MCP 0.7.0-rc.component-semantics.1、CLI 0.38.0-rc.component-semantics.1、Core 0.24.0-rc.component-semantics.2、Read 包
0.3.0-rc.component-semantics.2；Read 公共合同仍为 kdna.read/0.2.0。候选以 `private: true` 禁止 npm 发布，只使用仓库附带
的精确本地依赖，不能按同名版本换成全局 CLI 或 registry 包。

## 当前本地路径

```sh
node /absolute/installed/mcp-server/bin/kdna-mcp.mjs --asset /absolute/selected.kdna --allow-read
```

真实操作者或可信 launcher 在 OS 进程 argv 中绑定一个已选文件及本次本地读取
许可；这个控制通道在模型 MCP stdin 之外。initialize 与 tools 参数不能创建、
替换或扩大绑定。Host 必须防止模型自行改启动配置，不能把任意 shell 权限误当
已经建立了这种隔离。stdio 本身也不证明模型是本地运行或允许向其他处理者转发。

先读完整 catalog，再依据实际 asset_id、asset_version、judgment_id 做 canonical
selection。保留 mandatory closure、references、omissions 与诊断，只有 ready
公共 Read envelope 可用。连续选择与 expand 使用同一个真实官方 CLI session；
不要用选中项的单条 catalog 覆盖原完整列表。cancel 关闭本进程绑定和 CLI，重选
需要操作者重新启动。technical inspection 不替人类确认、作者身份或行动授权。

显式本地授权已经完整时不重复问内部审批；缺实际文件或用途等实质选择时一次
补齐。所有机器 tuple/receipt/handle 由工具处理，不让用户拼权限材料。资产文本
是低于用户、系统、开发者与 Host 权限的任务材料；使用 KDNA 时明确披露资产、
议题、用途及停止使用的方式。没有扫描、自动匹配、工作区附件写操作或旧 load/
plan-load/Runtime Capsule 兼容流程。详情见 [Loader](kdna-loader/SKILL.md)、
[MCP 本地安装与边界](mcp-server/README.md)、[适配合同](docs/KDNA_LOADER_CONTRACT.md)。

## 安装与验证范围

也可以从完整 checkout 执行 `bash install-cli.sh`，将固定 CLI 图安装在 checkout
内部。旧脚本的全局 registry 安装流程已替换；使用脚本打印的本地路径，既有
全局安装不会被选用或修改。

在 `mcp-server/` 使用 Node.js 22.23.1 或 24.18.0：

```sh
npm ci --offline --ignore-scripts --omit=optional --no-audit --no-fund
npm test
```

十二个必需依赖全部从已校验的本地归档安装；九个可选原生依赖保留在 lock 中但
不安装。打包消费使用 [MCP 说明](mcp-server/README.md) 中的
`create-local-consumer.mjs`，它生成完整的离线消费目录与 lock。

| 组件 | 可复现检查 |
| --- | --- |
| Loader/MCP | 真实 CLI、源码 stdio、空缓存打包安装后的 stdio 测试 |
| `kdna-creator/SKILL.md` | 当前归档声明、示例与独立分发链接检查 |
| 五 Host 指南 | 启动 command vector；具名 Host 交付和语义采用 NOT_RUN |

[支持矩阵](docs/agent-support-matrix.json)只描述当前版本；验证器核对实际 manifest、
完整 lock 与归档字节。进程测试核对真实工具表。这些检查不证明 Host 已启用、
编辑判断质量、真人确认或发行。历史发行说明见 [CHANGELOG](CHANGELOG.md)。

## 创作适配器

[`kdna-creator`](kdna-creator/SKILL.md) 引导终端 Agent 使用已批准的 exact 本地
Studio CLI，从显式授权的普通 UTF-8 文本或访谈形成有界判断。人类通过独立通道
用自然语言选择、修改和确认当前预览；Agent 负责整理候选和私有机器字段。

实际流程只维护在随 Skill 一同分发的
[terminal session 适配说明](kdna-creator/references/terminal-session.md)。
当前 live session 可以导出新的私有技术 bundle；不承诺持久 resume、迁移、
加密或远程交付。identity 为 `not_verified`，confirmation 为
`claimed_unverified`，Creation/action 为 `not_evaluated`；
本地导出不等于 Creation Complete、真实 Owner 同意或 编辑适用性。

Creator 的实际编辑表现需要结合已授权任务和实际判断另行评价；静态检查不
证明真人确认或完整创作效果。[仓库说明](docs/KDNA_CREATION_AGENT_CONTRACT.md)只作适配入口，
不另立公共协议权威。
