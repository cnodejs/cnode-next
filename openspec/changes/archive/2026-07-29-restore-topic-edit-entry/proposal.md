## Why

当前 next 版本迁移了帖子编辑路由和 `POST /api/v1/topics/update`，但帖子详情页没有暴露编辑入口，导致作者无法发现编辑能力。进一步看，现有编辑页通过默认 `mdrender=true` 的话题详情 API 加载内容，会把渲染后的 HTML 放进 Markdown 编辑器，和 legacy `nodeclub/controllers/topic.js`、`egg-cnode/app/controller/topic.js` 中编辑原始 Markdown 的线上行为不一致。

## What Changes

- 在帖子详情页恢复作者和管理员可见的“编辑话题”入口，语义对齐 legacy `nodeclub/views/topic/index.html` 中作者/管理员编辑入口。
- 让编辑页加载话题时请求原始 Markdown 内容，避免把 HTML 写回正文。
- 保持现有 `POST /api/v1/topics/update` API 兼容路径和权限语义，不引入新的编辑端点。
- 补充验证覆盖，确认作者/管理员可进入编辑流程，非作者不看到可用入口且后端继续拒绝越权更新。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `topic-detail-experience`: 话题详情页必须为有权限用户提供编辑入口，并保证进入编辑页时加载的是原始 Markdown。

## Impact

- Affected systems: `apps/web` 话题详情页、话题编辑页；`apps/api` 仅作为现有契约验证对象。
- Affected APIs: 复用 `GET /api/v1/topic/:id?mdrender=false` 和 `POST /api/v1/topics/update`。
- Dependencies: 无新增依赖，无数据库 schema/migration。
- High-risk categories: 权限展示与后端权限不一致；误用渲染后 HTML 覆盖 Markdown 原文；招聘帖 `job_meta` 编辑路径继续保持必填校验。

## Non-goals

- 不重写 topic 编辑 API，不新增 REST 路径。
- 不改变作者、管理员、锁帖、招聘帖的后端权限规则。
- 不迁移 legacy 的全部 topic 管理图标样式，只恢复 next UI 中可发现且可用的编辑入口。
- 不在本变更中新增帖子编辑历史、版本回滚或审计日志。

## Scope

- In-scope areas: `apps/web/app/routes/topic.$tid.tsx`、`apps/web/app/routes/topic.$tid.edit.tsx`、相关前端/API 测试。
- Out-of-scope areas: 数据库结构、迁移脚本、积分规则、消息通知规则、管理员后台列表。
- Affected systems: Web SSR 页面、Hono API contract、shared Zod schema 的既有 `mdrender`/update body 行为。
- High-risk categories: 权限边界、Markdown 原文保真、legacy API 兼容。

## Documentation Impact

- `docs/` 和 `wiki/` 暂不需要更新；这是恢复 legacy 已有线上行为，不引入新用户概念或运维流程。
- 如后续维护公共 API 文档，可确认 `POST /api/v1/topics/update` 已继续记录为编辑主题端点。
