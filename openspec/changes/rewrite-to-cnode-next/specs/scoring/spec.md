# Scoring Rules

## ADDED Requirements

### Requirement: 积分和计数器行为对齐

发帖、回复、删除等操作 MUST 正确修改对应的积分和计数器。egg-cnode 存在 bug:发帖时调用了 `incrementScoreAndReplyCount`(reply_count+1 而非 topic_count+1),新项目 MUST 修正。

#### Scenario: 发帖

- **WHEN** 用户创建一个新话题
- **THEN** 用户 score +5
- **AND** 用户 topic_count +1
- **AND** 必须调用 `incrementScoreAndTopicCount` 而非 `incrementScoreAndReplyCount`

#### Scenario: 回复

- **WHEN** 用户创建一个新回复
- **THEN** 用户 score +5
- **AND** 用户 reply_count +1

#### Scenario: 删除话题

- **WHEN** 用户或管理员删除一个话题
- **THEN** 作者 score -5
- **AND** 作者 topic_count -1

#### Scenario: 删除回复

- **WHEN** 用户或管理员删除一个回复
- **THEN** 作者 score -5
- **AND** 作者 reply_count -1

#### Scenario: 收藏/取消收藏

- **WHEN** 用户收藏一个话题
- **THEN** 用户 collect_topic_count +1
- **AND** score 不变
- **WHEN** 用户取消收藏
- **THEN** 用户 collect_topic_count -1
- **AND** score 不变

### Requirement: 两个独立的计数器函数

系统 MUST 提供两个独立的计数器函数,不能复用一个函数处理发帖和回复两种场景。

#### Scenario: 发帖路径调用的函数

- **WHEN** 创建话题
- **THEN** 调用的函数签名为 `incrementScoreAndTopicCount(userId, score, topicCount)`

#### Scenario: 回复路径调用的函数

- **WHEN** 创建回复
- **THEN** 调用的函数签名为 `incrementScoreAndReplyCount(userId, score, replyCount)`
