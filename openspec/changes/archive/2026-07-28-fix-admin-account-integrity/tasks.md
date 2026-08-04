## 1. 账号与邮件闭环

- [x] 1.1 将 `sendActiveMail` 和 `sendResetPassMail` 的用户点击链接改为使用 `APP_WEB_BASE_URL`，并补充 `.env.example`/部署文档说明。
- [x] 1.2 调整生产邮件发送语义：非 development 缺少 SMTP 或关键账号邮件发送失败时不得返回“邮件已发送”假成功。
- [x] 1.3 在 `/signin` 增加 `/search_pass` 找回密码入口，并保留 GitHub 登录入口。
- [x] 1.4 在 GitHub OAuth 发起和 callback 中持久化并校验 `state`，缺失或不匹配时拒绝登录/绑定。
- [x] 1.5 为 GitHub OAuth 增加 `intent=login|bind` 语义，保持现有登录/注册/关联老账号流程不回退。
- [x] 1.6 在 `/setting` 展示只读邮箱、GitHub 绑定状态和绑定入口。
- [x] 1.7 实现已登录用户从 `/setting` 绑定 GitHub 到当前账号，拒绝绑定已属于其他用户的 GitHub id。
- [x] 1.8 修复 `/setting` 通知说明卡片 body padding，并避免 profile submit 发送整包 user。

## 2. 管理员自操作保护

- [x] 2.1 在 block/unblock/mute/unmute/delete_all 等后端用户管理接口中检测目标用户是否为当前 admin，限制高风险自操作。
- [x] 2.2 在后台用户列表和用户主页隐藏或禁用当前 admin 自己的 block、mute、delete_all 操作入口。
- [x] 2.3 为自操作保护补充验证脚本或测试，确认直接调用 API 也会失败且状态不变。

## 3. 系统设置真实生效

- [x] 3.1 调整 `/admin/settings` loader 从 API 读取已保存配置，不再使用硬编码初始值。
- [x] 3.2 让 `allow_signup` 同时作用于 `/signup` 页面和 `POST /api/v1/auth/local/signup`。
- [x] 3.3 让 `new_user_min_hours` 和 `new_user_min_replies` 在创建话题路径生效，并返回明确错误提示。
- [x] 3.4 让 `rate_topic` 和 `rate_reply` 被发帖/回复限流中间件读取，配置缺失时使用安全默认值。
- [x] 3.5 对尚无业务读取点的设置项隐藏、禁用或明确标记未接入，避免保存成功假象。
- [x] 3.6 修复管理概览 `pendingReports` 等硬编码指标，未接入的趋势图、自动封禁数或最近审计模块不得伪装为真实数据。

## 4. 举报系统闭环

- [x] 4.1 在话题详情和回复项提供登录用户举报入口，支持举报类型和可选描述。
- [x] 4.2 完善举报创建 API 校验，确保 targetType/targetId 有效且目标存在。
- [x] 4.3 调整 `/admin/reports` API 返回后台需要的 DTO：目标类型、目标 ID、所属话题 ID、标题摘要、举报人数、描述、状态。
- [x] 4.4 修复 `/admin/reports` 页面字段对不上、空标题、`/topic/undefined` 和固定 `0 人举报` 问题。
- [x] 4.5 确认举报处理会更新状态并写入审计日志。

## 5. IP 封禁闭环

- [x] 5.1 接入 `/admin/bans` 的 IP/CIDR 新增表单和移除按钮，显示成功/失败反馈并刷新列表。
- [x] 5.2 在后端校验 IP/CIDR 格式，拒绝无效规则。
- [x] 5.3 在 IP ban middleware 中支持单 IP 精确匹配和 CIDR 网段匹配。
- [x] 5.4 验证新增、命中、移除 IP/CIDR 规则的完整行为。

## 6. 反垃圾 Spec 对齐

- [x] 6.1 落地新用户发帖限制，确保 spec 中对应 MUST 有真实实现。
- [x] 6.2 实现敏感词 `hit_count` 真实更新，或从 `/admin/keywords` 隐藏/标记该指标未接入。
- [x] 6.3 接入 Cloudflare Turnstile 前端 widget 和后端 siteverify，覆盖注册、找回密码、新用户发帖和高频写入风险场景。
- [x] 6.4 实现举报阈值自动隐藏，确保同一目标达到配置阈值后从公共入口隐藏并写入审计日志。
- [x] 6.5 实现渐进封禁状态和处罚逻辑：警告、临时禁言、永久 block/mute，并确保临时禁言到期恢复。
- [x] 6.6 在后台展示自动隐藏、警告、临时禁言和永久封禁的审计记录或处理结果。
- [x] 6.7 更新 `.env.example`、部署文档和生产配置检查，确保 Turnstile site key/secret key、SMTP、Web/API 域名均完整。

## 7. 搜索闭环

- [x] 7.1 调整 local search API 查询范围，使其与搜索页文案一致；如不支持内容搜索，则同步降级文案和 spec。
- [x] 7.2 调整 search API 返回 TopicDTO 兼容字段，避免前端 `TopicList` 消费 raw DB shape。
- [x] 7.3 验证搜索结果排除 deleted、内部 tab 和 block 作者内容。

## 8. 后台布局和极端内容

- [x] 8.1 将 admin shell 内容宽度提升到宽屏容器，同时保持设置页/表单页内部可读宽度。
- [x] 8.2 为 `/admin/audit` 定义时间、操作人、动作、目标、结果列宽和长 target 展示策略。
- [x] 8.3 为 `/admin/users` 的用户名、邮箱、状态、操作列定义截断/断词/换行策略。
- [x] 8.4 为 `/admin/topics`、`/admin/moderation`、`/admin/reports`、`/admin/bans`、`/admin/keywords` 处理长标题、preview、error、reason、keyword 等极端内容。
- [x] 8.5 在桌面和移动端检查后台表格横向滚动、按钮可见性和卡片 padding。

## 9. 验证

- [x] 9.1 运行 `pnpm typecheck`。
- [x] 9.2 运行或新增账号设置/GitHub/邮件链接验证脚本。
- [x] 9.3 运行或新增生产邮件缺失 SMTP、登录页找回密码入口验证。
- [x] 9.4 运行或新增系统设置、举报、IP 封禁、限流配置验证脚本。
- [x] 9.5 运行或新增搜索 DTO/搜索范围、敏感词命中次数和管理概览真实指标验证。
- [x] 9.6 运行或新增 Turnstile 成功/失败、举报自动隐藏、渐进封禁到期恢复验证。
- [x] 9.7 运行相关 OpenSpec validation，确保 `auth`、`user-management`、`admin-dashboard`、`layout-templates`、`web-ui-forms`、`anti-spam`、`rate-limiting`、`content-moderation`、`api-contract`、`production-ops` specs 有效。
- [x] 9.8 对运行时 URL 和 Turnstile 配置进行 smoke check，Turnstile secret 不公开。
