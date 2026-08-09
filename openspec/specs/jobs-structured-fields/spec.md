# jobs-structured-fields Specification

## Purpose

TBD - created by archiving change add-jobs-zone. Update Purpose after archive.

## Requirements

### Requirement: job_meta 表定义

系统 SHALL 新增 `job_meta` 表，1:1 关联 `topics.id`，存储招聘结构化字段。`job_meta.topic_id` SHALL 既是主键又是外键，`ON DELETE CASCADE` 跟随 topic 生命周期。

#### Scenario: 表字段

- **WHEN** 系统 schema 包含 `job_meta` 表
- **THEN** 表包含字段：`topic_id` (PK/FK→topics.id ON DELETE CASCADE)、`company` (text, NOT NULL)、`company_logo` (text, nullable)、`position` (text, NOT NULL)、`location` (text, NOT NULL)、`remote` (text, 枚举 on-site/hybrid/remote, NOT NULL)、`salary_min` (int, nullable)、`salary_max` (int, nullable)、`experience` (text, nullable)、`tech_tags` (text[], nullable)、`contact` (text, NOT NULL)、`create_at` (timestamp)、`update_at` (timestamp)

#### Scenario: 删除 topic 自动清理 meta

- **WHEN** 一个 `tab='job'` 的 topic 被删除
- **THEN** 对应的 `job_meta` 行自动删除
- **AND** 不需要应用层显式删除 meta

### Requirement: 单次 POST 提交契约

`createTopicBodySchema` / `updateTopicBodySchema`（`packages/shared/src/schemas/topic.ts:47,55`）SHALL 扩展接受可选 `job_meta` 对象。`job_meta` 字段 SHALL 与 `job_meta` 表字段对应。

#### Scenario: tab=job 时必填 job_meta

- **WHEN** 客户端提交 `{ tab: "job", title, content }` 不含 `job_meta`
- **THEN** 校验失败，返回 `job_meta` 必填错误

#### Scenario: tab=job 时提交完整 job_meta

- **WHEN** 客户端提交 `{ tab: "job", title, content, job_meta: { company, position, location, remote, contact, ... } }`
- **THEN** 校验通过
- **AND** API 在单个事务内 INSERT topics 和 INSERT job_meta
- **AND** 成功时返回 `{ success: true, topic_id }`

#### Scenario: tab≠job 时传 job_meta 报错

- **WHEN** 客户端提交 `{ tab: "share", title, content, job_meta: {...} }`
- **THEN** 校验失败
- **AND** 返回 `job_meta` 不应存在的错误

### Requirement: Zod 条件校验用 superRefine

`job_meta` 的条件必填校验 SHALL 用 Zod `superRefine` 在 schema 层实现，不分散到 API handler 内手写 if 判断。

#### Scenario: superRefine 校验逻辑

- **WHEN** Zod schema 校验 `createTopicBody`
- **THEN** `superRefine` 检查：`tab === "job"` 时 `job_meta` 必填且 `company` / `position` / `location` / `remote` / `contact` 不可为空
- **AND** `tab !== "job"` 时 `job_meta` 必须为 `undefined`

### Requirement: API 事务保证一致性

`POST /api/v1/topics` 和 `PUT /api/v1/topics/:id` 在 `tab='job'` 时 SHALL 用数据库事务包裹 `topics` 和 `job_meta` 的写入。

#### Scenario: job_meta 插入失败回滚 topic

- **WHEN** INSERT topics 成功但 INSERT job_meta 失败
- **THEN** 事务回滚
- **AND** topic 不被创建
- **AND** 返回错误响应

#### Scenario: 编辑时 job_meta 整体 upsert

- **WHEN** 用户编辑 `tab='job'` 的 topic 并提交 `job_meta`
- **THEN** API 在事务内更新 topics 和 upsert job_meta（`ON CONFLICT (topic_id) DO UPDATE`）
- **AND** 不做按字段 patch，整体替换 meta 行

### Requirement: GET 话题详情带 job_meta

`GET /api/v1/topics/:id` 的响应在 `tab='job'` 时 SHALL 附带 `job_meta` 对象。`tab≠job` 时响应不含 `job_meta` 字段。

#### Scenario: 招聘详情带 meta

- **WHEN** 客户端请求 `tab='job'` 且有 meta 的 topic 详情
- **THEN** 响应包含 `job_meta: { company, company_logo, position, location, remote, salary_min, salary_max, experience, tech_tags, contact }`

#### Scenario: 非招聘详情不带 meta

- **WHEN** 客户端请求 `tab='share'` 的 topic 详情
- **THEN** 响应不含 `job_meta` 字段

#### Scenario: 历史招聘帖无 meta 的详情

- **WHEN** 客户端请求 `tab='job'` 但无 `job_meta` 行的 topic 详情
- **THEN** 响应的 `job_meta` 为 `null`
- **AND** 详情页不渲染 JobMetaCard

### Requirement: 公司 logo 上传复用 OSS 通路

`job_meta.company_logo` 的图片上传 SHALL 复用现有 `POST /api/v1/upload/image`（`apps/api/src/routes/auth.ts:384`）和 `uploadEditorImage`（`apps/web/app/lib/upload-client.ts:10`）。

#### Scenario: 上传 logo

- **WHEN** 用户在 `JobMetaForm` 上传公司 logo
- **THEN** 调用 `uploadEditorImage(file)` 上传到 OSS
- **AND** 返回的 URL 存入 `job_meta.company_logo`
- **AND** 上传限制复用现有规则（png/jpeg/gif/webp, 5MB）

### Requirement: 新增专区列表 API

