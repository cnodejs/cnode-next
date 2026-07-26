## Why

当前 cnode-next 已完成核心数据迁移、主要 API 和主要页面，但验收标准已经明确为“完全替代 nodeclub 线上行为”。这意味着不能只验证首页、话题详情、登录、迁移对账等主路径，还必须覆盖 legacy `nodeclub/web_router.js`、`nodeclub/api_router_v1.js`、控制器副作用、公开 URL、SEO、限流、通知、分页和兼容跳转。

归档后的 OpenSpec 主规格也暴露了若干未闭环项：GitHub OAuth 关联老账号、邮件通知、限流挂载、回复删除积分、消息自动已读、分页与公开页面入口。因此需要一个收口 change，把剩余差距按线上替代验收一次性定义清楚。

## What Changes

- 补齐 legacy 公开 URL 和兼容跳转：`/stars`、`/users/top100`、`/app/download`、`/robots.txt`、生产环境 `/:name -> /user/:name`。
- 补齐用户相关分页语义：用户话题、用户参与、收藏列表、首页总页数。
- 补齐内容生命周期副作用：回复删除、回复删除扣分、计数器修正、话题 reply_count 修正。
- 补齐 GitHub OAuth 两段式流程：无关联 GitHub 用户必须可注册新账号或绑定老账号。
- 将 Redis 限流真正挂到注册、发帖、回帖路由，并返回兼容 headers 和错误格式。
- 将站内消息、邮件通知、消息已读行为与规格闭环。
- 明确 API `mdrender=true` 必须真实执行 linkUsers + Markdown 渲染。
- 建立 nodeclub online replacement 验收矩阵，覆盖 URL、API、业务副作用和生产 smoke。

## Capabilities

### New Capabilities

- `web-url-parity`：定义 legacy 公开 Web URL 和兼容跳转要求。
- `production-ops`：定义线上替代前必须通过的 smoke/parity 验收矩阵。

### Modified Capabilities

- `auth`：收口 GitHub OAuth 新用户注册/绑定老账号流程。
- `api-contract`：补齐 mdrender、分页、API 行为兼容要求。
- `content-lifecycle`：补齐回复删除及其积分/计数副作用。
- `messaging`：补齐邮件通知、消息自动已读、Header 未读状态刷新。
- `rate-limiting`：要求限流中间件实际挂载到 legacy 等价入口。
- `user-profile-experience`：要求用户话题、参与、收藏列表支持 legacy 等价分页。

## Non-goals

- 不切换真实线上流量，不修改旧站 `nodeclub` 部署。
- 不新增与 nodeclub 无关的新社区功能。
- 不实现已明确延期的 CI、release gate、GitHub Actions 镜像发布。
- 不迁移 nodeclub 从未上线或从未实现的 `follow` 消息类型。
- 不改变已验证通过的 MongoDB 到 PostgreSQL 数据映射策略，除非发现阻塞线上行为替代的数据缺陷。
