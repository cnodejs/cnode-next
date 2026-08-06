## ADDED Requirements

### Requirement: 公共 API 必须过滤不可公开话题

`/api/v1/*` 中面向公开客户端的话题列表、用户聚合和收藏查询 SHALL 排除不可公开话题。不可公开话题包括 `deleted=true`、`status='deleted'`、`tab` 为 `dev` 或 `test`、以及作者处于 block 状态的话题。mute 状态只限制写入，不影响已有内容公开可见性。

#### Scenario: 获取公开话题列表排除内部和受限内容

- **WHEN** 调用 `GET /api/v1/topics?page=1&limit=20&tab=all`
- **THEN** 返回的话题 MUST 不包含 `tab=dev` 或 `tab=test` 的话题
- **AND** MUST 不包含已删除话题
- **AND** MUST 不包含作者已被 block 的话题

#### Scenario: 获取公开话题列表按指定 tab 查询

- **WHEN** 调用 `GET /api/v1/topics?tab=share` 或其他公开 tab
- **THEN** 返回的话题 MUST 仍然排除已删除话题和作者已被 block 的话题
- **AND** 当请求 `tab=dev` 或 `tab=test` 时，公共 API MUST 返回空列表或权限错误，而不是公开内部内容

#### Scenario: 收藏 API 排除不可公开话题

- **WHEN** 调用 `GET /api/v1/topic_collect/:loginname`
- **THEN** 返回的话题 MUST 不包含已删除、内部 tab 或作者已被 block 的话题

#### Scenario: 用户聚合 API 排除不可公开话题

- **WHEN** 调用 `GET /api/v1/user/:loginname`
- **THEN** `recent_topics` 和 `recent_replies` MUST 只包含公开可见话题
- **AND** 回复聚合 MUST 排除所属话题不可公开的回复记录

#### Scenario: mute 用户内容仍按普通公开规则展示

- **WHEN** 某用户仅处于 mute 状态且未处于 block 状态
- **THEN** 该用户已有话题 MUST 按 tab、deleted 和 status 等普通公开规则决定是否展示
- **AND** 公共 API MUST NOT 仅因 mute 状态隐藏其已有话题
