# @Mention Behavior

## ADDED Requirements

### Requirement: @提及解析

@提及解析和消息发送 MUST 与 nodeclub `common/at.js` 的行为对齐。系统 MUST 从文本中提取 @username,将它们链接化,并向被提及的用户发送通知消息。

#### Scenario: 从文本提取用户名

- **WHEN** 调用 fetchUsers(text)
- **THEN** 返回文本中所有 @username 的用户名数组 (去重)
- **AND** 忽略 `code block` 内的内容
- **AND** 忽略 `` `inline code` `` 内的内容
- **AND** 忽略 4 空格开头的 pre 标签内容
- **AND** 忽略 somebody@email.com (邮箱误判)
- **AND** 忽略已链接的 `[@user](/user/user)`
- **AND** 忽略 URL 中的 /@user

#### Scenario: 链接化 @username

- **WHEN** 调用 linkUsers(text)
- **THEN** 将 @username 替换为 `[@username](/user/username)`
- **AND** 不重复替换已链接化的 @username (正则使用 `@\b\w+\b(?!\])`)

#### Scenario: API 返回内容必须经过 linkUsers

- **WHEN** API 返回话题或回复的 content
- **AND** mdrender=true (默认)
- **THEN** content 必须先经过 linkUsers 再 markdown 渲染
- **NOTE** egg-cnode API 跳过了 linkUsers,新项目必须补回

#### Scenario: 发送 @提及消息

- **WHEN** 创建话题或回复时
- **THEN** 调用 sendMessageToMentionUsers(text, topicId, authorId, replyId)
- **AND** fetchUsers 提取用户名
- **AND** 去重
- **AND** 查用户是否存在
- **AND** 对每个被提及的用户发 type='at' 消息
- **AND** 排除原作者 (防止 @帖主 时重复)
- **AND** 如果用户设置了 receive_at_mail,发邮件通知
