## 1. PostgreSQL 兼容

- [x] 1.1 识别 API 中仍使用 SQLite 风格 `0` / `1` 读写 PostgreSQL boolean 列的谓词和赋值。
- [x] 1.2 增加一个 API 侧 boolean 兼容 helper，减少重复 dialect 判断。
- [x] 1.3 修复 `messages.has_read` 的已读/未读查询和标记已读更新。
- [x] 1.4 修复 `replies.deleted` 的回复列表过滤。
- [x] 1.5 修复 admin 话题/用户操作中的 `topics.top`、`topics.good`、`topics.lock`、`topics.deleted`、`replies.deleted`、`users.is_block`。

## 2. 账号与 Token 流程

- [x] 2.1 本地注册时，在发送激活邮件前持久化 `retrieve_key` 和 `retrieve_time`。
- [x] 2.2 实现 `active_account`：根据 retrieve key 找到用户、激活账号并清理 key。
- [x] 2.3 `search_pass` 中持久化密码重置 key/time。
- [x] 2.4 `reset_pass` 中校验 key 时效、更新 bcrypt 密码 hash 并清理 key。
- [x] 2.5 `/api/v1/user/refresh_token` 持久化新的 access token。

## 3. 话题与回复编辑

- [x] 3.1 `/api/v1/topics/update` 在校验和权限检查后持久化 `title`、`tab`、`content`、`update_at`。
- [x] 3.2 为已有回复编辑页增加 `GET /api/v1/reply/:id`。
- [x] 3.3 增加 `POST /api/v1/reply/:id/edit`，包含作者/admin 权限检查和内容校验。
- [x] 3.4 在编辑路由中明确保留 locked/deleted topic 的当前行为。

## 4. 收藏与回复点赞状态

- [x] 4.1 `GET /api/v1/topic/:id` 根据当前 cookie 或 `accesstoken` 用户返回真实 `is_collect`。
- [x] 4.2 `de_collect` 只在真实删除收藏 row 后递减计数。
- [x] 4.3 将 `/api/v1/reply/:reply_id/ups` 实现为基于 `reply_ups` 的幂等 toggle。
- [x] 4.4 `GET /api/v1/topic/:id` 返回每条回复的 `ups` 用户 id 列表和 `is_uped` 状态。
- [x] 4.5 更新 `topic.$tid.tsx`，展示收藏/取消收藏状态，并在成功后 revalidate。
- [x] 4.6 更新 `ReplyItem`，展示回复点赞数量/状态，并调用点赞/取消点赞 API。

## 5. 验证

- [x] 5.1 扩展 `verify:api-contract` 或增加聚焦认证 smoke，覆盖修复后的写入/状态路径。
- [x] 5.2 验证 PostgreSQL 下 message count/list/mark-read 行为。
- [x] 5.3 验证现有 Web 路由中的 topic update 和 reply edit。
- [x] 5.4 验证话题详情页中的 collect/de-collect 和 reply up/down。
- [x] 5.5 运行 targeted typecheck 或记录完整 `pnpm typecheck` 的既有无关 blocker。`@cnode/web` typecheck 通过；`@cnode/api` typecheck 仍被本变更之外既有 module-resolution/export 错误阻塞。
