## ADDED Requirements

### Requirement: 用户页封禁和解禁

系统 MUST 允许 admin 在用户主页对目标用户执行 block/unblock 操作，操作效果必须与后台用户管理中的禁言/解禁一致。

#### Scenario: 用户页封禁用户
- **WHEN** admin 在用户主页点击封禁用户
- **THEN** 系统 MUST 将目标用户 `is_block` 设置为 true
- **AND** 目标用户 MUST 无法继续发帖、回复或点赞
- **AND** 系统 MUST 写入审计日志

#### Scenario: 用户页解禁用户
- **WHEN** admin 在已封禁用户主页点击解禁用户
- **THEN** 系统 MUST 将目标用户 `is_block` 设置为 false
- **AND** 目标用户恢复普通用户可执行的发帖、回复和点赞能力
- **AND** 系统 MUST 写入审计日志

#### Scenario: 非管理员不可在用户页封禁或解禁
- **WHEN** 非 admin 用户尝试调用用户页封禁或解禁接口
- **THEN** 系统 MUST 返回权限错误
- **AND** 目标用户 `is_block` 状态保持不变
