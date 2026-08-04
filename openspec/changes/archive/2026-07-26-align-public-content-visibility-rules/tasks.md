## 1. 公开可见性规则梳理

- [x] 1.1 梳理 `apps/api/src/routes/topic.ts`、`community.ts`、`user.ts`、`collect.ts` 中所有公开话题和回复聚合查询。
- [x] 1.2 对照 `nodeclub/api/v1/topic.js`、`nodeclub/controllers/site.js`、`nodeclub/controllers/user.js`，确认 legacy 首页、API、用户页和 sidebar 的公开过滤意图。
- [x] 1.3 定义 cnode-next 统一公开可见性条件：非删除、非 `dev/test`、作者未 block，回复聚合必须要求所属话题可见；确认 mute 不参与公开隐藏规则。

## 2. 用户 block/mute 状态

- [x] 2.1 设计并实现用户 block/mute 双状态持久化，推荐保留 `is_block` 表示 block 并新增 `is_muted` 表示 mute。
- [x] 2.2 增加数据库迁移或兼容逻辑，确保现有 `is_block=true` 用户同时被视为 muted，避免恢复发帖/回复能力。
- [x] 2.3 更新 `userRequired`、发帖和回复写入路径，使 mute 用户无法新增话题或回复。
- [x] 2.4 更新 admin API，提供 block/unblock 和 mute/unmute 两组独立接口，均要求 admin 权限并写审计日志。
- [x] 2.5 更新用户详情、管理员用户列表和用户页 loader，返回 block 与 mute 两种状态。

## 3. API 查询过滤

- [x] 3.1 更新 `topicQueries.getByQuery()` 或调用方条件，使 `/api/v1/topics` 对 `tab=all` 和指定公开 tab 均排除 dev/test、已删除和 block 作者话题，但不因 mute 隐藏。
- [x] 3.2 更新 `/api/v1/sidebar/home` 最新回复查询，排除已删除回复、所属话题 dev/test、所属话题已删除、所属话题作者已 block。
- [x] 3.3 更新 `/api/v1/sidebar/home` 无人回复查询，排除 dev/test、已删除和 block 作者话题。
- [x] 3.4 更新用户主页 `recent_topics`、`recent_replies`、`/topics`、`/replies`、`/collections` 查询，使 data 和 total 使用相同公开过滤条件。
- [x] 3.5 更新 `/api/v1/topic_collect/:loginname` 和收藏/取消收藏写入前检查，避免返回或操作不可公开话题。
- [x] 3.6 确认话题详情和回复详情不会让已删除或不可公开话题被普通用户访问。

## 4. 用户页管理员操作入口

- [x] 4.1 在 `apps/web/app/routes/user.$name.tsx` 添加 admin 可见的 block/unblock 和 mute/unmute 独立入口。
- [x] 4.2 确认 block 与 mute 使用不同文案：block 表示隐藏帖子，mute 表示禁止新增发帖/回复。
- [x] 4.3 确认 `/api/v1/user/:name/delete_all` 仅 admin 可调用，删除话题同时写 `deleted=true` 和 `status='deleted'`，删除回复写 `deleted=true`，并写入审计。
- [x] 4.4 在用户页添加 admin 可见的“删除该用户所有发言”入口。
- [x] 4.5 所有 destructive 或限制类操作使用应用内 Dialog 确认，不使用 `window.confirm()`。
- [x] 4.6 操作成功后 toast 反馈并 revalidate 用户页，失败时显示后端错误。

## 5. 验证脚本与回归

- [x] 5.1 新增或扩展验证脚本，静态检查公开查询包含 dev/test、deleted、block 作者过滤且不使用 mute 过滤公开内容。
- [x] 5.2 增加 API smoke，确认 `/api/v1/topics`、`/api/v1/sidebar/home`、用户话题、用户参与、用户收藏不会返回 dev/test 或 block 作者话题。
- [x] 5.3 增加写入限制验证，确认 mute 用户不能新增话题或回复，block-only 用户是否能写入按设计结果固定并覆盖测试。
- [x] 5.4 增加用户页管理入口验证，确认 admin 可见 block/mute/delete-all，普通用户不可见，并且调用 admin API。
- [x] 5.5 运行 `pnpm typecheck` 并确认通过。
- [x] 5.6 运行相关 verify 脚本和线上 API/Web smoke 并确认通过。

## 6. 部署检查

- [x] 6.1 部署 API/Web/Worker，确保 worker 使用同一版本的 API 镜像。
- [x] 6.2 生产检查首页 feed、最新回复、无人回复不展示 dev/test 或 block 作者话题。
- [x] 6.3 生产检查 admin 用户页可以看到 block、mute、删除用户发言入口但不执行 destructive 操作，除非明确指定测试用户。
