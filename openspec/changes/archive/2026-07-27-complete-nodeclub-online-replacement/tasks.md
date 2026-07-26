## 1. URL parity

- [x] 1.1 对照 `nodeclub/web_router.js` 生成 legacy Web URL 清单，并标记实现、redirect、显式废弃三种状态。
- [x] 1.2 实现 `/stars` 达人列表页面和所需 API/query。
- [x] 1.3 实现 `/users/top100` 积分榜页面和所需 API/query。
- [x] 1.4 实现 `/app/download` 到 legacy 目标地址的兼容跳转。
- [x] 1.5 实现 `/robots.txt` 文本响应。
- [x] 1.6 实现生产环境 `/:name -> /user/:name` 兼容跳转，并避免覆盖已有一级路由。

## 2. Pagination parity

- [x] 2.1 让 `GET /api/v1/topics` 或 Web loader 能获取符合 legacy 查询条件的总数。
- [x] 2.2 修复首页分页 total/pages，不能使用当前页长度代替总数。
- [x] 2.3 为 `/user/:name/topics` 提供独立分页数据，而不是 profile recent topics。
- [x] 2.4 为 `/user/:name/replies` 提供独立分页数据，而不是 profile recent replies。
- [x] 2.5 为 `/user/:name/collections` 提供分页数据，并保持收藏顺序。

## 3. API and content lifecycle parity

- [x] 3.1 实现回复删除 API/Web 行为，作者或管理员可删除回复。
- [x] 3.2 删除回复后设置 `replies.deleted=true`，作者 score -5、reply_count -1。
- [x] 3.3 删除回复后维护话题 reply_count，避免出现负数。
- [x] 3.4 实现 `mdrender=true` 的真实 linkUsers + Markdown 渲染，`mdrender=false` 返回原文。
- [x] 3.5 对 topic/reply/message content 的 mdrender 行为补充 contract smoke。

## 4. Auth parity

- [x] 4.1 GitHub callback 找不到 `github_id` 时进入 pending profile 流程，而不是直接创建或直接失败。
- [x] 4.2 实现 `/auth/github/new` 选择页，支持“注册新账号”和“关联老账号”。
- [x] 4.3 实现关联老账号提交逻辑，校验 loginname/password 后绑定 GitHub 字段并设 session。
- [x] 4.4 GitHub 无可用 email 时展示清晰错误页，提示用户去 GitHub 设置公开或主邮箱。

## 5. Rate limit and ban parity

- [x] 5.1 将 `perUserPerDay('create_topic')` 挂到创建话题 API/Web 写入路径。
- [x] 5.2 将 `perUserPerDay('create_reply')` 挂到创建回复 API/Web 写入路径。
- [x] 5.3 将 `perIpPerDay('create_user_per_ip')` 挂到本地注册和 GitHub 新用户创建路径。
- [x] 5.4 确认 Redis key、TTL、headers、错误响应与 `nodeclub/middlewares/limit.js` 对齐。
- [x] 5.5 将 IP ban 检查接入请求入口，命中封禁时阻止写入行为。

## 6. Messaging and mail parity

- [x] 6.1 回复话题时，在站内 `reply` 消息之外按 `receive_reply_mail` 发送邮件。
- [x] 6.2 @提及时，在站内 `at` 消息之外按 `receive_at_mail` 发送邮件。
- [x] 6.3 同一回复中同一接收人只发送一条站内消息和一封邮件。
- [x] 6.4 访问 `/my/messages` 后保留本次未读分组展示，同时自动将这些消息标记为已读。
- [x] 6.5 Header 未读 badge 在访问消息页或标记已读后刷新为真实未读数。
- [x] 6.6 过滤作者或话题失效的 message，避免 Web 显示无效消息。

## 7. Verification

- [x] 7.1 新增或扩展 URL parity smoke，覆盖 legacy Web URL 清单。
- [x] 7.2 新增 API contract smoke，覆盖 mdrender、分页、回复删除、OAuth 关联、限流错误格式。
- [x] 7.3 新增 authenticated write smoke，验证积分、计数器、收藏、点赞、消息已读均可恢复。
- [x] 7.4 在 rehearsal PostgreSQL/Redis 上跑完整 smoke，并保存不含 secrets 的结果摘要。
- [x] 7.5 更新 OpenSpec 主规格并通过 `openspec validate complete-nodeclub-online-replacement --strict`。
