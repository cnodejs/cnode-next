## 1. 用户搜索修复

- [x] 1.1 调整 `apps/web/app/routes/admin/users.tsx`，移除用户列表的本地 `useState(initialUsers)` 滞留，表格和描述直接使用当前 `loaderData.users`。
- [x] 1.2 确认 `/admin/users` 搜索提交、分页和用户管理 mutation 后 `revalidate()` 都保留当前 `q` 查询上下文。
- [x] 1.3 将 `packages/shared/src/schemas/admin.ts` 中后台用户查询契约与实际 `q` 参数对齐，避免 `search` 与 `q` 双命名。

## 2. 批量用户治理 API

- [x] 2.1 在 shared schema 中新增批量用户治理请求体校验，限定 `ids` 为正整数数组，action 只允许 `unmute` 和 `unblock` 或使用两个等价显式 schema。
- [x] 2.2 在 `apps/api/src/routes/admin.ts` 新增 admin-only 批量解除禁言和批量恢复内容可见接口，使用 PostgreSQL boolean-compatible 写入。
- [x] 2.3 批量接口必须跳过或拒绝当前登录 admin，保持自操作目标状态不变，并在响应中返回 processed/skipped 信息。
- [x] 2.4 批量解除禁言只更新 `is_muted=false`，不得修改 `is_block` 或内容删除状态。
- [x] 2.5 批量恢复内容可见只更新 `is_block=false`，不得修改 `is_muted` 或内容删除状态。
- [x] 2.6 为批量操作写入审计日志，并将批量审计动作纳入 `auditEventMeta` 的用户治理分类和风险等级。

## 3. 封禁管理 UI

- [x] 3.1 调整 `/admin/bans` 的用户治理数据加载，使页面能分别获得禁言用户和内容已屏蔽用户，或通过状态筛选明确区分两类状态。
- [x] 3.2 将页面文案从混用“禁言/解禁”改为按语义展示“解除禁言”和“恢复内容可见”。
- [x] 3.3 为禁言用户列表增加多选和批量解除禁言入口，成功后 toast 展示处理数量并 `revalidate()`。
- [x] 3.4 为内容已屏蔽用户列表增加多选和批量恢复内容可见入口，成功后 toast 展示处理数量并 `revalidate()`。
- [x] 3.5 批量操作后保留当前 tab、分页和筛选上下文；若两个列表并列展示，避免分页参数互相污染。

## 4. 测试与验证

- [x] 4.1 增加或更新 API 测试，覆盖批量 `unmute`、批量 `unblock`、字段互不影响、自操作保护和审计日志写入。
- [x] 4.2 增加或更新 Web 测试，覆盖 `/admin/users` 搜索后列表随 loader 数据更新。
- [x] 4.3 增加或更新 Web 测试，覆盖 `/admin/bans` 中批量解除禁言和批量恢复内容可见的按钮状态、请求体和刷新行为。
- [x] 4.4 运行相关测试，至少覆盖 admin API 测试和 admin web route/component 测试。
- [x] 4.5 运行 `pnpm lint` 和 `pnpm typecheck`；如时间允许运行 `pnpm test`。

## 5. 文档和收尾

- [x] 5.1 同步 `wiki/business-rules.md`，补充封禁管理页提供单个和批量解除禁言、恢复内容可见的说明。
- [x] 5.2 确认 `design.md` 中 Database Change Audit 仍成立：无 Drizzle schema 或 migration 变更。
- [x] 5.3 运行 `openspec validate fix-admin-user-governance --type change --strict` 并修复所有校验问题。
