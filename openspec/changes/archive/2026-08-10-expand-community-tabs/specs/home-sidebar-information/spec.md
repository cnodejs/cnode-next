## ADDED Requirements

### Requirement: Sidebar 上下文首卡随 Tab 变化

首页 Sidebar SHALL 在现有动态、榜单和资源模块之前显示一张互斥上下文首卡。`all` 和 `good` 显示“社区合作”；普通内容 Tab 显示对应说明；`dev` 显示“开发使用”。

#### Scenario: 社区合作只用于 all 和 good

- **WHEN** 当前 Tab 为 `all` 或 `good`
- **THEN** 首卡显示现有“社区合作”内容
- **AND** 不显示普通 Tab 说明或“开发使用” Card

#### Scenario: 内容 Tab 显示说明

- **WHEN** 当前 Tab 为 `share`、`ask`、`tech`、`ai`、`ideas`、`career`、`life`、`event` 或 `job`
- **THEN** 首卡显示当前 Tab 的必要说明和边界
- **AND** 不显示“社区合作” Card

#### Scenario: dev 显示开发使用

- **WHEN** 管理员选择 `dev`
- **THEN** 首卡显示“开发使用”及 API、客户端和功能联调用途
- **AND** 不显示“社区合作” Card

## MODIFIED Requirements

### Requirement: Sidebar 数据必须使用公开可见性规则

首页 sidebar 的最新回复和无人回复模块 SHALL 使用与首页公开 feed 一致的可见性规则，不能显示 `dev`、已删除内容或被 block 用户创建的话题。仅处于 mute 状态的用户内容不应因此被隐藏；已退役 `test` 不再作为可查询 Tab。

#### Scenario: 最新回复排除开发话题

- **WHEN** 首页 sidebar 加载最新回复
- **THEN** 最新回复 MUST 不包含所属话题 `tab=dev` 的回复
- **AND** 点击最新回复不得进入开发使用话题详情

#### Scenario: 最新回复排除受限话题

- **WHEN** 最新回复属于已删除话题或作者已被 block 的话题
- **THEN** 该回复 MUST 不出现在最新回复模块

#### Scenario: 无人回复排除开发和受限话题

- **WHEN** 首页 sidebar 加载无人回复话题
- **THEN** 无人回复列表 MUST 不包含 `dev` 话题
- **AND** MUST 不包含已删除话题
- **AND** MUST 不包含作者已被 block 的话题

#### Scenario: mute 用户内容不从 sidebar 自动隐藏

- **WHEN** 话题作者仅处于 mute 状态且未处于 block 状态
- **THEN** 最新回复和无人回复模块 MUST 按普通公开规则决定是否展示该话题
