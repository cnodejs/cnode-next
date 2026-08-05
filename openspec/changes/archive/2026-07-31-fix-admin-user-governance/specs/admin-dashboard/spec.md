## ADDED Requirements

### Requirement: 封禁管理必须区分禁言和内容屏蔽

后台封禁管理页 SHALL 按 `mute` 和 `block` 的业务语义展示用户治理状态。`mute` MUST 表达为禁言或解除禁言，`block` MUST 表达为屏蔽用户内容或恢复内容可见，页面 MUST NOT 将 `is_block` 用户单独展示为禁言用户。

#### Scenario: 查看封禁管理用户治理状态

- **WHEN** admin 访问 `/admin/bans` 的用户治理区域
- **THEN** 页面 MUST 能识别处于 mute 状态的用户
- **AND** 页面 MUST 能识别处于 block 状态的用户
- **AND** 页面 MUST 使用不同文案展示禁言和内容屏蔽状态

#### Scenario: 单个恢复内容可见

- **WHEN** admin 在 `/admin/bans` 对 block 用户执行恢复内容可见
- **THEN** 系统 MUST 取消目标用户的 block 状态
- **AND** 页面 MUST 使用“恢复内容可见”或等价文案
- **AND** 页面 MUST NOT 将该操作表达为解除禁言

#### Scenario: 单个解除禁言

- **WHEN** admin 在 `/admin/bans` 对 mute 用户执行解除禁言
- **THEN** 系统 MUST 取消目标用户的 mute 状态
- **AND** 页面 MUST 使用“解除禁言”或等价文案
- **AND** 页面 MUST NOT 将该操作表达为恢复内容可见

### Requirement: 封禁管理批量操作保持上下文

后台封禁管理页 SHALL 在用户治理批量操作后保留当前 tab、分页和筛选上下文，并通过局部重新加载展示操作后的状态。

#### Scenario: 批量解除禁言后刷新当前上下文

- **WHEN** admin 在封禁管理页批量解除禁言并成功
- **THEN** 页面 MUST 重新加载当前 tab、分页和筛选上下文
- **AND** 已解除禁言的用户 MUST 不再显示为禁言状态

#### Scenario: 批量恢复内容可见后刷新当前上下文

- **WHEN** admin 在封禁管理页批量恢复内容可见并成功
- **THEN** 页面 MUST 重新加载当前 tab、分页和筛选上下文
- **AND** 已恢复内容可见的用户 MUST 不再显示为内容已屏蔽状态
