## ADDED Requirements

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
