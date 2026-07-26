## ADDED Requirements

### Requirement: 评论支持点赞状态和切换

评论 SHALL 在 API 提供数据时展示回复点赞数量和当前用户点赞状态。登录用户 SHALL 能在话题详情页切换点赞/取消点赞。

#### Scenario: 回复展示点赞状态

- **WHEN** 某条回复存在一个或多个 `ups`
- **THEN** 回复项展示点赞数量
- **AND** 如果 `is_uped` 为 true，点赞控件以选中状态或等价方式表达当前状态

#### Scenario: 登录用户点赞回复

- **WHEN** 登录用户点击一条尚未点赞的回复
- **THEN** Web app 调用 `POST /api/v1/reply/:reply_id/ups`
- **AND** 成功收到 `action: "up"` 后刷新或更新可见状态

#### Scenario: 登录用户取消点赞回复

- **WHEN** 登录用户点击一条已经点赞的回复
- **THEN** Web app 调用 `POST /api/v1/reply/:reply_id/ups`
- **AND** 成功收到 `action: "down"` 后刷新或更新可见状态

#### Scenario: 匿名用户尝试点赞回复

- **WHEN** 匿名用户尝试点赞回复
- **THEN** UI 提示登录或展示带说明的禁用态
- **AND** 不展示静默失败的死控件
