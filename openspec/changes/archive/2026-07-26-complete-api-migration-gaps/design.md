## Context

已归档的 rewrite change 建立了 PostgreSQL-first 迁移演练，并补齐了大多数公开 API 和 Web 路由。归档后检查发现，剩余问题更集中：部分路由存在但不修改状态，部分路径仍用 SQLite 风格的 `0` / `1` 比较或写入 PostgreSQL boolean 列。

本变更不处理编辑器 UX。`implement-web-editor-preview-upload` 负责 Markdown 编辑模式和上传交互。本变更只补齐现有路由和话题详情页下方的论坛交互闭环。

## Goals / Non-Goals

**Goals:**

- 让核心 legacy-compatible API 写入/状态端点在 PostgreSQL 中真实持久化。
- 移除已知的 PostgreSQL boolean 兼容问题，覆盖 community、message、admin 等路径。
- 让话题详情暴露并使用真实收藏状态和回复点赞状态。
- 通过补充缺失 API，恢复已有回复编辑页。
- 为修正路径增加聚焦验证。

**Non-Goals:**

- 不实现 Markdown 编辑器或上传 UI。
- 不新增 release gate、branch protection 或 CI required checks。
- 不完整重设计管理后台巡检/审核工作流。
- 不实现草稿自动保存或修订历史；本变更只保证当前编辑行为可持久化。

## Current Gaps

```text
现有路由/页面                       当前缺口
──────────────────────────────────  ─────────────────────────────────────
POST /auth/local/signup             生成 retrieve_key 但未保存
GET /auth/local/active_account      不激活账号，只返回成功
POST /auth/local/search_pass        生成 reset key 但未保存
POST /auth/local/reset_pass         不更新密码，只返回成功
POST /topics/update                 做校验但不更新 topic
GET/POST /reply/:id(/edit)          Web 调用的 API 不存在
POST /reply/:reply_id/ups           不写 reply_ups，只返回 action
GET /topic/:id                      is_collect/is_uped/ups 是占位值
POST /user/refresh_token            返回 token 但不保存
messages/admin/replies              部分 PG boolean 谓词仍使用 0/1
```

## Decisions

### Decision: 在现有路由表面修复行为

保留 `nodeclub/api_router_v1.js` 定义的 legacy-compatible endpoint 名称，以及 `apps/web` 中已经存在的页面路由。本变更不重命名端点，也不引入新的 versioned API。

### Decision: 必要时使用 API 侧 PostgreSQL 兼容 helper

实现可以在 `apps/api/src/lib/*` 增加小型 helper，例如 `boolValue(true)` / `boolEq(column, true)`，避免在每个路由重复写 dialect 判断。helper 只放在 API package 内，不重设计 `packages/db` schema exports。

目标是让谓词和赋值同时兼容当前 PostgreSQL 验证路径，以及仍存在的 SQLite-compatible 代码路径，避免 `process.env.DB_DIALECT` 检查继续散落到各个 route。

### Decision: 收藏/点赞后使用话题详情 revalidate

话题页优先使用现有 React Router revalidation，而不是乐观更新。收藏计数和回复点赞依赖持久化行、重复点击和失败分支，revalidate 能在补齐后端行为时保持 UI 和数据库一致。

```text
用户操作
  │
  ▼
POST collect/de_collect 或 reply ups
  │
  ├─ success ─▶ toast ─▶ revalidate topic loader
  │
  └─ error ───▶ toast error，保留当前已加载状态
```

### Decision: 话题详情批量读取 reply up 状态

`GET /topic/:id` 应从 `reply_ups` 计算 `ups` 和 `is_uped`。为避免每条回复单独查询，应一次性按当前可见 reply ids 查询全部 up rows，再按 `reply_id` 分组。

### Decision: retrieve key 单次使用，密码重置窗口为 24 小时

注册激活和密码重置都应保存 `retrieve_key` 与 `retrieve_time`，按 key 找到用户，并在成功使用后清理 key。密码重置 key 默认 24 小时过期；如果实现时发现已有 legacy 常量，可复用该常量。

## Risks / Trade-offs

- 已归档 specs 中包含草稿、修订历史等更大的能力；本变更刻意只补齐当前编辑持久化，不引入这些大系统。
- 兼容 helper 可以减少重复 dialect 分支，但个别 Drizzle 谓词仍可能需要 raw `sql`。
- `de_collect` 必须只在真实删除 row 后递减计数，否则重复点击会造成计数漂移。
- 全局 typecheck 存在既有无关问题；验证应记录 targeted smoke 结果，以及更大范围命令的已知限制。

## Verification Strategy

- 在可用凭据下运行或扩展 API contract smoke，覆盖认证路径。
- 增加确定性的脚本覆盖或记录手动 smoke：激活/重置密码、话题更新、回复编辑、回复点赞/取消点赞、收藏/取消收藏、消息未读/标记已读、管理员状态切换。
- 对 boolean-sensitive 路径以 PostgreSQL-first runtime 为准，不以 SQLite 作为验收路径。
