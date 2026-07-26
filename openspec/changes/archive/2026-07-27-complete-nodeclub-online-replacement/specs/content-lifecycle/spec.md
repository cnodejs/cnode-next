## ADDED Requirements

### Requirement: 回复删除必须对齐 nodeclub 线上行为

作者或管理员 SHALL 能删除回复，删除操作必须维护回复状态、作者积分、作者回复数和话题回复数。

#### Scenario: 作者删除自己的回复

- **WHEN** 回复作者删除一条未删除回复
- **THEN** 系统设置 `replies.deleted=true`
- **AND** 作者 score -5
- **AND** 作者 reply_count -1
- **AND** 话题 reply_count -1
- **AND** 计数器不得小于 0

#### Scenario: 管理员删除任意回复

- **WHEN** 管理员删除一条未删除回复
- **THEN** 系统设置 `replies.deleted=true`
- **AND** 回复作者 score -5
- **AND** 回复作者 reply_count -1
- **AND** 话题 reply_count -1

#### Scenario: 无权限删除回复

- **WHEN** 非作者且非管理员用户尝试删除回复
- **THEN** 系统返回权限错误
- **AND** 回复状态、积分和计数器保持不变

#### Scenario: 重复删除回复

- **WHEN** 用户或管理员再次删除已删除回复
- **THEN** 系统返回失败或幂等成功响应
- **AND** 不重复扣减 score、reply_count 或 topic reply_count
