## MODIFIED Requirements

### Requirement: 邮件通知

系统 MUST 在用户开启邮件通知设置后发送对应邮件，并与站内消息去重策略保持一致。

#### Scenario: 开启回复邮件通知

- **WHEN** 用户 A 回复了用户 B 的话题
- **AND** A 和 B 不是同一人
- **AND** B 的 receive_reply_mail = true
- **THEN** 除了创建 reply 站内消息，还要发邮件通知 B
- **AND** 邮件包含话题标题、回复内容摘要、话题链接

#### Scenario: 开启 @提及邮件通知

- **WHEN** 用户 A 在话题或回复中 @提及用户 B
- **AND** A 和 B 不是同一人
- **AND** B 的 receive_at_mail = true
- **THEN** 除了创建 at 站内消息，还要发邮件通知 B
- **AND** 邮件包含话题标题、提及内容、话题链接

#### Scenario: 邮件通知去重

- **WHEN** 同一人在同一回复中既是话题作者又被 @
- **THEN** 只发一条站内消息
- **AND** 只发一封邮件

### Requirement: Web 消息页行为

系统 MUST 在用户访问消息页时展示访问前未读消息，并在展示后自动将这些消息标记为已读。

#### Scenario: 访问消息页自动标记已读

- **WHEN** 用户访问 `/my/messages`
- **THEN** 系统先查询未读消息列表用于展示“新消息”分组
- **AND** 查询已读消息列表用于展示“过往消息”分组
- **AND** 响应完成后或 loader/action 阶段将本次查询到的未读消息标记为已读
- **AND** Header 未读数在后续刷新中变为真实未读数

### Requirement: 前端未读消息提示

系统 MUST 在前端 Header 展示真实未读消息数，并在消息状态变化后刷新。

#### Scenario: Header 铃铛未读数

- **WHEN** 用户登录且存在未读消息
- **THEN** Header 消息铃铛图标显示未读数 badge
- **AND** 未读数来自 `/api/v1/message/count` 或等价 SSR 数据

#### Scenario: 消息状态变化后刷新 badge

- **WHEN** 用户访问 `/my/messages`、点击“全部已读”或标记单条已读
- **THEN** Header 未读 badge 更新为真实未读数

#### Scenario: 消息下拉预览

- **WHEN** 用户点击 Header 消息铃铛
- **THEN** 下拉展示最近 5 条未读消息预览
- **AND** 每条显示消息类型、作者、关联话题标题、时间
- **AND** 提供“查看全部”链接跳转 `/my/messages`
- **AND** 提供“全部已读”按钮
