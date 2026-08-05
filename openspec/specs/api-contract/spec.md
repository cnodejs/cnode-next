# api-contract Specification

## Purpose

TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.

## Requirements

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

### Requirement: 公共 API 必须过滤不可公开话题

`/api/v1/*` 中面向公开客户端的话题列表、用户聚合和收藏查询 SHALL 排除不可公开话题。不可公开话题包括 `deleted=true`、`status='deleted'`、`tab` 为 `dev` 或 `test`、以及作者处于 block 状态的话题。mute 状态只限制写入，不影响已有内容公开可见性。

#### Scenario: 获取公开话题列表排除内部和受限内容

- **WHEN** 调用 `GET /api/v1/topics?page=1&limit=20&tab=all`
- **THEN** 返回的话题 MUST 不包含 `tab=dev` 或 `tab=test` 的话题
- **AND** MUST 不包含已删除话题
- **AND** MUST 不包含作者已被 block 的话题

#### Scenario: 获取公开话题列表按指定 tab 查询

- **WHEN** 调用 `GET /api/v1/topics?tab=share` 或其他公开 tab
- **THEN** 返回的话题 MUST 仍然排除已删除话题和作者已被 block 的话题
- **AND** 当请求 `tab=dev` 或 `tab=test` 时，公共 API MUST 返回空列表或权限错误，而不是公开内部内容

#### Scenario: 收藏 API 排除不可公开话题

- **WHEN** 调用 `GET /api/v1/topic_collect/:loginname`
- **THEN** 返回的话题 MUST 不包含已删除、内部 tab 或作者已被 block 的话题

#### Scenario: 用户聚合 API 排除不可公开话题

- **WHEN** 调用 `GET /api/v1/user/:loginname`
- **THEN** `recent_topics` 和 `recent_replies` MUST 只包含公开可见话题
- **AND** 回复聚合 MUST 排除所属话题不可公开的回复记录

#### Scenario: mute 用户内容仍按普通公开规则展示

- **WHEN** 某用户仅处于 mute 状态且未处于 block 状态
- **THEN** 该用户已有话题 MUST 按 tab、deleted 和 status 等普通公开规则决定是否展示
- **AND** 公共 API MUST NOT 仅因 mute 状态隐藏其已有话题

### Requirement: 搜索接口必须与页面声明和前端 DTO 对齐

搜索 API SHALL 返回前端列表组件可消费的稳定 DTO，并且查询范围必须与搜索页文案一致。

#### Scenario: 搜索标题和内容

- **WHEN** 搜索页声明可搜索话题标题和内容
- **THEN** `/api/v1/search?engine=local&q=<keyword>` MUST 查询公开可见话题的标题和内容
- **AND** 已删除、内部 tab 或 block 作者内容 MUST 不出现在搜索结果中

#### Scenario: 搜索返回 TopicDTO 兼容字段

- **WHEN** 前端调用 local search API
- **THEN** 返回的每条结果 MUST 包含 `id`、`title`、`tab`、`reply_count`、`visit_count`、`last_reply_at` 和 `author`
- **AND** `author` MUST 包含 `loginname` 和 `avatar_url`
- **AND** 前端不得依赖数据库 raw column 名称渲染搜索结果

#### Scenario: 不支持内容搜索时文案必须降级

- **WHEN** 系统暂不支持内容搜索
- **THEN** 搜索页文案 MUST 明确只搜索标题
- **AND** spec 不得声明内容搜索已完成

### Requirement: API 契约必须提供 OAS 机器可读文档

项目 SHALL 提供 OpenAPI Specification (OAS) 文档作为外部 API reference 和未来 smoke/contract 验证的机器可读来源。OAS 文档 MUST 由 `apps/api` 路由内的 zod-openapi 声明自动生成，不得手写维护。

#### Scenario: OAS 文件存在

- **WHEN** 外部开发者或验证脚本查找 API 契约
- **THEN** 仓库 MUST 提供由 `apps/api` 路由 zod-openapi 声明生成的 `api/openapi.json` 文件
- **AND** README 或 API reference MUST 链接到该 OAS 文件
- **AND** 项目 MUST NOT 保留手写的 `api/openapi.yaml` 或任何与路由声明脱节的手写 OAS 文件

#### Scenario: OAS 从路由自动生成

- **WHEN** 开发者修改 `apps/api/src/routes/*.ts` 中某个端点的 path、method、zod schema 或 OpenAPI metadata
- **THEN** 运行 `pnpm gen:openapi` MUST 重新生成 `api/openapi.json` 反映该变更
- **AND** `pnpm verify` 流程 MUST 在 `verify:openapi` 之前自动执行 `gen:openapi`
- **AND** 生成的 `api/openapi.json` MUST 不包含 `x-contract-response-fields` 扩展——响应 schema 由完整 zod 定义描述

#### Scenario: OAS 可被工具读取

- **WHEN** 验证脚本或 OpenAPI 工具读取 OAS 文件
- **THEN** OAS MUST 定义 `openapi` 版本、`info`、`servers`、`paths`、`components.schemas` 和认证方案
- **AND** OAS MUST 不包含生产 secret、真实用户 token 或私有环境变量

#### Scenario: OAS 覆盖全部路由端点

- **WHEN** `apps/api/src/routes/*.ts` 中的任一路由文件新增端点
- **THEN** 生成的 `api/openapi.json` MUST 包含该端点
- **AND** 项目 MUST NOT 保留未在 OAS 中声明的 `/api/v1/*` 端点（除 `/health` 等内部端点外）
