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

UI audit SHALL 按页面原型覆盖 375px、768px、1280px 和 1440px viewport，并 SHALL 保留约 390px 移动端与约 1280px 桌面端的代表性检查，在每类原型检查 light/dark theme。审计 MUST 覆盖默认、hover、focus、active/selected、disabled、pending、error、empty、长内容和 overlay 状态中适用于该原型的关键状态。

#### Scenario: 响应式审计
- **WHEN** 审计每个 route family
- **THEN** agent 在四个标准 viewport 检查 shell、navigation、PageHeader、主要 blocks、forms、Table/Item、Markdown 和主要 actions
- **AND** 约 390px 移动端和约 1280px 桌面端代表性检查 MUST 保持覆盖
- **AND** 验证无关键布局溢出、损坏导航、隐藏关键操作、不可读内容或错误的密度切换。

### Requirement: 视觉一致性清单

Audit SHALL 验证 Base Nova primitive 完整性、semantic theme 与品牌 token 使用、Header/Footer/Layout 一致性、命名页面原型、Card/Field/Item/Table composition、card/line/shadow 层级、spacing/size scale、hover/active/focus 状态、responsive behavior、有意义的 sidebars 和 Markdown Typeset；视觉通过不得只依据页面能够加载。

#### Scenario: 模板一致性检查
- **WHEN** route 被审计
- **THEN** agent 确认它映射到正确页面原型并只使用允许的 application blocks
- **AND** route 与 Header shell 或命名 reading shell 对齐，并保持 Header、Footer、Layout、sidebars 和交互状态一致
- **AND** 不存在页面级 primitive 视觉覆写、raw CNode palette class、重复 Card spacing 或手写已有 shadcn 组件。

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

### Requirement: 视觉回归证据可重复生成

代表性页面原型 SHALL 提供可重复的 light/dark viewport 截图或等价视觉回归证据，并 MUST 将动态时间、随机内容和动画稳定化后再比较。

#### Scenario: 设计系统变更进入完成验收
- **WHEN** primitive、theme、application block、layout 或 Typeset 发生变更
- **THEN** 验收生成受影响页面原型的标准 viewport 视觉证据
- **AND** baseline 更新 MUST 由明确设计决策解释，不得以批量接受截图掩盖漂移。

#### Scenario: 行为测试与视觉测试分工
- **WHEN** UI 既包含交互状态又包含视觉 composition
- **THEN** Vitest/DOM 测试验证语义、状态与交互结果，浏览器验收验证布局、主题、响应式和像素级回归
- **AND** 任一层失败均不得将 change 标记为完成。
