## Why

legacy `nodeclub` 在线上提供了管理员在用户、话题和回复上下文中直接执行封禁、删除、置顶和加精等运营动作的能力，新站目前这些动作分散在后台列表或部分缺失，导致管理员处理违规用户和内容时需要在多个页面之间来回跳转。现在需要补齐这些高频运营入口，让 cnode-next 能承接 legacy 站点的日常内容治理流程。

## What Changes

- 在用户页面为 admin 提供 block/unblock 用户操作，行为对齐 `nodeclub/controllers/user.js` 和 `nodeclub/controllers/sign.js` 中的禁言/用户状态管理意图。
- 在帖子详情页为 admin/mod 提供可见的管理操作入口，包括删除帖子、置顶/取消置顶、高亮/取消高亮。
- 在回复项上为 admin/mod 提供删除回复入口，删除后不再出现在帖子详情回复列表。
- 明确权限边界：mod 可以执行内容治理动作，admin 可以执行用户封禁/解禁和所有内容治理动作。
- 所有管理动作必须写入审计日志，便于追踪操作人、目标对象和操作结果。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `admin-dashboard`: 增加从前台用户页、帖子页和回复项发起管理动作的要求，并要求操作有反馈和审计记录。
- `user-management`: 增加 admin 在用户页面 block/unblock 用户的要求。
- `content-lifecycle`: 增加 admin/mod 在帖子页删除帖子和删除回复的要求，删除后公共列表与详情必须隐藏对应内容。
- `topic-pin-management`: 增加 admin/mod 在帖子详情页置顶/取消置顶和高亮/取消高亮的要求。
- `comment-reply-experience`: 增加回复级管理删除入口，确保回复删除后不会继续展示。

## Impact

- 影响 API：`apps/api/src/routes/admin.ts`、话题/回复管理相关路由和审计记录。
- 影响 Web：`apps/web/app/routes/user._name.tsx`、`apps/web/app/routes/topic._tid.tsx` 或相关组件中的管理按钮和状态反馈。
- 影响权限：复用现有 session、`adminRequired`、`modRequired` 和前端 `requireAdmin`/用户权限数据。
- 影响验证：需要新增或扩展 admin 操作验证脚本，覆盖用户封禁、帖子删除、回复删除、置顶和高亮。

## Non-goals

- 不引入新的角色体系或权限模型；继续使用现有 admin/mod 判断。
- 不迁移 legacy MongoDB 中已删除或已封禁的历史操作记录；只保证新站操作可用且可审计。
- 不实现复杂批量治理面板；本变更只补齐用户页、帖子页、回复项上的就地管理动作。
