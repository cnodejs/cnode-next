## Why

当前后台管理里的话题、用户、审计日志、举报、敏感词、封禁等列表大多只返回固定数量或只支持 `limit`，缺少 `page/total`，数据增长后管理员无法稳定翻页处理历史记录。legacy nodeclub 的公开列表和用户内容列表普遍使用分页思想，新版本后台也需要形成一致的分页契约，避免管理页面只能看到最近一小段数据。

## What Changes

- 后台列表 API 统一支持 `page`、`limit` 参数，并返回 `data`、`total`、`page`、`limit`。
- 后台话题、用户、审计日志、举报队列、敏感词、用户封禁、IP 封禁等管理列表接入分页。
- 前端后台管理页使用统一分页组件或等价分页控件，保留搜索/筛选条件并随页码切换。
- `limit` 设置上限，避免后台列表接口一次性返回过多数据。
- 保持概览卡片和“最近 N 条”模块的固定数量语义，不强行分页。

## Capabilities

### New Capabilities

- `admin-list-pagination`: 后台管理列表统一分页契约和 Web 分页体验。

### Modified Capabilities

- `admin-dashboard`: 后台管理页中承载数据列表的页面需要提供分页访问，不再只显示固定数量结果。

## Non-goals

- 不重做后台信息架构，不新增独立管理模块。
- 不改变公开 `/api/v1/topics` 等已有公开 API 的分页契约。
- 不要求概览页的“最近注册用户”“最近发布话题”“最近审计操作”改为分页；它们仍是摘要模块。
- 不引入无限滚动或虚拟列表；后台管理优先使用明确页码分页。

## Impact

- API: `apps/api/src/routes/admin.ts` 中多个列表接口需要补充 `page`、`limit`、`total`、`offset` 逻辑。
- Web: `apps/web/app/routes/admin/*.tsx` 中话题、用户、审计、举报、敏感词、封禁等页面需要读取分页参数并渲染分页控件。
- Shared/UI: 复用现有 `apps/web/app/components/Pagination.tsx`，必要时扩展为适合后台表格使用。
- Legacy reference: 对齐 `nodeclub/controllers/site.js` 首页分页和用户内容列表的分页模式，但后台接口保留新版本 JSON 契约。
