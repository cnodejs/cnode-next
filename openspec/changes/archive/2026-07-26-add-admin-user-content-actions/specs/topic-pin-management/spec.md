## ADDED Requirements

### Requirement: 帖子详情页置顶和高亮管理

系统 MUST 允许 admin 和 mod 在帖子详情页对当前话题执行置顶/取消置顶和高亮/取消高亮，并保证公开展示状态与后台管理一致。

#### Scenario: 帖子详情页置顶切换

- **WHEN** admin 或 mod 在帖子详情页对未置顶话题执行置顶操作
- **THEN** 系统 MUST 将目标话题 `top` 设置为 true
- **AND** 公开话题列表 MUST 优先展示该话题并显示置顶状态
- **AND** 系统 MUST 写入审计日志

#### Scenario: 帖子详情页取消置顶

- **WHEN** admin 或 mod 在帖子详情页对已置顶话题执行取消置顶操作
- **THEN** 系统 MUST 将目标话题 `top` 设置为 false
- **AND** 公开话题列表 MUST 不再显示该话题为置顶状态
- **AND** 系统 MUST 写入审计日志

#### Scenario: 帖子详情页高亮切换

- **WHEN** admin 或 mod 在帖子详情页对普通话题执行高亮操作
- **THEN** 系统 MUST 将目标话题 `good` 设置为 true
- **AND** 话题详情和列表 MUST 展示高亮或精华状态
- **AND** 系统 MUST 写入审计日志

#### Scenario: 帖子详情页取消高亮

- **WHEN** admin 或 mod 在帖子详情页对已高亮话题执行取消高亮操作
- **THEN** 系统 MUST 将目标话题 `good` 设置为 false
- **AND** 话题详情和列表 MUST 不再展示高亮或精华状态
- **AND** 系统 MUST 写入审计日志
