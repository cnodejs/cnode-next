## ADDED Requirements

### Requirement: Pull requests SHALL enforce sqlite and pg redis required checks
CI pipeline MUST 在 pull request 上强制执行 sqlite 快速校验与 pg/redis 集成校验两类 required checks。

#### Scenario: Pull request is opened or updated
- **WHEN** CI 在 pull request 上运行
- **THEN** sqlite fast checks MUST 执行，且 MUST 作为合并必过项

#### Scenario: Pull request integration dependency coverage
- **WHEN** CI 在 pull request 上运行
- **THEN** pg/redis integration checks MUST 执行，且 MUST 作为合并必过项

### Requirement: Release workflows SHALL enforce full functional validation
release pipeline MUST 执行完整功能校验，并在失败时阻断发布。

#### Scenario: Release workflow is triggered
- **WHEN** release workflow 被触发
- **THEN** full functional checks MUST 在具备 pg/redis 能力的配置下执行并输出通过/失败结果

#### Scenario: Release full-functional checks fail
- **WHEN** 任一 required full functional check 失败
- **THEN** release workflow MUST 失败，且 MUST NOT 进入发布审批流程

### Requirement: Nightly full-functional workflows SHALL be out of scope
本次变更的 CI 策略 MUST 将 nightly 完整功能工作流排除在范围之外。

#### Scenario: CI policy definition is reviewed
- **WHEN** 贡献者审阅本变更定义的 CI lanes
- **THEN** 范围内 MUST NOT 包含 nightly full-functional required lane
