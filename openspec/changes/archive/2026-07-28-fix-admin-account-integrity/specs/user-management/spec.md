## ADDED Requirements

### Requirement: 管理员不得对自己执行限制或破坏性用户操作
系统 SHALL 阻止管理员对当前登录账号执行会限制自身能力或破坏自身内容的高风险用户管理动作。

#### Scenario: 管理员不能 block 自己
- **WHEN** admin 调用用户 block 接口且目标用户是当前登录 admin
- **THEN** 系统 MUST 返回错误响应
- **AND** 当前 admin 的 `is_block` 状态 MUST 保持不变
- **AND** 系统 MUST NOT 写入成功审计日志

#### Scenario: 管理员不能 mute 自己
- **WHEN** admin 调用用户 mute 接口且目标用户是当前登录 admin
- **THEN** 系统 MUST 返回错误响应
- **AND** 当前 admin 的 `is_muted` 状态 MUST 保持不变
- **AND** 系统 MUST NOT 写入成功审计日志

#### Scenario: 管理员不能删除自己所有发言
- **WHEN** admin 调用删除用户所有发言接口且目标用户是当前登录 admin
- **THEN** 系统 MUST 返回错误响应
- **AND** 当前 admin 的话题和回复删除状态 MUST 保持不变
- **AND** 系统 MUST NOT 扣减当前 admin 的内容计数

#### Scenario: 前端隐藏自操作入口
- **WHEN** admin 在后台用户管理页或用户主页查看自己的账号
- **THEN** 页面 MUST NOT 提供 block、mute 或删除所有发言的可执行入口
- **AND** 直接调用后端接口仍 MUST 被拒绝
