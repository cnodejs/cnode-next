## ADDED Requirements

### Requirement: API boolean 状态必须兼容 PostgreSQL

读写 boolean 数据库列的核心 API 路由 SHALL 使用与验收迁移 runtime 中 PostgreSQL schema 兼容的谓词和值。

#### Scenario: 消息已读状态使用 PostgreSQL boolean

- **WHEN** API 在 PostgreSQL-backed runtime 中统计、列出或标记消息已读
- **THEN** 它 MUST 使用 boolean-compatible values 比较和赋值 `messages.has_read`
- **AND** 它 MUST NOT 发出 `boolean = integer` 谓词

#### Scenario: 话题和回复可见性使用 PostgreSQL boolean

- **WHEN** API 在 PostgreSQL-backed runtime 中过滤可见话题或回复
- **THEN** 它 MUST 使用 boolean-compatible values 比较 `deleted`、`top`、`good`、`lock` 等 boolean 列
- **AND** 话题详情加载回复时 MUST NOT 因为 `replies.deleted` 是 boolean 而失败

#### Scenario: 管理员状态变更使用 PostgreSQL boolean

- **WHEN** 管理员在 PostgreSQL-backed runtime 中切换话题或用户状态
- **THEN** API MUST 为 `top`、`good`、`lock`、`deleted`、`is_block` 写入 boolean-compatible values
