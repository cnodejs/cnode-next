## ADDED Requirements

### Requirement: 公共查询必须遵循内容可见性

公共查询 SHALL 使用统一内容可见性规则：隐藏已删除话题、内部 tab 话题、被 block 用户创建的话题，以及所属话题不可见的回复聚合。mute 用户只受写入限制，不因 mute 自动隐藏历史内容。

#### Scenario: 已删除话题不可公开

- **WHEN** 话题 `deleted=true` 或 `status='deleted'`
- **THEN** 该话题 MUST 不出现在任何公共列表、sidebar、用户聚合或收藏结果中
- **AND** 普通用户访问详情 MUST 得到不存在或不可见响应

#### Scenario: 内部 tab 话题不可公开

- **WHEN** 话题 `tab=dev` 或 `tab=test`
- **THEN** 该话题 MUST 不出现在首页 feed、最新回复、无人回复、用户话题、用户参与或用户收藏中

#### Scenario: 被 block 用户创建的话题不可公开

- **WHEN** 话题作者处于 block 状态
- **THEN** 该话题 MUST 不出现在公共列表、sidebar、用户聚合或收藏结果中
- **AND** 其他用户在该话题下的回复也 MUST 不通过最新回复或用户参与聚合曝光该话题

#### Scenario: 被 mute 用户不能新增内容但历史内容不自动隐藏

- **WHEN** 用户处于 mute 状态且未处于 block 状态
- **THEN** 该用户 MUST 不能新增话题或回复
- **AND** 该用户已有话题 MUST 不因 mute 状态被公共查询隐藏

#### Scenario: 管理后台不受公共过滤影响

- **WHEN** 管理员访问后台话题、用户、巡检或审计页面
- **THEN** 系统 MAY 展示 dev/test、已删除或 block 用户内容用于运营处理
- **AND** 这些后台入口 MUST 继续由后端权限校验保护
