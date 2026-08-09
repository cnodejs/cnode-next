## ADDED Requirements

### Requirement: 社区 Tab 集合与顺序

系统 SHALL 保留 `share`、`ask`、`job`、`dev`、`good`，新增 `tech`、`ai`、`ideas`、`career`、`life`、`event`，并将 `test` 从有效 Tab 集合移除。首页 SHALL 按 `all / share / ask / tech / ai / ideas / career / life / event / job / dev / good` 的逻辑顺序组合可见项。

#### Scenario: 普通用户看到公开顺序

- **WHEN** 普通用户访问首页且所有公开 Tab 均为 visible
- **THEN** 页面依次显示“全部 / 分享 / 问答 / 技术 / AI / 创意 / 职场 / 生活 / 活动 / 招聘 / 精华”
- **AND** 页面不显示 `dev` 或 `test`

#### Scenario: 管理员看到开发 Tab

- **WHEN** 管理员访问首页且 `dev` 为 visible
- **THEN** `dev` 显示在 `job` 之后和 `good` 之前
- **AND** `good` 保持最右侧

#### Scenario: 端点位置不受中间排序影响

- **WHEN** 管理员调整任一普通公开 Tab 的 sort order
- **THEN** `all` 仍固定最左
- **AND** 可见的 `good` 仍固定最右
- **AND** 可见的 `dev` 仍位于所有普通公开 Tab 之后、`good` 之前

### Requirement: 首页首张 Sidebar Card 随 Tab 切换

首页 SHALL 根据当前 Tab 互斥显示一张上下文首卡：`all` 和 `good` 显示“社区合作”，普通内容 Tab 显示对应板块说明，`dev` 显示“开发使用”。

#### Scenario: 全部和精华显示社区合作

- **WHEN** 当前 Tab 为 `all` 或 `good`
- **THEN** Sidebar 首张 Card 为“社区合作”
- **AND** 不显示其他 Tab 的说明 Card

#### Scenario: 普通 Tab 显示对应说明

- **WHEN** 当前 Tab 为 `share`、`ask`、`tech`、`ai`、`ideas`、`career`、`life`、`event` 或 `job`
- **THEN** Sidebar 首张 Card 显示当前 Tab 的名称、范围和必要边界
- **AND** 不显示“社区合作” Card

#### Scenario: 开发 Tab 显示开发使用说明

- **WHEN** 有权限的用户选择 `dev`
- **THEN** Sidebar 首张 Card 标题为“开发使用”
- **AND** 文案说明其用于 API、客户端和功能联调
- **AND** 不使用“内部通道”作为产品名称

### Requirement: 发帖页发布规范和 Tab 说明

发帖页 SHALL 始终先显示“发布规范” Card，再显示当前 Tab 说明 Card；选择 `job` 时 SHALL 在两者之后显示 `job_meta` 信息，其他 Tab 不显示 `_xxx_meta` 信息。

#### Scenario: 普通 Tab 的发帖右栏

- **WHEN** 用户在发布页选择非 `job` 的可发布 Tab
- **THEN** 右侧依次显示“发布规范”和当前 Tab 说明
- **AND** 不显示 `job_meta` 或 `event_meta` 表单

#### Scenario: 招聘发帖右栏

- **WHEN** 有招聘发布权限的用户选择 `job`
- **THEN** 右侧依次显示“发布规范”、招聘说明和 `job_meta` 信息
- **AND** `job_meta` 信息不得替换前两张 Card

#### Scenario: 发布规范表达硬性要求

- **WHEN** 发帖页渲染“发布规范” Card
- **THEN** Card 使用明确约束文案说明禁止的违规内容和商业披露要求
- **AND** 提供到权威社区规则的可访问链接

### Requirement: Tab 说明响应式且可访问

首页和发帖页 SHALL 复用同一份按 key 索引的 Tab 说明来源，并保证桌面、移动和辅助技术用户能够在采取主要操作前获得必要说明。

#### Scenario: 首页移动端说明位置

- **WHEN** 用户在 375px 宽度选择具体内容 Tab
- **THEN** 当前 Tab 的紧凑说明在 topic feed 之前可访问
- **AND** 完整 sidebar 模块仍可按 feed archetype 重排

#### Scenario: 发帖移动端提交前看到规范

- **WHEN** 用户在移动端填写发布表单
- **THEN** 发布规范和当前 Tab 的紧凑说明在发布按钮之前可访问
- **AND** 切换 Tab 后说明文本同步更新

#### Scenario: 键盘切换 Tab

- **WHEN** 键盘用户聚焦并切换首页 Tab 或发帖分类 Select
- **THEN** 焦点指示保持可见
- **AND** 当前值和关联说明可被辅助技术识别

### Requirement: 活动暂不使用结构化元数据

`event` SHALL 作为普通 Topic Tab 创建、编辑、查询和展示，本次 SHALL NOT 要求或返回 `event_meta`。

#### Scenario: 发布活动话题

- **WHEN** 登录且具备普通发帖资格的用户提交合法 `tab='event'`、title 和 content
- **THEN** 系统按普通 topic 流程创建活动话题
- **AND** 不要求 `event_meta`

#### Scenario: 活动说明提示正文信息

- **WHEN** 用户在首页或发帖页查看活动说明
- **THEN** 文案要求在正文中说明时间、地点或线上方式、组织方和报名信息
- **AND** 付费或商业活动必须披露相关关系
