# jobs-structured-fields Specification

## Purpose

定义招聘结构化字段的存储、校验、提交契约。招聘帖复用 `topics` 表（`tab='job'`）+ `job_meta` 侧表（1:1 FK），单次 POST 提交，评论区复用 `reply` 表。

## ADDED Requirements

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
