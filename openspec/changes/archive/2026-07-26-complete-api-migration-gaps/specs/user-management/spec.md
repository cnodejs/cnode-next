## ADDED Requirements

### Requirement: 管理员状态写入必须兼容 PostgreSQL

管理员用户和话题状态操作 SHALL 在 PostgreSQL-first runtime 中使用 boolean-compatible values 读写状态列。

#### Scenario: 禁言/解禁用户

- **WHEN** 管理员对某用户执行禁言操作
- **THEN** 设置 is_block = true
- **AND** 该用户不可发帖、回复、点赞
- **WHEN** 管理员执行解禁
- **THEN** 设置 is_block = false

#### Scenario: 删除用户所有发言

- **WHEN** 管理员对某用户执行“删除所有发言”操作
- **THEN** 该用户的所有话题和回复标记为 deleted = true
- **AND** PostgreSQL-backed runtime 中不得使用 integer 值写入 boolean columns

#### Scenario: 管理员切换话题状态

- **WHEN** 管理员执行 top/good/lock/delete 操作
- **THEN** 对应 topic 状态被持久化为 true 或 false
- **AND** 后续列表和详情请求返回更新后的状态
