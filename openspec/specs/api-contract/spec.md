# api-contract Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
### Requirement: API 响应格式对齐

API 端点 `/api/v1/*` 的响应格式 MUST 与 nodeclub `api_router_v1.js` 对齐,以保证第三方客户端兼容。每个端点的响应结构、字段名和嵌套关系 MUST 与 nodeclub 完全一致。

#### Scenario: 获取话题列表

- **WHEN** 调用 `GET /api/v1/topics?page=1&limit=20&tab=share&mdrender=true`
- **THEN** 返回 `{ success: true, data: TopicDTO[] }`
- **AND** 每个 TopicDTO 包含 `id, author_id, tab, content, title, last_reply_at, good, top, reply_count, visit_count, create_at, author { loginname, avatar_url }`
- **AND** content 经过 markdown 渲染和 linkUsers 处理

#### Scenario: 获取话题详情

- **WHEN** 调用 `GET /api/v1/topic/:id?mdrender=true&accesstoken=xxx`
- **THEN** 返回 `{ success: true, data: FullTopicDTO }`
- **AND** data 包含 `replies[]`, `author`, `is_collect`, `is_uped`
- **AND** 每个 reply 的 `is_uped` 反映当前 accesstoken 用户是否点赞

#### Scenario: 获取用户信息必须返回 recent_replies

- **WHEN** 调用 `GET /api/v1/user/:loginname`
- **THEN** 返回 `{ success: true, data: UserDTO }`
- **AND** data 包含 `recent_topics[]` (最近 15 篇) 和 `recent_replies[]` (最近 5 条回复对应的话题)
- **NOTE** egg-cnode 遗漏了 recent_replies,新项目必须补回

#### Scenario: 消息数量返回格式

- **WHEN** 调用 `GET /api/v1/message/count?accesstoken=xxx`
- **THEN** 返回 `{ success: true, data: count }`
- **NOTE** egg-cnode 返回 `{ count }`,新项目必须修正为 `{ success, data }` 格式

#### Scenario: 消息列表的 reply 字段必须完整

- **WHEN** 调用 `GET /api/v1/messages?accesstoken=xxx&mdrender=true`
- **THEN** 返回 `{ success: true, data: { has_read_messages, hasnot_read_messages } }`
- **AND** 每个 message 的 reply 字段包含 `id, content, ups, create_at`
- **NOTE** egg-cnode 只返回 `{ content }`,新项目必须补齐 id/ups/create_at

#### Scenario: 回复点赞

- **WHEN** 调用 `POST /api/v1/reply/:reply_id/ups` 且用户未点赞过
- **THEN** 返回 `{ success: true, action: 'up' }`
- **WHEN** 同一用户再次调用
- **THEN** 返回 `{ success: true, action: 'down' }` (取消点赞)
- **WHEN** 用户试图给自己的回复点赞且非 debug 模式
- **THEN** 返回 `{ success: false, error_msg: '不能帮自己点赞' }`

#### Scenario: accessToken 验证

- **WHEN** 调用 `POST /api/v1/accesstoken` body 含有效 accesstoken
- **THEN** 返回 `{ success: true, loginname, avatar_url, id }`

#### Scenario: 话题内容必须经过 linkUsers 处理

- **WHEN** API 返回话题或回复的 content
- **AND** mdrender=true (默认)
- **THEN** content 必须先经过 at.linkUsers(@username → [@username](/user/username)) 再 markdown 渲染
- **NOTE** egg-cnode API 跳过了 linkUsers,新项目必须补回

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

### Requirement: mdrender 必须真实渲染 Markdown

API 端点返回 topic、reply、message 中的 content 时，SHALL 按 nodeclub API 语义处理 `mdrender` 参数。

#### Scenario: mdrender=true

- **WHEN** 客户端请求 content 字段且 `mdrender=true` 或未传 `mdrender`
- **THEN** 系统先执行 `linkUsers` 处理 @username
- **AND** 再执行 Markdown 到 HTML 的渲染
- **AND** 返回渲染后的 HTML 字符串

#### Scenario: mdrender=false

- **WHEN** 客户端请求 content 字段且 `mdrender=false`
- **THEN** 系统返回数据库中的原始 Markdown 文本
- **AND** 不执行 Markdown HTML 渲染

### Requirement: topic list 必须支持真实分页总数

话题列表 API 或 Web loader SHALL 能得到与查询条件一致的总数，用于线上首页分页。

#### Scenario: 首页分页总数

- **WHEN** 用户访问首页或 tab 列表的第 N 页
- **THEN** 系统使用与列表相同的 tab/deleted/good 条件计算总数
- **AND** Web 分页控件基于总数计算总页数
- **AND** 不使用当前页条数作为 total
