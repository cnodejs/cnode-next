## MODIFIED Requirements

### Requirement: 管理员用户管理面板

系统 MUST 提供管理员用户管理功能，支持搜索、查看和操作用户。后台用户列表 MUST 按安全审计优先原则组织行操作，避免把不同风险等级的操作平铺为同级按钮。

#### Scenario: 用户列表

- **WHEN** 管理员访问用户管理页面
- **THEN** 显示用户列表（分页），包含 loginname、email、score、topic_count、reply_count、create_at、block/mute 状态和角色状态
- **AND** 支持按 loginname / email 搜索

#### Scenario: 用户列表行操作分层

- **WHEN** 管理员查看 `/admin/users` 用户列表
- **THEN** 每个用户行 MUST NOT 直接展示超过 3 个同级操作控件
- **AND** 行操作 MUST 至少提供查看用户和打开管理菜单的入口
- **AND** block、mute、角色、重置密码和删除所有发言等管理动作 MUST 收纳到管理菜单、详情页或等价的二级操作容器中

#### Scenario: 用户管理菜单按风险和语义分组

- **WHEN** 管理员打开某个用户的管理菜单
- **THEN** 菜单 MUST 按用户治理、角色权限、账号安全和危险操作组织动作
- **AND** block/unblock MUST 位于用户治理分组
- **AND** mute/unmute MUST 位于用户治理分组
- **AND** grant/revoke role MUST 位于角色权限分组
- **AND** reset password MUST 位于账号安全分组
- **AND** delete all user content MUST 位于危险操作分组并使用 destructive 视觉语义

#### Scenario: block 文案表达为屏蔽用户内容

- **WHEN** 后台用户管理展示 block/unblock 操作或状态
- **THEN** block 操作 SHOULD 使用“屏蔽用户内容”或等价文案
- **AND** unblock 操作 SHOULD 使用“恢复用户内容”或等价文案
- **AND** block 状态 SHOULD 显示为“内容已屏蔽”或等价文案
- **AND** UI MUST 不把 block 和 mute 表达为同一含义

#### Scenario: 禁言/解禁用户

- **WHEN** 管理员对某用户执行禁言操作
- **THEN** 系统设置 mute 状态使该用户无法继续新增话题或回复
- **AND** 已有内容 MUST 不因 mute 状态自动隐藏
- **WHEN** 管理员执行解除禁言
- **THEN** 取消该用户 mute 状态，除非仍受其他限制

#### Scenario: 删除用户所有发言

- **WHEN** 管理员对某用户执行“删除所有发言”操作
- **THEN** 该用户的所有话题和回复标记为 deleted = true
- **AND** 用户的 topic_count 和 reply_count 相应扣减
- **AND** 操作入口 MUST 使用危险操作语义和二次确认

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
- **AND** 后台用户管理菜单 MUST NOT 提供影响当前 admin 自身角色或自身能力的可执行入口
- **AND** 直接调用后端接口仍 MUST 被拒绝
