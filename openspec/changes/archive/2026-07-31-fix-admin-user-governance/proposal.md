## Why

管理后台用户管理页当前搜索提交后列表不随 `loaderData` 更新，管理员无法可靠定位用户；封禁管理页又把 `block` 表达成“禁言”，且只支持逐个恢复内容可见，缺少批量解除禁言和批量恢复内容可见入口。legacy `../nodeclub/controllers/user.js` 与 `../nodeclub/web_router.js` 提供管理员按用户执行 block/unblock 等治理动作，新站已经拆分 `block` 和 `mute` 语义后，后台列表必须按新语义稳定承接日常运营。

## What Changes

- 修复 `/admin/users` 搜索结果渲染，使 `q` 查询、分页和 `revalidate()` 后的用户列表始终来自最新 `loaderData`。
- 调整 `/admin/bans` 用户治理视图，明确区分“禁言用户”和“内容已屏蔽用户”，避免把 `is_block` 展示为禁言。
- 新增批量解除禁言能力，管理员可选择多个 `is_muted=true` 用户并一次性取消 `is_muted`。
- 新增批量恢复内容可见能力，管理员可选择多个 `is_block=true` 用户并一次性取消 `is_block`。
- 批量操作必须保留 admin 权限校验、自操作保护、审计日志和操作完成后的局部刷新。
- 不引入新的用户处罚状态，不改变发帖、回复、公开列表过滤的既有规则。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `user-management`: 明确后台用户搜索必须随查询参数生效，并补充批量解除禁言、批量恢复内容可见的用户治理要求。
- `admin-dashboard`: 明确封禁管理列表必须区分 `block` 与 `mute`，并在批量操作后保留分页或筛选上下文。

## Scope

- In scope: `apps/web/app/routes/admin/users.tsx`、`apps/web/app/routes/admin/bans.tsx`、`apps/api/src/routes/admin.ts`、`packages/shared/src/schemas/admin.ts` 中与用户搜索、用户治理列表和批量用户状态更新相关的行为。
- Out of scope: IP 封禁批量操作、用户处罚等级重设计、自动风控策略、历史数据迁移、公开用户页管理入口改版。
- Affected systems: Web 管理后台、API 管理路由、共享 Zod 契约、审计日志。
- High-risk categories: 用户治理状态写入、管理员自操作保护、审计日志完整性。

## Non-goals

- 不恢复 legacy 中把 `is_block` 单独当作禁言的旧文案；新站继续遵守 `block` 控制内容可见、`mute` 控制新增内容能力的拆分语义。
- 不新增 SQLite 或其他数据库兼容路径；运行时仍只面向 PostgreSQL。
- 不批量删除用户内容，也不改变删除所有发言的二次确认要求。

## Impact

- API: 需要新增或扩展 admin-only 批量用户治理接口，输入建议使用用户 ID 列表，输出处理数量和跳过项。
- Web: `/admin/users` 去除列表 state 滞留；`/admin/bans` 增加多选、批量按钮、状态分区或筛选和成功后的 `revalidate()`。
- Shared: 管理后台用户查询 schema 需要与实际 `q` 参数保持一致；批量治理请求体需要 Zod schema。
- Tests: 需要覆盖用户搜索渲染、批量 unmute/unblock API、自操作保护、审计日志和前端批量操作状态。

## Documentation Impact

- `wiki/business-rules.md` 已说明 `block` 与 `mute` 不得混用；实现后可补充封禁管理页批量操作说明。
- 如 API 文档由 OpenAPI 或测试生成，需同步包含新增批量接口；无需新增独立 docs 页面。
