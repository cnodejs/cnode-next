## MODIFIED Requirements

### Requirement: 管理员用户管理面板

系统 MUST 提供管理员用户管理功能，支持搜索、查看和操作用户。后台用户列表 MUST 按安全审计优先原则组织行操作，避免把不同风险等级的操作平铺为同级按钮。默认列表 SHALL 以识别用户、判断状态、查看角色和进入操作为主。

#### Scenario: 用户列表

- **WHEN** 管理员访问用户管理页面
- **THEN** 显示分页用户列表，默认列为用户、状态、角色和操作
- **AND** 用户列合并展示 loginname 和 email
- **AND** 支持按 loginname / email 搜索
- **AND** score、topic_count 和 reply_count 不作为默认独立列展示。

#### Scenario: 用户列表行操作分层

- **WHEN** 管理员查看 `/admin/users` 用户列表
- **THEN** 每个用户行 MUST NOT 直接展示超过 3 个同级操作控件
- **AND** 行操作 MUST 至少提供查看用户和打开管理菜单的入口
- **AND** block、mute、角色、重置密码和删除所有发言等管理动作 MUST 收纳到管理菜单、详情页或等价的二级操作容器中。

#### Scenario: 用户管理菜单按风险和语义分组

- **WHEN** 管理员打开某个用户的管理菜单
- **THEN** 菜单 MUST 按用户治理、角色权限、账号安全和危险操作组织动作
- **AND** block/unblock MUST 位于用户治理分组
- **AND** mute/unmute MUST 位于用户治理分组
- **AND** grant/revoke role MUST 位于角色权限分组
- **AND** reset password MUST 位于账号安全分组
- **AND** delete all user content MUST 位于危险操作分组并使用 destructive 视觉语义。

#### Scenario: block 文案表达为屏蔽用户内容

- **WHEN** 后台用户管理展示 block/unblock 操作或状态
- **THEN** block 操作 SHOULD 使用“屏蔽用户内容”或等价文案
- **AND** unblock 操作 SHOULD 使用“恢复用户内容”或等价文案
- **AND** block 状态 SHOULD 显示为“内容已屏蔽”或等价文案
- **AND** UI MUST 不把 block 和 mute 表达为同一含义。

#### Scenario: 禁言/解禁用户

- **WHEN** 管理员对某用户执行禁言操作
- **THEN** 设置 is_block = true
- **AND** 该用户不可发帖、回复、点赞
- **WHEN** 管理员执行解禁
- **THEN** 设置 is_block = false。

#### Scenario: 删除用户所有发言

- **WHEN** 管理员对某用户执行"删除所有发言"操作
- **THEN** 该用户的所有话题和回复标记为 deleted = true
- **AND** 用户的 topic_count 和 reply_count 相应扣减
- **AND** 操作入口 MUST 使用危险操作语义和二次确认。
