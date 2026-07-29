## 1. 数据库与契约层

- [x] 1.1 在 `packages/db/src/schema/job_meta.ts` 新增 `job_meta` 表（topic_id PK/FK ON DELETE CASCADE + company/position/location/remote/salary_min/salary_max/experience/tech_tags[]/contact/company_logo + timestamps），在 `schema/index.ts` 导出
- [x] 1.2 在 `packages/db/src/schema/tabs.ts` 新增 `tabs` 表（id PK + key UNIQUE + label + visible default true + sort_order + timestamps），在 `schema/index.ts` 导出
- [x] 1.3 在 `packages/db/src/schema/zones.ts` 新增 `zones` 表（id PK + slug UNIQUE + name + description + icon + visible default false + sort_order + timestamps），在 `schema/index.ts` 导出
- [x] 1.4 使用 Drizzle migration 文件新增三张表并 review SQL；本地临时库可用 `pnpm db:push:pg` 快速验证，但远程 rehearsal/production SHALL NOT 使用 push 作为发布路径
- [x] 1.5 在 migration/bootstrap 中幂等初始化 `tabs`（share/ask/job/good 全部 visible=true, sort 1-4）和 `zones`（jobs visible=false）；不得依赖 `pnpm db:seed` 初始化生产必需配置
- [x] 1.5a 修改 `packages/db/src/seed.ts` 为非破坏性空库初始化脚本：不得 delete/truncate 业务表，已有用户数据时跳过 demo 用户/topic/reply，仅幂等补齐配置与敏感词
- [x] 1.6 在 `packages/shared/src/schemas/topic.ts` 扩展 `createTopicBodySchema` / `updateTopicBodySchema`，新增可选 `job_meta` 对象字段，用 `superRefine` 实现 `tab='job'` 时必填、`tab≠'job'` 时禁用的条件校验
- [x] 1.7 在 `packages/shared/src/schemas/topic.ts` 扩展 `topicDTOSchema` / `fullTopicSchema`，在 `tab='job'` 时附带 `job_meta` 可选对象；新增 `jobMetaSchema` 独立导出供专区 API 复用
- [x] 1.8 在 `packages/shared/src/schemas/` 新增 `tab.ts`（`tabSchema`）和 `zone.ts`（`zoneSchema`），导出供 root loader 和管理后台复用
- [x] 1.9 运行 `pnpm typecheck` 验证 shared 契约层类型安全

## 2. API 层

- [x] 2.1 在 `apps/api/src/lib/db.ts` 新增 `jobMetaQueries`（upsert / getById / getByTopicId / listWithFilters / facetAggregates），upsert 用 `ON CONFLICT (topic_id) DO UPDATE`；新增 `tabQueries`（listAll / listVisible / updateById）和 `zoneQueries`（listAll / listVisible / updateById）
- [x] 2.2 在 `apps/api/src/routes/topic.ts` 的 create/update handler 中，`tab='job'` 时用事务包裹 topics INSERT + job_meta upsert；响应 `GET /api/v1/topics/:id` 在 `tab='job'` 时附带 `job_meta`
- [x] 2.3 新增 `apps/api/src/routes/zone.ts`，定义 `GET /api/v1/zone/jobs`（分页 + location/remote/salary_min/tags 筛选，INNER JOIN job_meta，返回卡片数据含 excerpt）和 `GET /api/v1/zone/jobs/facets`（distinct location 聚合 + remote 枚举，缓存 5 分钟）
- [x] 2.4 在 `apps/api/src/routes/admin.ts` 新增专区管理 API：`GET /api/v1/admin/zones`（返回所有 zones 行）、`PATCH /api/v1/admin/zones/:id`（更新 name/description/icon/visible/sort_order，写审计日志，admin 权限）
- [x] 2.5 在 `apps/api/src/routes/admin.ts` 新增 Tab 管理 API：`GET /api/v1/admin/tabs`（返回所有 tabs 行）、`PATCH /api/v1/admin/tabs/:id`（更新 label/visible/sort_order，key 不可修改，写审计日志，admin 权限）
- [x] 2.6 新增 `GET /api/v1/zones`（公开接口，返回 `visible=true` 的专区列表，供 root loader 调用）和 `GET /api/v1/tabs`（公开接口，返回所有 tabs 行，供 root loader 调用）；两个接口加 5 分钟 KV 缓存
- [x] 2.7 在 `apps/api/src/routes/index.ts` 挂载 zone 路由和新的 admin 端点，OpenAPI 文档自动生成；运行 `pnpm typecheck` 验证 API 层

## 3. Web 专区展示组件

- [x] 3.1 新增 `apps/web/app/components/JobMetaForm.tsx`，使用 shadcn Form + `jobMetaSchema`，含公司/logo 上传（复用 `uploadEditorImage`）/职位/地点/远程/薪资 min-max/经验/技术栈 tags 输入/联系方式字段
- [x] 3.2 新增 `apps/web/app/components/JobFilterBar.tsx`，顶条 facet 筛选条（location select / remote 枚举 / salary_min input / tags multi），筛选变化写 URL query；移动端折叠为 Sheet
- [x] 3.3 新增 `apps/web/app/components/JobCardGrid.tsx` 及单卡子组件，展示 logo/公司/职位/徽章组/tech_tags/JD 摘要（复用 `excerptMarkdown`），与详情页 JobMetaCard 职责分离
- [x] 3.4 新增 `apps/web/app/components/JobMetaCard.tsx`，详情页完整版（logo/公司/职位/徽章/tech_tags/contact/CTA），CTA 按 contact 形态分发（mailto / 外链 / Sheet 展示 + 复制按钮）
- [x] 3.5 新增 `apps/web/app/routes/zone.jobs.tsx`，loader 调用 `/api/v1/zone/jobs` 和 `/api/v1/zone/jobs/facets`，渲染 JobFilterBar + JobCardGrid + Pagination（复用现有组件），全宽布局不复用 FeedGrid