系统 SHALL 新增 `GET /api/v1/zone/jobs` 接口，支持按结构化字段筛选，返回带 `job_meta` 的卡片数据。

#### Scenario: 专区列表查询

- **WHEN** 客户端请求 `GET /api/v1/zone/jobs?page=1&limit=20&location=上海&remote=remote&salary_min=30&tags=Node,PostgreSQL`
- **THEN** 后端执行 `topics INNER JOIN job_meta` 筛选
- **AND** 返回 `{ success: true, data: [{ id, title, company, company_logo, position, location, remote, salary_min, salary_max, experience, tech_tags, excerpt, create_at }], total }`

#### Scenario: facet 聚合接口

- **WHEN** 客户端请求 `GET /api/v1/zone/jobs/facets`
- **THEN** 后端返回 `{ success: true, data: { locations: ["上海","北京",...], remote_options: ["on-site","hybrid","remote"] } }`
- **AND** 结果缓存 5 分钟

### Requirement: 招聘发布需要 recruiter 角色

系统 SHALL 将 `tab='job'` 视为受限招聘发布能力。创建招聘话题的用户 MUST 是管理员或拥有有效 `recruiter` 角色，并且仍需满足普通发帖路径的登录、未禁言/封禁、新用户门槛、Turnstile 和限流要求。

#### Scenario: recruiter 创建招聘话题

- **WHEN** 拥有有效 `recruiter` 角色的用户提交 `{ tab: "job", title, content, job_meta }`
- **THEN** API 继续执行普通发帖校验和 `job_meta` 条件校验
- **AND** 校验通过后创建 topic 和对应 `job_meta`

#### Scenario: admin 创建招聘话题

- **WHEN** 管理员提交 `{ tab: "job", title, content, job_meta }`
- **THEN** API 允许进入招聘创建流程
- **AND** 管理员不需要在 `user_roles` 中拥有 `recruiter` 记录

#### Scenario: 普通用户不能创建招聘话题

- **WHEN** 非 admin 且没有有效 `recruiter` 角色的用户提交 `{ tab: "job", title, content, job_meta }`
- **THEN** API MUST 返回 403 或等价权限错误
- **AND** 不得创建 topic
- **AND** 不得创建 `job_meta`

### Requirement: 招聘编辑保持语义稳定

系统 SHALL 限制普通 topic 与招聘 topic 之间的任意转换，避免 `job_meta` 生命周期和内容语义混乱。

#### Scenario: 招聘作者编辑自己的招聘话题

- **WHEN** 招聘话题作者编辑原本 `tab='job'` 的话题并保持 `tab='job'`
- **THEN** 系统允许作者在未 block/mute 且通过普通编辑权限时更新内容和 `job_meta`
- **AND** 不要求作者当前仍拥有 `recruiter` 角色

#### Scenario: 普通话题改为招聘需要 recruiter

- **WHEN** 作者尝试将非 job 话题编辑为 `tab='job'`
- **THEN** API MUST 要求作者为 admin 或拥有有效 `recruiter` 角色
- **AND** 缺少资格时拒绝更新并保持原话题不变

#### Scenario: 招聘话题改为普通分类受限

- **WHEN** 非 admin 用户尝试将 `tab='job'` 话题改为非 job 分类
- **THEN** API MUST 拒绝该转换或要求管理员处理
- **AND** 不得遗留与普通 topic 不一致的 `job_meta` 状态

### Requirement: 发布页按角色控制招聘分类

Web 发布页 SHALL 根据当前用户 admin 状态和 roles 控制“招聘”分类可用性。无招聘发布资格的用户不得进入可提交的 `job` 表单状态。有权限用户选择 `job` 后，右侧 SHALL 依次显示“发布规范” Card、招聘说明 Card 和 `JobMetaForm`，不得用结构化表单替换前两项。

#### Scenario: recruiter 看到完整招聘发布组合

- **WHEN** 拥有有效 `recruiter` 角色的用户访问 `/topic/create` 并选择 `job`
- **THEN** 分类选择中展示可用的“招聘”选项
- **AND** 右侧先显示“发布规范”和招聘说明
- **AND** 随后显示 `JobMetaForm`

#### Scenario: admin 看到完整招聘发布组合

- **WHEN** admin 访问 `/topic/create` 并选择 `job`
- **THEN** 页面显示与 recruiter 相同顺序的发布规范、招聘说明和 `JobMetaForm`

#### Scenario: 普通用户不能提交招聘分类

- **WHEN** 普通登录用户访问 `/topic/create`
- **THEN** “招聘”分类不显示或以禁用状态显示并说明“招聘发布需要授权”
- **AND** 页面不得提交可成功创建招聘帖的 `tab='job'` 请求

#### Scenario: API 兜底拒绝绕过前端

- **WHEN** 普通用户手工构造 `tab='job'` 请求绕过前端
- **THEN** 后端权限校验 MUST 拒绝请求

### Requirement: 招聘作为常规首页 Tab

招聘话题 SHALL 作为常规公开 topic 参与 `all` feed，同时保留招聘专区、发布权限和 `job_meta` 结构化能力。

#### Scenario: all 包含公开招聘话题

- **WHEN** 用户请求首页 `tab=all`
- **THEN** 合法、未删除且作者未被 block 的 `job` topic 可以出现在结果中
- **AND** 其回复、收藏、置顶和精选行为与其他公开 topic 一致

#### Scenario: 招聘专区继续使用结构化筛选

- **WHEN** 用户访问招聘专区
- **THEN** 系统继续使用 `job_meta` 提供现有结构化列表和筛选
- **AND** 首页纳入 `job` 不得删除或弱化该专区能力
