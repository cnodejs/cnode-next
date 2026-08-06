## ADDED Requirements

### Requirement: Sidebar 数据必须使用公开可见性规则

首页 sidebar 的最新回复和无人回复模块 SHALL 使用与首页公开 feed 一致的可见性规则，不能显示内部 tab、已删除内容或被 block 用户创建的话题。仅处于 mute 状态的用户内容不应因此被隐藏。

#### Scenario: 最新回复排除内部话题

- **WHEN** 首页 sidebar 加载最新回复
- **THEN** 最新回复 MUST 不包含所属话题 `tab=dev` 或 `tab=test` 的回复
- **AND** 点击最新回复不得进入内部话题详情

#### Scenario: 最新回复排除受限话题

- **WHEN** 最新回复属于已删除话题或作者已被 block 的话题
- **THEN** 该回复 MUST 不出现在最新回复模块

#### Scenario: 无人回复排除内部和受限话题

- **WHEN** 首页 sidebar 加载无人回复话题
- **THEN** 无人回复列表 MUST 不包含 `dev/test` 话题
- **AND** MUST 不包含已删除话题
- **AND** MUST 不包含作者已被 block 的话题

#### Scenario: mute 用户内容不从 sidebar 自动隐藏

- **WHEN** 话题作者仅处于 mute 状态且未处于 block 状态
- **THEN** 最新回复和无人回复模块 MUST 按普通公开规则决定是否展示该话题