## 4. Web 发帖/编辑表单扩展

- [x] 4.1 改造 `apps/web/app/routes/topic.create.tsx`：右侧面板按 tab 条件渲染，`tab='job'` 时渲染 JobMetaForm，否则保持现有"发布建议"；提交 body 在 `tab='job'` 时带上 `job_meta` 对象
- [x] 4.2 改造 `apps/web/app/routes/topic.$tid.edit.tsx`：`tab='job'` 时右侧渲染 JobMetaForm 预填现有 meta；提交 body 带上 `job_meta`；`tab≠'job'` 时不渲染 meta 表单
- [x] 4.3 改造 `apps/web/app/routes/topic.$tid.tsx`：content Card 内部 MarkdownView 上方，`tab='job'` 且 `job_meta` 非空时渲染 JobMetaCard；无 meta 时不渲染
- [x] 4.4 在 `apps/web/app/routes.ts` 注册 `zone/jobs` 路由指向 `routes/zone.jobs.tsx`
- [x] 4.5 运行 `pnpm typecheck` 验证 Web 层类型

## 5. 导航栏 DB 驱动与指引合并

- [x] 5.1 改造 `apps/web/app/root.tsx` loader：并行调用 `/api/v1/zones` 和 `/api/v1/tabs`（加 5 分钟 KV 缓存），将 `zones` 和 `tabs` 注入 root loader data
- [x] 5.2 改造 `apps/web/app/components/Layout.tsx` 的 Header：专区下拉从 `useRouteLoaderData("root")` 读取 `zones`，只渲染 `visible=true` 的专区入口，按 `sort_order` 排序，无可见专区时隐藏下拉；将"入门/API/关于"合并为单一"指引"链接指向 `/help`；移动端 sheet 同步更新
- [x] 5.3 改造 `apps/web/app/routes/_index.tsx`：tab 按钮从 `useRouteLoaderData("root")` 读取 `tabs` 替代硬编码 `TABS` 数组，只渲染 `visible=true` 的 tab，按 `sort_order` 排序
- [x] 5.4 改造 `apps/web/app/lib/brand.ts` 的 `getTabLabel`：从参数或 root loader data 读取 `tabs` 配置查询 label；SSR 无 loader data 时 fallback 到硬编码默认值
- [x] 5.5 新增 `apps/web/app/routes/help.tsx`，合并 `/getstart` / `/about` / `/faq` 内容为单页 + 锚点导航（`#getstart` / `#about` / `#faq`）；移动端以可折叠 disclosure 展示
- [x] 5.6 在 `apps/web/app/routes.ts` 注册 `/help` 路由；保留 `/getstart` / `/about` / `/faq` / `/api` 原有路由不删
- [x] 5.7 改造 `apps/web/app/components/Sidebar.tsx` 的"参与讨论前"卡片 CTA，将 `/getstart` 链接改为 `/help`

## 6. 管理后台专区与 Tab 管理

- [x] 6.1 新增 `apps/web/app/routes/admin/zones.tsx`，列表展示所有 zones 行（slug/name/description/icon/visible Checkbox/sort_order），调用 `GET/PATCH /api/v1/admin/zones`；保存后 `toast` 反馈 + revalidate；v1 不展示新增/删除按钮
- [x] 6.2 新增 `apps/web/app/routes/admin/tabs.tsx`，列表展示所有 tabs 行（key 只读/label/visible Checkbox/sort_order），调用 `GET/PATCH /api/v1/admin/tabs`；保存后 `toast` 反馈 + revalidate；v1 不展示新增/删除按钮
- [x] 6.3 在 `apps/web/app/routes.ts` 注册 `admin/zones` 和 `admin/tabs` 路由
- [x] 6.4 改造 `apps/web/app/components/AdminLayout.tsx` 或导航：在管理后台侧栏/导航新增"专区管理"和"Tab 管理"入口
- [x] 6.5 验证管理后台切换 zones.visible / tabs.visible 后，导航栏和首页 tab 按钮实时反映配置变化

## 7. 验证与收尾

- [x] 7.0 远程数据库变更预检：确认 `current_database()` / `current_user` / host/port，记录 users/topics/replies/messages/topic_collects row counts，并确认已有可恢复备份
- [x] 7.1 运行 `pnpm lint` 修复 lint 问题
- [x] 7.2 运行 `pnpm typecheck` 确保全栈类型通过
- [x] 7.3 运行 `pnpm test` 确保现有测试不回归；为 job_meta schema 校验逻辑（tab=job 必填、tab≠job 禁用）补单元测试
- [x] 7.4 手动验证：发帖选 job → 右侧出 JobMetaForm → 上传 logo → 提交 → 详情页展示 JobMetaCard + CTA → 专区列表展示卡片 → 筛选 facets 生效
- [x] 7.5 验证历史招聘帖（`tab='job'` 无 meta）：详情页不渲染 JobMetaCard，专区列表不展示该帖
- [x] 7.6 验证移动端：专区页筛选折叠为 Sheet，卡片单列，触摸目标 ≥ 36px
- [x] 7.7 验证管理后台：admin 关闭 zones.jobs.visible → 导航栏专区下拉消失；admin 关闭 tabs.job.visible → 首页 tab 按钮消失但 `?tab=job` 仍可访问
- [x] 7.8 验证 root loader 缓存：刷新页面后 zones/tabs 配置从 KV 缓存读取，DB 查询不重复
- [x] 7.9 运行 `pnpm verify` 走完整 release gate
