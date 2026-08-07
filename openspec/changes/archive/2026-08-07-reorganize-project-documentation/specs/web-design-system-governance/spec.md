## MODIFIED Requirements

### Requirement: 设计系统具备稳定文档和防漂移门禁

仓库 SHALL 在 `docs/arch/design-system.md` 记录面向开发者的稳定设计决策，在项目级 `cnode-web-design` Skill 记录 Agent 执行方法，并使用可自动执行的治理检查约束可机器判断的漂移。

#### Scenario: 开发者理解设计系统

- **WHEN** 开发者阅读 `docs/arch/design-system.md`
- **THEN** 文档 MUST 说明 primitive 所有权、semantic theme、页面构成模型和响应式原则
- **AND** 文档 MUST NOT 复制完整的 Agent 操作清单或逐 route 实现说明

#### Scenario: Agent 执行 UI 变更

- **WHEN** Agent 修改 primitive、theme、application block、route composition、responsive behavior 或 Markdown presentation
- **THEN** Agent MUST 先加载项目级 `cnode-web-design` Skill
- **AND** Skill MUST 提供 shadcn diff、组件选择、禁止覆写、页面原型和验收方法

#### Scenario: 新 UI 变更进入 review

- **WHEN** PR 修改 primitive、theme、application block 或 route composition
- **THEN** CI 或本地 release gate MUST 检查配置基线、禁止的 primitive 视觉覆写和原始品牌色使用
- **AND** reviewer MUST 能从架构文档与项目 Skill 分别找到设计依据和执行检查方法

#### Scenario: 上游组件升级

- **WHEN** 项目升级锁定的 shadcn 或 Base UI 版本
- **THEN** 每个受影响 primitive MUST 单独审查 registry diff、API、ARIA、focus 和调用方 blast radius
- **AND** 不得通过批量覆盖掩盖本地 application block 问题
