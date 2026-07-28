# agent-owned-ui-acceptance Specification

## Purpose

定义由 agent 负责实现 UI 变更时必须完成的自验收范围、路由矩阵、桌面和移动端检查、视觉一致性、运行时错误和最终汇报要求。

## Requirements

### Requirement: Agent-owned UI acceptance

实现 SHALL NOT 被视为完成，直到实施 agent 完成完整产品 UI 自验收，并在不依赖用户逐项发现问题的前提下解决关键不一致。

#### Scenario: 完成前必须审计

- **WHEN** 所有实现任务看似完成
- **THEN** agent 在标记 change 完成前执行并记录 UI audit。

### Requirement: 必需路由矩阵

UI audit SHALL 覆盖 public、topic、user、search、message、auth、content 和 admin 页面。

#### Scenario: 路由矩阵覆盖

- **WHEN** 执行 audit
- **THEN** 在数据和 auth 允许的情况下覆盖 `/`、`/topic/:id`、`/topic/create`、`/search`、`/user/:name`、`/my/messages`、`/signin`、`/signup`、`/search_pass`、`/reset_pass`、`/about`、`/faq`、`/getstart`、API 文档页、`/admin`、`/admin/topics`、`/admin/users`、`/admin/bans`、`/admin/reports`、`/admin/keywords`、`/admin/audit` 和 `/admin/settings`。

### Requirement: 桌面和移动端审计

UI audit SHALL 检查代表性桌面和移动端 viewport。

#### Scenario: 响应式审计

- **WHEN** 审计每个 route family
- **THEN** agent 检查约 1280px 桌面宽度和约 390px 移动宽度
- **AND** 验证无关键布局溢出、损坏导航或隐藏关键操作。

### Requirement: 视觉一致性清单

Audit SHALL 验证 Header/Footer/Layout 一致性、品牌 token 使用、hover/active/focus 状态、有意义的 sidebars、card/line/shadow 层级和页面模板遵循情况。

#### Scenario: 模板一致性检查

- **WHEN** route 被审计
- **THEN** agent 确认它使用正确页面模板，并与 Header shell 或命名 reading shell 对齐。

### Requirement: Runtime 和可访问性检查

Audit SHALL 验证 console errors、可检测的坏图、可聚焦控件、icon-only button 的可访问 label，以及无死控件。

#### Scenario: Console 和控件检查

- **WHEN** 每个审计 route 加载
- **THEN** 不存在非预期 console errors
- **AND** icon-only controls 具有可访问 label。

### Requirement: Audit 结果总结

最终实现回复 SHALL 总结审计页面、viewport 覆盖、运行命令、未解决 gaps 和已知 residual risks。

#### Scenario: 最终审计总结

- **WHEN** 实现完成
- **THEN** agent 在声明 change ready 前报告 audit 范围和结果。
