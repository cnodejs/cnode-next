# user-management Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
### Requirement: 管理员重置用户密码

系统 MUST 支持管理员快速重置任意用户的密码,无需知道原密码。

#### Scenario: 管理员重置密码

- **WHEN** 管理员发起重置某用户密码的操作
- **THEN** 系统生成新密码 (或随机 token)
- **AND** 用 bcryptjs (cost=10) hash 新密码
- **AND** 更新该用户的 pass 字段
- **AND** 将新密码返回给管理员 (明文, 仅此次显示) 或通过邮件发送给用户
- **AND** 清除该用户的 retrieve_key/retrieve_time (废弃未完成的重置流程)

#### Scenario: 非管理员不可重置他人密码

- **WHEN** 非管理员用户尝试调用重置密码接口
- **THEN** 返回 403

### Requirement: 管理员用户管理面板

系统 MUST 提供管理员用户管理功能,支持搜索、查看和操作用户。

#### Scenario: 用户列表

- **WHEN** 管理员访问用户管理页面
- **THEN** 显示用户列表 (分页),包含 loginname、email、score、topic_count、reply_count、create_at、is_block、active 状态
- **AND** 支持按 loginname / email 搜索

#### Scenario: 禁言/解禁用户

- **WHEN** 管理员对某用户执行禁言操作
- **THEN** 设置 is_block = true
- **AND** 该用户不可发帖、回复、点赞
- **WHEN** 管理员执行解禁
- **THEN** 设置 is_block = false

#### Scenario: 删除用户所有发言

- **WHEN** 管理员对某用户执行"删除所有发言"操作
- **THEN** 该用户的所有话题和回复标记为 deleted = true
- **AND** 用户的 topic_count 和 reply_count 相应扣减

### Requirement: 管理员权限判定

系统 MUST 在所有管理操作前验证管理员身份。

#### Scenario: 管理员身份判定

- **WHEN** 判定某用户是否为管理员
- **THEN** 检查 config.admins 中是否包含该用户的 loginname
- **AND** 或检查 user.is_admin 标记
- **AND** 管理员权限不持久化到客户端,每次请求后端验证

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

