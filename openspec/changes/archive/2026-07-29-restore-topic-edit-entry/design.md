## Context

legacy `nodeclub/web_router.js` 和 `egg-cnode/app/router/web.js` 都提供 `/topic/:tid/edit` 页面路由，详情页中作者或管理员可以看到编辑入口。legacy 编辑页由服务端直接传入 `topic.content` 原文。

next 当前状态是“底层能力已迁移但用户路径断裂”：`apps/web/app/routes.ts` 已注册 `topic/:tid/edit`，`apps/web/app/routes/topic.$tid.edit.tsx` 已提交到 `/api/v1/topics/update`，`apps/api/src/routes/topic.ts` 已实现 `updateTopicRoute`。缺口在详情页无入口，以及编辑页默认加载 `mdrender=true` 内容。

```mermaid
flowchart LR
  A[Topic Detail] -->|authorized user sees edit action| B[/topic/:tid/edit]
  B -->|GET /api/v1/topic/:id?mdrender=false| C[Raw Markdown]
  B -->|POST /api/v1/topics/update| D[Existing API]
  D --> E[topicQueries.updateTopic]
```

## Goals / Non-Goals

**Goals:**

- 恢复 legacy 作者/管理员可编辑帖子的可发现入口。
- 确保编辑器加载原始 Markdown，而不是渲染后的 HTML。
- 继续复用现有 API 和 shared schema，保持变更小而可验证。

**Non-Goals:**

- 不改变后端编辑权限规则。
- 不新增帖子编辑历史、审计日志或版本恢复能力。
- 不扩展 mod 编辑权限；当前 API 使用 `isAdmin`，本变更只对齐已有后端语义和 legacy 管理员语义。

## Decisions

### Decision: 复用现有编辑页面和 API

- 选择：详情页增加到 `/topic/:tid/edit` 的入口，编辑页继续使用 `/api/v1/topics/update`。
- 原因：next 已存在完整提交链路，legacy API 也使用 `/api/v1/topics/update`。
- Rejected alternative: 新增 `PUT /api/v1/topic/:id`。拒绝原因是会扩大 API contract 面，且不符合 legacy 兼容优先。

### Decision: 编辑页通过 `mdrender=false` 获取原文

- 选择：编辑页读取 `GET /api/v1/topic/:id?mdrender=false`。
- 原因：shared `mdrenderQuerySchema` 已声明 `mdrender=false` 返回数据库原始 Markdown，`api-contract` 也已有该要求。
- Rejected alternative: 在前端从 HTML 反推 Markdown。拒绝原因是不可逆，会破坏代码块、链接、引用和 @mention 原文。

### Decision: 入口展示以作者或管理员为准

- 选择：详情页基于当前用户和 topic author 判断显示入口；后端仍作为最终权限裁决。
- 原因：legacy `nodeclub/views/topic/index.html` 对作者和 `is_admin` 显示编辑图标。
- Rejected alternative: 对 mod 也显示入口。拒绝原因是现有更新 API 使用 `isAdmin`，若 UI 给 mod 显示入口会制造前后端权限不一致。

## Risks / Trade-offs

- [Risk] currentUser DTO 可能只有 `is_mod` 而没有 `is_admin` → Mitigation: 实现前确认 loader/current user shape，必要时只对作者展示入口，管理员能力通过后端或已有用户 DTO 字段对齐。
- [Risk] 招聘帖编辑时 `job_meta` 缺失导致提交被 schema 拒绝 → Mitigation: 编辑页继续按 `tab === "job"` 初始化和提交 `job_meta`，并覆盖历史招聘帖无 meta 的行为。
- [Risk] 详情页显示入口但后端拒绝锁帖普通用户编辑 → Mitigation: 后端仍是最终裁决；如详情 DTO 未暴露 lock 状态，入口可先保持作者可见，提交失败显示 API 错误。

## Migration Plan

1. 部署 Web 入口和编辑页加载参数修正。
2. 保持 API 与数据库不变，无数据迁移。
3. 回滚时移除入口即可，已有 API 不受影响。

## Database Change Audit

- PostgreSQL schema: 不变。
- Drizzle migrations: 不需要。
- Seed/bootstrap/index/constraint/backfill/data repair/data cleanup/data retention/field semantics: 不涉及。

## Open Questions

- 当前 session user DTO 是否稳定包含 `is_admin`？实现前需从 `apps/web` auth loader 或 `/api/v1/user/current` 类接口确认。
