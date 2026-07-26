# messaging Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
### Requirement: 消息类型

系统 MUST 支持以下消息类型:

- `reply`: 有人回复了你的话题
- `reply2`: 有人回复了你的回复 (二级回复)
- `at`: 有人 @提及了你

`follow` 类型 (nodeclub 定义但从未实现) 不在范围内。

#### Scenario: 回复话题触发 reply 消息

- **WHEN** 用户 A 回复了用户 B 的话题
- **AND** A 和 B 不是同一人
- **THEN** 创建 type='reply' 消息,master_id = 话题作者 (B)
- **AND** 消息关联 topic_id 和 reply_id

#### Scenario: 回复回复触发 reply2 消息

- **WHEN** 用户 A 在话题中回复了用户 B 的回复 (reply_id 指向 B 的回复)
- **AND** A 和 B 不是同一人
- **THEN** 创建 type='reply2' 消息,master_id = 被回复的回复作者 (B)
- **AND** 消息关联 topic_id 和 reply_id
- **NOTE** nodeclub 定义了 reply2 但从未发送,新项目必须补回

#### Scenario: @提及触发 at 消息

- **WHEN** 用户在话题或回复中 @提及某人
- **THEN** 创建 type='at' 消息,master_id = 被提及的用户
- **AND** 排除原作者 (不给自己发消息)

#### Scenario: 话题作者同时被回复和被 @

- **WHEN** 用户回复话题并在回复中 @了话题作者
- **THEN** 只发一条 reply 消息 (去重)
- **AND** 不额外发 at 消息给同一人

### Requirement: 邮件通知

系统 MUST 在用户开启邮件通知设置后,发送对应邮件。

#### Scenario: 开启回复邮件通知

- **WHEN** 话题作者 (B) 的 receive_reply_mail = true
- **AND** 用户 A 回复了 B 的话题
- **THEN** 除了创建 reply 消息,还要发邮件通知 B
- **AND** 邮件包含话题标题、回复内容摘要、话题链接
- **NOTE** nodeclub 定义了字段但从未检查,新项目必须补回

#### Scenario: 开启 @提及邮件通知

- **WHEN** 被提及用户的 receive_at_mail = true
- **AND** 有人 @提及该用户
- **THEN** 除了创建 at 消息,还要发邮件通知
- **AND** 邮件包含话题标题、提及内容、话题链接

#### Scenario: 邮件通知去重

- **WHEN** 同一人在同一回复中既是话题作者又被 @
- **THEN** 只发一封邮件,不重复

### Requirement: Web 消息页行为

系统 MUST 在用户访问消息页时自动将未读消息标记为已读。

#### Scenario: 访问消息页自动标记已读

- **WHEN** 用户访问 /my/messages
- **THEN** 先查询未读消息列表展示
- **AND** 展示后将这些消息标记为已读 (has_read = true)
- **AND** 页面分两个区域: "新消息" (之前未读) + "过往消息" (已读)

### Requirement: 前端未读消息提示

系统 MUST 在前端 Header 展示未读消息数。

#### Scenario: Header 铃铛未读数

- **WHEN** 用户登录且存在未读消息
- **THEN** Header 消息铃铛图标显示未读数 badge
- **AND** 未读数为 0 时不显示 badge

#### Scenario: 消息下拉预览

- **WHEN** 用户点击 Header 消息铃铛
- **THEN** 下拉展示最近 5 条未读消息预览
- **AND** 每条显示: 消息类型、作者、关联话题标题、时间
- **AND** 提供 "查看全部" 链接跳转 /my/messages
- **AND** 提供 "全部已读" 按钮

### Requirement: API 消息端点

系统 MUST 提供与 nodeclub 对齐的消息 API。

#### Scenario: 获取消息列表

- **WHEN** 调用 GET /api/v1/messages?accesstoken=xxx&mdrender=true
- **THEN** 返回 { success: true, data: { has_read_messages, hasnot_read_messages } }
- **AND** 每条消息的 reply 字段包含 id, content, ups, create_at
- **AND** mdrender=true 时 content 经过 linkUsers + markdown 渲染

#### Scenario: 获取未读消息数

- **WHEN** 调用 GET /api/v1/message/count?accesstoken=xxx
- **THEN** 返回 { success: true, data: count }

#### Scenario: 全部标记已读

- **WHEN** 调用 POST /api/v1/message/mark_all (带 accesstoken)
- **THEN** 将该用户所有未读消息标记为已读
- **AND** 返回 { success: true, marked_msgs: [{ id }] }

#### Scenario: 单条标记已读

- **WHEN** 调用 POST /api/v1/message/mark_one/:msg_id (带 accesstoken)
- **THEN** 将该消息标记为已读
- **AND** 返回 { success: true, marked_msg_id }

### Requirement: 消息关联数据完整性

系统 MUST 过滤关联数据失效的消息 (作者或话题被删除)。

#### Scenario: 过滤无效消息

- **WHEN** 消息关联的作者或话题已被删除
- **THEN** 该消息标记为 is_invalid
- **AND** 在列表展示时过滤掉 is_invalid 的消息

### Requirement: 消息已读状态必须兼容 PostgreSQL

消息 API SHALL 在 PostgreSQL-first runtime 中使用 boolean-compatible values 读写 `messages.has_read`。

#### Scenario: 获取未读消息数

- **WHEN** 调用 `GET /api/v1/message/count?accesstoken=xxx`
- **THEN** 返回 `{ success: true, data: count }`
- **AND** count 基于 `has_read = false` 的 PostgreSQL-compatible 查询计算

#### Scenario: 全部标记已读

- **WHEN** 调用 `POST /api/v1/message/mark_all`（带 accesstoken）
- **THEN** 将该用户所有未读消息标记为已读
- **AND** PostgreSQL-backed runtime 中 `has_read` 被设置为 true
- **AND** 返回 `{ success: true, marked_msgs: [{ id }] }`

#### Scenario: 单条标记已读

- **WHEN** 调用 `POST /api/v1/message/mark_one/:msg_id`（带 accesstoken）
- **THEN** 将该消息标记为已读
- **AND** PostgreSQL-backed runtime 中 `has_read` 被设置为 true
- **AND** 返回 `{ success: true, marked_msg_id }`

