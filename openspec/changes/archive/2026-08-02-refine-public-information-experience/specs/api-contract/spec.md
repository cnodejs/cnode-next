## MODIFIED Requirements

### Requirement: API 响应格式对齐

API 端点 `/api/v1/*` 的核心响应结构 MUST 与 `../nodeclub/api_router_v1.js` 保持兼容。CNode Next MAY 为用户详情增加文档化的 additive 公开资料字段，但 MUST NOT 扩充被话题、回复和消息复用的轻量 `author` 摘要。

#### Scenario: 获取话题列表

- **WHEN** 调用 `GET /api/v1/topics?page=1&limit=20&tab=share&mdrender=true`
- **THEN** 返回 `{ success: true, data: TopicDTO[] }`
- **AND** 每个 TopicDTO 包含 `id, author_id, tab, content, title, last_reply_at, good, top, reply_count, visit_count, create_at, author { loginname, avatar_url }`
- **AND** content 经过 markdown 渲染和 linkUsers 处理。

#### Scenario: 获取话题详情

- **WHEN** 调用 `GET /api/v1/topic/:id?mdrender=true&accesstoken=xxx`
- **THEN** 返回 `{ success: true, data: FullTopicDTO }`
- **AND** data 包含 `replies[]`, `author`, `is_collect`, `is_uped`
- **AND** 每个 reply 的 `is_uped` 反映当前 accesstoken 用户是否点赞
- **AND** `author` 继续只包含 `loginname` 与 `avatar_url`。

#### Scenario: 获取用户信息必须返回 recent_replies 和公开资料

- **WHEN** 调用 `GET /api/v1/user/:loginname`
- **THEN** 返回 `{ success: true, data: UserDTO }`
- **AND** data 包含 `recent_topics[]` 和 `recent_replies[]`
- **AND** data 包含 nullable string 字段 `location`、`url`、`signature` 和 string 字段 `githubUsername`
- **AND** data 包含 `score`、`topic_count`、`reply_count`、`collect_topic_count`
- **AND** data 包含由 `admin`、`moderator`、`recruiter` 组成且不重复的 `identities[]`
- **AND** data 不公开 `weibo`、email、access token 或其他敏感账号字段。

#### Scenario: 消息数量返回格式

- **WHEN** 调用 `GET /api/v1/message/count?accesstoken=xxx`
- **THEN** 返回 `{ success: true, data: count }`。

#### Scenario: 消息列表的 reply 字段必须完整

- **WHEN** 调用 `GET /api/v1/messages?accesstoken=xxx&mdrender=true`
- **THEN** 返回 `{ success: true, data: { has_read_messages, hasnot_read_messages } }`
- **AND** 每个 message 的 reply 字段包含 `id, content, ups, create_at`。

#### Scenario: 回复点赞

- **WHEN** 调用 `POST /api/v1/reply/:reply_id/ups` 且用户未点赞过
- **THEN** 返回 `{ success: true, action: 'up' }`
- **WHEN** 同一用户再次调用
- **THEN** 返回 `{ success: true, action: 'down' }`
- **WHEN** 用户试图给自己的回复点赞且非 debug 模式
- **THEN** 返回 `{ success: false, error_msg: '不能帮自己点赞' }`。

#### Scenario: accessToken 验证

- **WHEN** 调用 `POST /api/v1/accesstoken` body 含有效 accesstoken
- **THEN** 返回 `{ success: true, loginname, avatar_url, id }`。

#### Scenario: 话题内容必须经过 linkUsers 处理

- **WHEN** API 返回话题或回复的 content
- **AND** mdrender=true
- **THEN** content 必须先经过 at.linkUsers 再进行 Markdown 渲染。
