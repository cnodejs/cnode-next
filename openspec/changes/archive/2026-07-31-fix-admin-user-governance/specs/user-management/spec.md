## ADDED Requirements

### Requirement: 后台用户搜索结果必须随查询生效

系统 SHALL 允许管理员在后台用户管理页按 loginname 或 email 搜索用户，搜索提交、翻页和管理操作后的重新校验结果 MUST 与当前 URL 查询参数一致。

#### Scenario: 管理员搜索用户

- **WHEN** 管理员在 `/admin/users` 输入搜索词并提交
- **THEN** 页面 MUST 展示匹配当前搜索词的用户列表
- **AND** 列表总数 MUST 反映匹配后的 total
- **AND** 搜索框 MUST 保留当前搜索词

#### Scenario: 搜索结果翻页

- **WHEN** 管理员在带有搜索词的用户列表中翻页
- **THEN** 页面 MUST 保留当前搜索词
- **AND** 下一页数据 MUST 仍按当前搜索词过滤

#### Scenario: 用户管理操作后保留搜索上下文

- **WHEN** 管理员在搜索结果中执行 block、unblock、mute、unmute、角色变更、重置密码或删除所有发言并成功
- **THEN** 页面 MUST 重新加载当前查询上下文的数据
- **AND** MUST NOT 回退到未搜索的用户列表

### Requirement: 后台批量解除禁言

系统 SHALL 允许 admin 在后台用户治理入口中对多个处于 mute 状态的用户执行批量解除禁言。批量解除禁言 MUST 只取消目标用户的 `is_muted` 状态，不得因此取消 `is_block` 或恢复被删除内容。

#### Scenario: 批量解除多个禁言用户

- **WHEN** admin 选择多个处于 mute 状态的用户并确认批量解除禁言
- **THEN** 系统 MUST 将这些用户的 `is_muted` 设置为 false
- **AND** 每个不再受其他限制的用户 MUST 恢复新增话题和回复能力
- **AND** 系统 MUST 写入审计日志，记录操作者、目标用户和处理数量

#### Scenario: 批量解除禁言不恢复内容可见

- **WHEN** admin 对同时处于 mute 和 block 状态的用户执行批量解除禁言
- **THEN** 系统 MUST 取消目标用户的 `is_muted`
- **AND** 系统 MUST 保留目标用户的 `is_block`
- **AND** 目标用户历史内容仍按 block 规则在公共入口不可见

#### Scenario: 批量解除禁言禁止自操作

- **WHEN** admin 提交的批量解除禁言目标包含当前登录账号
- **THEN** 系统 MUST 跳过或拒绝对当前登录账号执行限制状态变更
- **AND** 当前登录账号的 `is_muted` 状态 MUST 保持不变
- **AND** 响应 MUST 让管理员知道存在被跳过或失败的目标

### Requirement: 后台批量恢复内容可见

系统 SHALL 允许 admin 在后台用户治理入口中对多个处于 block 状态的用户执行批量恢复内容可见。批量恢复内容可见 MUST 只取消目标用户的 `is_block` 状态，不得因此取消 `is_muted` 或恢复被删除内容。

#### Scenario: 批量恢复多个用户内容可见

- **WHEN** admin 选择多个处于 block 状态的用户并确认批量恢复内容可见
- **THEN** 系统 MUST 将这些用户的 `is_block` 设置为 false
- **AND** 目标用户未删除且符合公开规则的历史内容 MUST 恢复在公共入口可见
- **AND** 系统 MUST 写入审计日志，记录操作者、目标用户和处理数量

#### Scenario: 批量恢复内容可见不解除禁言

- **WHEN** admin 对同时处于 block 和 mute 状态的用户执行批量恢复内容可见
- **THEN** 系统 MUST 取消目标用户的 `is_block`
- **AND** 系统 MUST 保留目标用户的 `is_muted`
- **AND** 目标用户仍不可新增话题或回复，直到被单独或批量解除禁言

#### Scenario: 批量恢复内容可见禁止自操作

- **WHEN** admin 提交的批量恢复内容可见目标包含当前登录账号
- **THEN** 系统 MUST 跳过或拒绝对当前登录账号执行限制状态变更
- **AND** 当前登录账号的 `is_block` 状态 MUST 保持不变
- **AND** 响应 MUST 让管理员知道存在被跳过或失败的目标
