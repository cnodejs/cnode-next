## ADDED Requirements

### Requirement: 用户内容列表必须过滤不可公开内容

用户主页、用户话题、用户参与和用户收藏列表 SHALL 只展示公开可见内容，并保持分页 total 与过滤后的结果一致。block 用户内容不可公开；仅处于 mute 状态的用户内容不应因此被隐藏。

#### Scenario: 用户话题列表过滤内部和受限内容
- **WHEN** 用户访问 `/user/:name/topics?page=N`
- **THEN** 列表 MUST 排除 `tab=dev` 或 `tab=test` 的话题
- **AND** MUST 排除已删除话题
- **AND** MUST 排除作者已被 block 的话题
- **AND** MUST NOT 仅因作者被 mute 而排除话题
- **AND** total MUST 按相同过滤条件计算

#### Scenario: 用户参与列表过滤不可公开所属话题
- **WHEN** 用户访问 `/user/:name/replies?page=N`
- **THEN** 列表 MUST 排除已删除回复
- **AND** MUST 排除所属话题为 dev/test、已删除或作者已被 block 的回复聚合
- **AND** total MUST 按过滤后的去重话题计算

#### Scenario: 用户收藏列表过滤不可公开话题
- **WHEN** 用户访问 `/user/:name/collections?page=N`
- **THEN** 列表 MUST 排除 dev/test、已删除或作者已被 block 的话题
- **AND** total MUST 按过滤后的收藏话题计算

#### Scenario: 用户主页 recent 数据过滤不可公开内容
- **WHEN** 用户访问 `/user/:name`
- **THEN** `recent_topics` 和 `recent_replies` MUST 只包含公开可见话题
