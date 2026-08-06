## ADDED Requirements

### Requirement: 后台导航按运营任务组织

管理后台导航 SHALL 按管理员运营任务组织，而不是按实现页面随意堆叠。系统设置入口 MUST 位于后台导航最后。

#### Scenario: 后台导航分组顺序

- **WHEN** admin 或 moderator 访问管理后台
- **THEN** 导航分组 MUST 按总览、内容、用户、审计、系统的顺序展示可访问分组
- **AND** 系统设置 MUST 位于系统分组内
- **AND** 系统分组 MUST 是最后一个分组

#### Scenario: 内容结构管理归入内容分组

- **WHEN** admin 查看后台导航
- **THEN** 专区管理和 Tab 管理 MUST 归入内容相关分组
- **AND** 话题管理、巡检结果、举报队列、敏感词、专区管理和 Tab 管理 SHOULD 在同一内容运营分组中展示

#### Scenario: 审计拥有独立导航入口

- **WHEN** admin 查看后台导航
- **THEN** 审计日志 MUST 位于独立审计分组或顶部审计入口下
- **AND** 审计入口 MUST 不混在系统设置之前的无序系统杂项中

#### Scenario: 顶部和移动端导航顺序一致

- **WHEN** admin 在桌面或移动端访问后台
- **THEN** 顶部导航、侧栏导航和移动端导航 SHOULD 使用一致的任务顺序
- **AND** `/admin/zones`、`/admin/tabs`、`/admin/audit` 和 `/admin/settings` 的 active state MUST 匹配所属导航入口

### Requirement: 审计日志必须支持运营追踪

后台审计页面 SHALL 支持运营复盘、风险追踪和问责，而不是仅按时间罗列原始日志。

#### Scenario: 审计中心摘要

- **WHEN** admin 访问 `/admin/audit`
- **THEN** 页面 MUST 展示当前筛选范围内的摘要指标
- **AND** 摘要 SHOULD 至少包含高风险操作、内容删除、权限变更、账号安全和失败/异常数量
- **AND** 摘要 MUST 基于当前筛选全集计算，不得只统计当前页数据

#### Scenario: 审计事件分类和风险等级

- **WHEN** 系统返回审计日志
- **THEN** 每条日志 MUST 包含或可派生事件分类、风险等级和人类可读动作标签
- **AND** 内容治理、用户治理、角色权限、账号安全、安全策略、举报巡检和系统设置 SHOULD 作为第一阶段分类
- **AND** delete、reset password、role、ban 等敏感操作 MUST 具备高风险或极高风险视觉提示

#### Scenario: 审计筛选

- **WHEN** admin 在 `/admin/audit` 筛选审计事件
- **THEN** 系统 MUST 支持按时间范围、事件分类、风险等级、操作人、目标类型、结果和关键词筛选
- **AND** 筛选状态 MUST 体现在 URL 参数中
- **AND** 分页、刷新和返回页面时 MUST 保留筛选上下文

#### Scenario: 审计事件流展示

- **WHEN** admin 查看审计事件列表
- **THEN** 页面 MUST 使用事件流或等价卡片化列表展示审计记录
- **AND** 每条事件 MUST 展示风险 badge、人类可读动作标题、操作人、时间、分类、目标和结果
- **AND** 页面 MUST 不要求管理员直接理解原始 action 字符串才能判断事件含义

#### Scenario: 审计详情展开

- **WHEN** admin 展开某条审计事件
- **THEN** 页面 MUST 展示原始 action、operator_id、operator_name、target_type、target_id、target_name、result、create_at 和 detail
- **AND** detail 为 JSON 时 SHOULD 格式化展示
- **AND** detail 非 JSON 时 SHOULD 原样展示
- **AND** 系统 MUST 避免展示 secrets、token、明文密码或生产环境变量

#### Scenario: 审计目标跳转

- **WHEN** 审计事件目标可映射到现有后台或前台资源
- **THEN** 页面 SHOULD 提供目标跳转入口
- **AND** user 目标 SHOULD 可跳转到用户主页或后台用户搜索
- **AND** topic 目标 SHOULD 可跳转到话题页
- **AND** report 或 scan_job 目标 SHOULD 可跳转到对应后台队列或巡检页面

#### Scenario: 移动端审计展示

- **WHEN** admin 在移动端访问 `/admin/audit`
- **THEN** 页面 MUST 使用适合窄屏的卡片或事件流布局
- **AND** 页面 MUST NOT 依赖横向滚动表格作为主要审计体验
