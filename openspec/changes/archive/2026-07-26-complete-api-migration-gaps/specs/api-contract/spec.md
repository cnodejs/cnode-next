## ADDED Requirements

### Requirement: API 写入端点必须持久化成功响应声明的状态

legacy-compatible API 写入端点 SHALL 在返回成功响应前完成对应数据库状态变更，避免出现“返回成功但未落库”的迁移缺口。

#### Scenario: 获取话题详情返回真实交互状态

- **WHEN** 调用 `GET /api/v1/topic/:id?mdrender=true&accesstoken=xxx`
- **THEN** 返回 `{ success: true, data: FullTopicDTO }`
- **AND** `is_collect` 反映当前 accesstoken 用户是否收藏该话题
- **AND** 每个 reply 的 `ups` 包含已点赞用户 id 列表
- **AND** 每个 reply 的 `is_uped` 反映当前 accesstoken 用户是否点赞

#### Scenario: 更新话题持久化

- **WHEN** 作者或管理员调用 `POST /api/v1/topics/update` 并提交合法 title/tab/content
- **THEN** 后端更新该话题的 title/tab/content/update_at
- **AND** 返回 `{ success: true, topic_id }`
- **AND** 后续话题详情返回更新后的内容

#### Scenario: 回复点赞持久化

- **WHEN** 调用 `POST /api/v1/reply/:reply_id/ups` 且用户未点赞过
- **THEN** 后端在 `reply_ups` 中创建记录
- **AND** 返回 `{ success: true, action: 'up' }`
- **WHEN** 同一用户再次调用
- **THEN** 后端删除对应 `reply_ups` 记录
- **AND** 返回 `{ success: true, action: 'down' }`（取消点赞）

#### Scenario: 刷新 accessToken 持久化

- **WHEN** 已登录用户调用 `POST /api/v1/user/refresh_token`
- **THEN** 返回 `{ success: true, accessToken }`
- **AND** 新 token 可用于后续 `accesstoken` API 认证
- **AND** 旧 token 不再可用于 API 认证
