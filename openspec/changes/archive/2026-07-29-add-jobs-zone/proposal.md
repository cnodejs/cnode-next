## Why

cnode-next 基础能力已完备，社区内容形态仍以"分享/问答"为主，缺少对结构化信息的承载能力。现有 `topics` 表 + markdown content 的模型无法支撑招聘这类需要按地点、薪资、技术栈筛选的信息型内容，也无法在列表层做卡片化展示。

转型方向：从单纯的技术分享社区，扩展为"信息发布平台 + 社区"。招聘专区作为首个落地点，验证"topics 基础表 + 专用 meta 侧表 + 专区专属 UI"的扩展模式，为后续图集、活动等专区铺路。同时将导航栏中分散的入门/API/关于/FAQ 合并为统一的指引入口，减少导航碎片化。

## What Changes

- 新增 `job_meta` 表（1:1 关联 `topics.id`），存储招聘结构化字段：公司、公司 logo、职位类别、地点、远程模式、薪资范围、经验要求、技术栈、联系方式
- 复用现有 `topics` 表（`tab='job'`）与 `reply` 评论区，不新建独立内容类型
- 扩展 `createTopicBodySchema` / `updateTopicBodySchema`（`packages/shared/src/schemas/topic.ts:47,55`），接受可选 `job_meta` 对象，单次 POST 提交
- 新增专区路由 `/zone/jobs`，展示全宽卡片网格 + 顶条 facet 筛选（地点/远程/薪资/技术栈），移动端适配
- 新增专区专用组件 `JobFilterBar`、`JobCardGrid`、`JobMetaCard`、`JobMetaForm`，不复用 `TopicList` / `FeedGrid`
- 详情页 `topic.$tid.tsx` 在 content 上方插入 `JobMetaCard`（含 logo/公司/职位/徽章/contact/CTA）
- 发帖页 `topic.create.tsx` 右侧面板按 `tab` 条件渲染：`tab=job` 时展示 `JobMetaForm`，否则保持现有"发布建议"
- 编辑页 `topic.$tid.edit.tsx` 同步支持 `tab=job` 时的 meta 字段编辑
- 导航栏新增"专区"下拉（含招聘专区入口），并将入门/API/关于/FAQ 合并为统一指引入口
- 首页 `topic.ts:82` 的 `excludeTabs: ["job"]` 排除逻辑保留，招聘只在专区展示
- 新增 `GET /api/v1/zone/jobs` 接口，支持按结构化字段筛选
- 用户上传公司 logo 复用现有 OSS 上传通路（`auth.ts:384` `POST /upload/image`）
- 新增 `tabs` 表，将首页 tab 按钮从硬编码（`_index.tsx:37-43` / `brand.ts:17`）改为 DB 驱动，管理后台可控制 tab 可见性与排序
- 新增 `zones` 表，作为专区注册表，管理后台可控制专区可见性（`visible` 开启时导航栏才显示专区入口）；migration/bootstrap 默认 `zones.jobs.visible=false`（内测能力，暂不开放）
- 新增数据库变更安全约束：远程/共享环境只能通过 Drizzle migration 应用 schema 与生产必需配置；`pnpm db:seed` 仅用于空库初始化/本地开发，且不得删除业务表
- 管理后台新增"专区管理"（`admin/zones.tsx`）和"Tab 管理"（`admin/tabs.tsx`）两个页面
- 导航栏与首页 tab 从 root loader 异步加载 `zones` / `tabs` 配置，替代硬编码

## Capabilities

