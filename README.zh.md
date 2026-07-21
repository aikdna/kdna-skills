# KDNA Agent 适配器

本仓库保留 KDNA 的 Agent、Skill 与 MCP 集成使命。当前 `kdna-loader` Skill 在
重新验证用户授权与 Host 可见性合同期间，状态为 **Unassessed（未评估）**。

KDNA 不是 Skill。`.kdna` 文件是可携带的判断资产；适配器只是 Host 调用官方
KDNA 工具链的一种方式。

## 当前安全路径

```bash
npm install -g @aikdna/kdna-cli
kdna validate ./judgment.kdna
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

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

Skill 文件存在、`kdna setup` 成功或找到本地文件，都不能证明 Agent 集成正确。
