## ADDED Requirements

### Requirement: Topic 写入支持扩展 Tab 集合

Topic 创建和编辑合约 SHALL 保留 `share`、`ask`、`job`，并接受 `tech`、`ai`、`ideas`、`career`、`life`、`event`。`all`、`good` 和已退役的 `test` SHALL NOT 作为可写 topic tab；`dev` 保持现有受限语义，不因本变更扩大写入权限。

#### Scenario: 创建新增公开 Tab 话题

- **WHEN** 合格用户提交合法 title、content 和 `tab='tech'`、`ai`、`ideas`、`career`、`life` 或 `event`
- **THEN** API 创建对应 tab 的 topic
- **AND** 返回成功 topic id

#### Scenario: 拒绝合成或退役 key

- **WHEN** 客户端创建或编辑 topic 时提交 `tab='all'`、`good` 或 `test`
- **THEN** API MUST 返回验证错误
- **AND** 不得写入 topic

#### Scenario: 招聘约束保持不变

- **WHEN** 客户端提交 `tab='job'`
- **THEN** API 继续要求招聘权限和合法 `job_meta`

## MODIFIED Requirements

### Requirement: 公共 API 必须过滤不可公开话题

`/api/v1/*` 中面向公开客户端的话题列表、用户聚合和收藏查询 SHALL 排除不可公开话题。不可公开话题包括 `deleted=true`、`status='deleted'`、`tab='dev'`，以及作者处于 block 状态的话题。mute 状态只限制写入，不影响已有内容公开可见性。`test` SHALL 作为无数据的退役 key 被列表参数拒绝或返回空结果，而不是继续作为有效 Tab。

#### Scenario: all 返回全部公开 Tab

- **WHEN** 调用 `GET /api/v1/topics?page=1&limit=20&tab=all`
- **THEN** 返回结果可以包含 `share/ask/tech/ai/ideas/career/life/event/job/good` 对应的公开 topic
- **AND** MUST 不包含 `tab=dev`、已删除 topic 或 block 作者 topic

#### Scenario: 指定公开 Tab 查询

- **WHEN** 调用 `GET /api/v1/topics?tab=share` 或其他有效公开 tab
- **THEN** 返回话题匹配指定 tab 或 `good` 的精选语义
- **AND** 仍排除已删除 topic 和 block 作者 topic

#### Scenario: 请求开发或退役 Tab

- **WHEN** 普通客户端请求 `tab=dev` 或 `tab=test`
- **THEN** API MUST 返回空列表、权限错误或合法参数错误
- **AND** 不得公开开发内容或把 `test` 当作有效 Tab

#### Scenario: 收藏 API 排除不可公开话题

- **WHEN** 调用 `GET /api/v1/topic_collect/:loginname`
- **THEN** 返回的话题 MUST 不包含已删除、`dev` 或 block 作者话题

#### Scenario: 用户聚合 API 排除不可公开话题

- **WHEN** 调用 `GET /api/v1/user/:loginname`
- **THEN** `recent_topics` 和 `recent_replies` MUST 只包含公开可见话题
- **AND** 回复聚合 MUST 排除所属话题不可公开的回复记录

#### Scenario: mute 用户内容仍按普通公开规则展示

- **WHEN** 某用户仅处于 mute 状态且未处于 block 状态
- **THEN** 该用户已有话题 MUST 按 tab、deleted 和 status 等普通公开规则决定是否展示
- **AND** 公共 API MUST NOT 仅因 mute 状态隐藏其已有话题