### New Capabilities
- `jobs-zone`: 招聘专区展示与筛选能力 —— 卡片网格布局、顶条 facet 筛选、结构化字段筛选逻辑、专区路由与数据加载
- `jobs-structured-fields`: 招聘结构化字段能力 —— job_meta 表、字段定义、发布/编辑表单、单次提交契约
- `jobs-detail-card`: 招聘详情页 meta 卡片展示能力 —— content 上方插入 JobMetaCard、徽章渲染、CTA 投递入口
- `help-portal`: 指引内容合并能力 —— 将 /getstart /api /about /faq 合并为统一指引入口
- `admin-zone-management`: 专区管理后台能力 —— zones 注册表 CRUD、可见性开关、专区入口控制
- `admin-tab-management`: Tab 管理后台能力 —— tabs 注册表、首页 tab 按钮可见性与排序控制
- `database-change-safety`: 数据库变更安全能力 —— Drizzle migration 流程、seed 边界、远程执行保护、备份与预检要求

### Modified Capabilities
- `navigation-shell`: 导航栏新增"专区"下拉入口，指引类链接合并为单一入口
- `topic-detail-experience`: 详情页在 `tab=job` 时于 content 上方渲染 meta 卡片
- `web-ui-forms`: 发帖/编辑表单按 tab 条件渲染右侧 meta 字段面板

## Impact

**数据库**：新增 `job_meta` 表（FK→topics.id ON DELETE CASCADE）、`tabs` 表、`zones` 表，新增 Drizzle migration；生产必需默认配置随 migration/bootstrap 幂等初始化，不依赖 destructive seed
**API**：扩展 `POST /api/v1/topics`、`PUT /api/v1/topics/:id` body 接受 `job_meta`；新增 `GET /api/v1/zone/jobs` + `GET /api/v1/zone/jobs/facets`；新增 `GET/PATCH /api/v1/admin/zones` + `GET/PATCH /api/v1/admin/tabs`；`root.tsx` loader 加载 zones + tabs 注入全局
**Shared 契约**：`packages/shared/src/schemas/topic.ts` 扩展；新增 `tabSchema` / `zoneSchema`
**Web 路由**：新增 `apps/web/app/routes/zone.jobs.tsx` / `admin/zones.tsx` / `admin/tabs.tsx` / `help.tsx`；编辑 `topic.create.tsx` / `topic.$tid.edit.tsx` / `topic.$tid.tsx` / `Layout.tsx` / `_index.tsx` / `routes.ts` / `root.tsx`
**Web 组件**：新增 `JobFilterBar` / `JobCardGrid` / `JobMetaCard` / `JobMetaForm`；不改动 `TopicList` / `Sidebar` / `MarkdownEditor`
**首页**：`apps/api/src/routes/topic.ts:82` 的 `excludeTabs: ["job"]` 保留不变
**复用不动**：`reply` 评论区、收藏、积分、浏览计数、OSS 上传通路

## Non-goals

- 不新建独立 `jobs` 内容类型表 —— 招聘复用 topics + meta 侧表模式，避免内容池分裂
- 不做通用 facet 框架 —— 每个专区定制自己的筛选器，不为"配置驱动"提前建框架
- 不改变首页社区流形态 —— 首页保持 `TopicList` 列表 + `FeedGrid` 布局，招聘专区是独立路由
- 不迁移历史招聘帖 —— 历史 `tab=job` 的 topics 不回填 `job_meta`，专区列表只展示有 meta 的招聘帖（实施时确认筛选逻辑）
- 不做 job_meta 字段的审核扫描 —— `moderation-scan.ts` v1 不扫描 meta 字段中的 company/contact 文本（已知缺口，后续补）
- 不做招聘搜索集成 —— `/search` v1 只搜 title/content，不索引 job_meta 结构化字段
- 不做其他专区 —— 图集、活动等专区为后续工作，本提案仅落地招聘专区验证模式
- 不改变首页 API 排除逻辑 —— `topic.ts:82` 的 `excludeTabs: ["job"]` 是硬编码行为层，与 `tabs.visible`（UI 层）独立

## Out of scope（后续工作）

- 通用专区组件框架
- 其他专区（gallery / event 等）的 meta 表与专属 UI
- job_meta 字段的全文搜索与 RSS 集成
