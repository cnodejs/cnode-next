## Why

新站公开数据获取规则仍有与 legacy `nodeclub` 不一致的风险：`dev/test` 类内部话题、被 block 用户内容、以及被删除或不应公开的内容可能进入首页、最新回复、无人回复和用户页聚合。现在需要把公开查询规则收敛到统一的可见性约束，并把用户运营动作拆成 block 与 mute 两种语义，避免运营侧已经处理过的内容继续在公共入口曝光。

## What Changes

- 对齐 `nodeclub/controllers/topic.js`、`nodeclub/controllers/site.js` 和用户相关查询语义，明确首页 feed、sidebar 最新回复、无人回复等公共入口必须排除 `dev` / `test` 话题。
- 公共接口和 Web loader 必须排除被 block 用户创建的话题，以及这些话题关联的最新回复、无人回复和用户聚合入口。
- 用户管理动作提供 block/unblock 和 mute/unmute 两组独立操作：block 控制公开可见性，mute 控制新增发帖和回复能力。
- 用户主页增加 admin 可见的批量删除该用户帖子入口，复用现有后端管理员删除用户内容能力并写入审计日志。
- 扩展验证，覆盖 dev/test 过滤、block 用户内容过滤、mute 写入限制、用户页批量删帖和公开接口不可见性。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `api-contract`: 明确 `/api/v1/topics`、用户聚合和收藏等公共 API 的内容可见性过滤规则。
- `home-sidebar-information`: 明确首页 sidebar 最新回复和无人回复模块必须排除 dev/test、已删除、被 block 用户内容。
- `user-management`: 增加 block/mute 双状态用户管理和用户主页 admin 批量删除目标用户帖子/回复入口，并要求审计。
- `user-profile-experience`: 明确用户主页、用户话题、用户参与、用户收藏列表对不可公开内容的过滤规则。
- `content-lifecycle`: 明确公共查询必须隐藏已删除、内部 tab、被 block 用户内容，且回复聚合必须跟随所属话题可见性。

## Impact

- 影响 API：`apps/api/src/routes/topic.ts`、`apps/api/src/routes/community.ts`、`apps/api/src/routes/user.ts`、`apps/api/src/routes/collect.ts`、`apps/api/src/routes/admin.ts`、`apps/api/src/middleware/auth.ts`。
- 影响 DB：用户表需要能持久化 block 与 mute 两种状态；现有 `is_block` 数据必须兼容迁移，避免当前被禁用户恢复写入能力。
- 影响 Web：用户主页管理入口和首页/sidebar 数据展示。
- 影响验证：新增或扩展 API/Web smoke，覆盖 dev/test、block 用户、mute 用户和删除用户所有发言后的公开不可见性。

## Non-goals

- 不改变 legacy 数据迁移策略，不批量重写历史 `tab` 数据。
- 不新增新的角色或权限模型；block/mute 和用户页批量删除继续只允许 admin。
- 不把 `dev/test` 内容从数据库删除；本变更只要求公共查询隐藏，管理员后台仍可检索和处理。
