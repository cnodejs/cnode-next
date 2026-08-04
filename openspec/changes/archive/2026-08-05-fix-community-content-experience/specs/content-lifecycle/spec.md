## MODIFIED Requirements

### Requirement: 回复删除必须对齐 nodeclub 线上行为

作者或管理员 SHALL 能删除回复，删除操作必须在同一数据库事务中维护回复状态、作者积分、作者回复数、话题回复数、话题最后有效回复标识和最后有效回复时间。

#### Scenario: 作者删除自己的回复

- **WHEN** 回复作者删除一条未删除回复
- **THEN** 系统设置 `replies.deleted=true`
- **AND** 作者 score -5
- **AND** 作者 reply_count -1
- **AND** 话题 reply_count -1
- **AND** 计数器不得小于 0。

#### Scenario: 管理员删除任意回复

- **WHEN** 管理员删除一条未删除回复
- **THEN** 系统设置 `replies.deleted=true`
- **AND** 回复作者 score -5
- **AND** 回复作者 reply_count -1
- **AND** 话题 reply_count -1。

#### Scenario: 无权限删除回复

- **WHEN** 非作者且非管理员用户尝试删除回复
- **THEN** 系统返回权限错误
- **AND** 原回复状态、积分、计数器和最后回复元数据保持不变。

#### Scenario: 重复删除回复

- **WHEN** 用户或管理员再次删除已删除回复
- **THEN** 系统返回失败或幂等成功响应
- **AND** 不重复扣减 score、reply_count 或 topic reply_count
- **AND** 不重复改变话题最后回复元数据。

#### Scenario: 删除非最新回复

- **WHEN** 被删除回复不是话题当前最后一条有效回复
- **THEN** 话题 `last_reply_id` 和 `last_reply_at` 保持指向当前最后有效回复。

#### Scenario: 删除最新回复后回退

- **WHEN** 被删除回复是话题当前最后一条有效回复且仍存在其他未删除回复
- **THEN** `last_reply_id` 和 `last_reply_at` 回退到按稳定时间线排序的上一条有效回复
- **AND** 公共话题详情显示该有效回复的时间。

#### Scenario: 删除唯一回复

- **WHEN** 被删除回复是话题唯一未删除回复
- **THEN** 话题 `reply_count` 为 0
- **AND** `last_reply_id` 和 `last_reply_at` 被清空
- **AND** 公共话题详情不显示“最后回复”时间
- **AND** 话题列表活动排序使用话题创建时间作为无回复话题的回退值，而不是把 null 当作最高活动时间。

#### Scenario: 修复存量最后回复不一致数据

- **WHEN** 运维执行幂等数据修复并发现话题计数或最后回复元数据与未删除回复不一致
- **THEN** 系统从 PostgreSQL 中的未删除回复重新计算 `reply_count`、`last_reply_id` 和 `last_reply_at`
- **AND** 无有效回复的话题清空最后回复字段
- **AND** 修复过程不改变回复内容、作者积分或作者回复数。
