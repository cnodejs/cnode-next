## Why

`rewrite-to-cnode-next` 已完成 CNode 主体页面、API 和数据迁移，并进入 PostgreSQL-first 运行验证阶段。但归档后检查发现，部分 legacy 社区流程仍只是路由壳或沿用了 SQLite 时代的 `0/1` 布尔假设。账号激活、密码重置、话题/回复编辑、回复点赞、消息已读、收藏状态等核心写入路径必须在 PostgreSQL 上真实持久化，才能认为已从 `nodeclub/api_router_v1.js` 和 `nodeclub/api/v1/*` 控制器完成业务迁移。

## What Changes

- 完成消息、回复、话题、管理员用户/话题操作中的 PostgreSQL boolean 兼容。
- 持久化本地账号注册激活和密码找回所需的 retrieve key 生命周期。
- 让 `/api/v1/topics/update`、回复编辑路由、`/api/v1/user/refresh_token` 真正执行其成功响应声明的状态变更。
- 让回复点赞/取消点赞使用迁移后的 `reply_ups` 表，并在话题详情返回 `ups` / `is_uped`。
- 让话题详情返回真实 `is_collect`，并让 Web 话题页支持收藏/取消收藏和回复点赞/取消点赞。
- 扩展这些迁移写入/状态路径的 smoke/contract 验证。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `postgres-first-dev-runtime`：要求 API 读写路径使用 PostgreSQL boolean 兼容的值和谓词。
- `auth`：补齐 retrieve-key 激活、密码重置和 access token 刷新持久化。
- `api-contract`：让 legacy-compatible 端点持久化并返回迁移后的真实状态，尤其是话题详情、回复点赞、话题更新、消息和 token 刷新。
- `content-lifecycle`：补齐现有 Web 路由依赖的话题和回复编辑行为。
- `messaging`：确保消息已读/未读 API 在 PostgreSQL boolean 列上正确工作。
- `user-management`：确保管理员用户/话题状态操作写入 PostgreSQL 兼容状态并维护计数。
- `topic-detail-experience`：在话题详情页展示并切换真实收藏状态。
- `comment-reply-experience`：在话题详情页展示并切换回复点赞状态。

## Non-goals

- 不修改 Markdown 编辑器、预览模式、粘贴/拖拽上传，也不介入 active change `implement-web-editor-preview-upload`。
- 不新增完整 CI/release gate 或大规模测试框架迁移。
- 不实现更深层的巡检任务、内容修订表、草稿自动保存或历史资源迁移。
- 不改变 legacy 公共 URL 迁移策略，也不重做 Mongo-to-PostgreSQL 迁移映射。

## Impact

- API routes：`apps/api/src/routes/auth.ts`、`topic.ts`、`reply.ts`、`message.ts`、`user.ts`、`collect.ts`、`admin.ts`。
- API data helpers：`apps/api/src/lib/db.ts`、`apps/api/src/lib/message.ts`，以及 PostgreSQL boolean 兼容 helper。
- Web routes：`apps/web/app/routes/topic.$tid.tsx` 和已有 `reply.$id.edit.tsx` 集成。
- Verification：扩展 `scripts/verify-api-contract.ts`，或新增针对认证写入/状态路径的 smoke 脚本。
