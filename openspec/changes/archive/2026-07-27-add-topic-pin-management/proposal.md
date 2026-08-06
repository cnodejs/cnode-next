## Why

当前新版本已有话题 `top` 字段、列表置顶徽标和后台话题列表基础操作，但置顶管理没有形成清晰的 Web 操作闭环，且现有后台话题接口使用 `adminRequired`，不符合线上运营中 `mod` 和 `admin` 都可处理置顶的权限边界。legacy nodeclub 通过 `nodeclub/web_router.js` 的 `POST /topic/:tid/top` 和 `nodeclub/controllers/topic.js` 的 `topic.top` 字段支持话题置顶/取消置顶，新版本需要补齐等价的管理体验。

## What Changes

- 在后台话题管理中明确支持单个和批量置顶/取消置顶操作。
- 将置顶管理权限调整为 `mod` 和 `admin` 均可操作，非管理用户不可访问。
- 保持与 legacy nodeclub 一致的布尔翻转行为：已置顶话题执行操作后取消置顶，未置顶话题执行操作后置顶。
- 操作成功后后台列表刷新并显示最新置顶状态，公开话题列表继续优先展示置顶话题并显示“置顶”标记。
- 置顶操作不改变话题作者积分、回复数、浏览数、发布时间或 `last_reply_at`。

## Capabilities

### New Capabilities

- `topic-pin-management`: 管理员和版主在后台对话题执行置顶/取消置顶，并保证公开列表排序和状态展示与 legacy 行为一致。

### Modified Capabilities

- `admin-dashboard`: 后台话题管理页的运营操作权限从仅 admin 扩展为 mod 和 admin 可执行置顶管理。

## Non-goals

- 不引入按板块置顶、定时置顶、置顶有效期或置顶排序权重；legacy nodeclub 仅使用单一 `top` 布尔字段。
- 不迁移旧站前台话题详情页中的所有管理按钮样式，只保证新后台管理页可完成置顶操作。
- 不改变加精、锁定、隐藏、删除等其他运营动作的权限边界，除非实现时发现它们与置顶共享同一接口且必须拆分。

## Impact

- API: `apps/api/src/routes/admin.ts` 中话题置顶相关路由需要允许 `modRequired()` 或等价的 `mod/admin` 权限。
- Web: `apps/web/app/routes/admin/topics.tsx` 需要让 mod/admin 能看到并执行置顶/取消置顶，提供明确状态反馈。
- 数据库: 复用 `packages/db/src/schema/topic.ts` 中现有 `topics.top` 字段，不新增表或字段。
- Legacy reference: 对齐 `nodeclub/web_router.js` 的 `POST /topic/:tid/top`、`nodeclub/controllers/topic.js` 的置顶翻转行为，以及 `nodeclub/controllers/site.js` 的 `sort: '-top -last_reply_at'` 列表排序。
