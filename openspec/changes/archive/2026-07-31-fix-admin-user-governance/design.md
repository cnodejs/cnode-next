## Context

见 `proposal.md`。当前 `/admin/users` 的 loader 已经按 `q` 请求 API，但页面把首屏 `initialUsers` 固定到本地 state，导致 React Router v7 重新运行 loader 后表格仍渲染旧数组。`/admin/bans` 当前只读取 `is_block=true` 用户，却展示为“禁言”，并调用 `/user/:name/unblock` 做单个恢复内容可见。

现有业务规则已把 `block` 和 `mute` 拆开：`block` 控制历史内容公共可见性，`mute` 控制新增话题和回复能力。legacy `../nodeclub/controllers/user.js`、`../nodeclub/web_router.js` 的单用户治理动作是业务参照，但新站不继续沿用混合文案。

## Goals / Non-Goals

**Goals:**

- 修复 `/admin/users` 搜索、翻页和 mutation 后列表数据滞留。
- 在 `/admin/bans` 中清楚展示 `mute` 与 `block` 两类用户治理状态。
- 提供 admin-only 批量 `unmute` 和批量 `unblock`，并保留审计与自操作保护。
- 保持 PostgreSQL-only 和现有布尔字段语义。

**Non-Goals:**

- 不设计新的处罚状态、处罚到期模型或风控策略。
- 不批量操作 IP 封禁。
- 不改变公开内容过滤逻辑、发帖限制逻辑或删除内容生命周期。

## Decisions

### 1. 用户管理列表直接使用 loaderData

决策：`/admin/users` 表格数据直接来自 `loaderData.users`，删除只初始化一次的列表 state。需要客户端状态的只有弹窗目标、pending 状态等交互态。

替代方案：用 `useEffect` 在 `loaderData` 变化时同步 state。拒绝原因是列表没有本地编辑需求，同步 state 增加双数据源和遗漏风险。

```mermaid
flowchart LR
  A[提交搜索表单] --> B[URL q/page 更新]
  B --> C[React Router loader 重新运行]
  C --> D[loaderData.users 更新]
  D --> E[Table 直接渲染 loaderData.users]
```

### 2. 批量接口按用户 ID 列表提交

决策：新增 admin-only 批量治理接口，body 使用 `ids: number[]`，action 只允许 `unmute` 和 `unblock`。实现可采用一个路由如 `POST /api/v1/admin/users/bulk-governance`，也可采用两个显式路由；无论路由形式如何，行为必须保持同一契约。

替代方案：复用现有 `/user/:name/unmute` 和 `/user/:name/unblock` 在前端循环调用。拒绝原因是多个请求难以形成统一审计、部分失败反馈和 pending 状态，也会放大网络失败面。

| Action    | 更新字段         | 不改变字段               | 审计动作            |
| --------- | ---------------- | ------------------------ | ------------------- |
| `unmute`  | `is_muted=false` | `is_block`、内容删除状态 | `bulk_unmute_user`  |
| `unblock` | `is_block=false` | `is_muted`、内容删除状态 | `bulk_unblock_user` |

### 3. 批量操作跳过当前登录用户并返回 skipped

决策：批量接口必须识别当前 admin，自操作目标不得更新。响应返回成功数量、处理 ID、跳过 ID 或失败项，前端据此显示 toast。

替代方案：只要包含当前用户就整体拒绝。拒绝原因是运营批量处理时可能误选自己，跳过并明确反馈能减少重新选择成本；但实现时如果团队倾向更严格，也可整体拒绝，只要满足 spec 的“跳过或拒绝”并保持当前账号状态不变。

### 4. 封禁管理按语义分区或筛选，不混用文案

决策：`/admin/bans` 的用户区域应能分别处理 `is_muted=true` 和 `is_block=true`。最小实现可以在同一个“用户治理”tab 下展示两个 panel：禁言用户、内容已屏蔽用户；也可以用子 tab 或状态筛选。关键是数据源、按钮和 badge 文案不得把 block 当禁言。

```mermaid
flowchart TD
  A[/admin/bans 用户治理] --> B[禁言用户 is_muted=true]
  A --> C[内容已屏蔽用户 is_block=true]
  B --> D[单个/批量解除禁言 -> is_muted=false]
  C --> E[单个/批量恢复内容可见 -> is_block=false]
```

### 5. 保持现有审计体系，不新增审计表

决策：批量操作沿用 `auditQueries.log` 和 `auditEventMeta` 分类，target type 可使用 `user` 或 `users`，detail 记录 action、ids、processed、skipped。审计动作应纳入用户治理 category 和 medium risk。

替代方案：为每个用户逐条写审计日志。拒绝原因是批量操作可能产生噪音；可以在 detail 中记录完整目标，必要时后续再扩展逐项审计。

## Database Change Audit

- PostgreSQL schema: 无新增表、字段、索引或约束。
- Drizzle migration: 不需要。
- Seed/bootstrap: 不需要。
- Field semantics: 继续使用现有 `users.is_muted` 和 `users.is_block`；本 change 只澄清 UI 与批量写入行为，不改变字段含义。
- Backfill/data repair: 不需要。

## Risks / Trade-offs

- [Risk] 同时处于 `is_muted` 和 `is_block` 的用户可能出现在两个列表中 → Mitigation: UI 文案明确两个状态独立，批量操作只改变目标字段。
- [Risk] 批量操作部分成功导致管理员误判 → Mitigation: API 返回 processed/skipped，toast 显示处理数量，操作后 `revalidate()`。
- [Risk] 当前封禁页已有分页只带一个 page 参数，两个用户列表并存时分页上下文可能互相影响 → Mitigation: 初版可分别使用 tab/status 筛选或保留当前页单一列表；若并列展示两个列表，应使用独立 query 参数。
- [Risk] `LIKE` 搜索大小写敏感可能影响 PostgreSQL 下的搜索体验 → Mitigation: 本 change 先修搜索结果不刷新的主因；如需大小写不敏感，可在实现中使用 `ilike`，但不改变搜索字段范围。

## Migration Plan

1. 先发布 API 批量接口和审计动作，保持现有单用户接口可用。
2. 再发布 Web 调整，用户搜索直接渲染 loader 数据，封禁管理接入新批量接口。
3. 回滚时 Web 可退回单用户操作；API 新增接口无数据库迁移，保留不影响旧页面。
