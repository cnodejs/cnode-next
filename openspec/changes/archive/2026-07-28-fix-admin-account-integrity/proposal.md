## Why

当前账号与后台运营链路存在多处“看起来可用但不完整”的问题：用户设置页没有展示邮箱和 GitHub 绑定状态，管理员可对自己执行 block/mute/delete_all，后台表格在极端内容下会折叠或溢出，密码邮件链接还混用了 API 域名；同时系统设置、举报、IP 封禁和反垃圾能力存在 UI/API/spec 不一致的假闭环。legacy `nodeclub/controllers/sign.js`、`nodeclub/controllers/github.js`、`nodeclub/controllers/user.js`、`nodeclub/middlewares/limit.js`、`nodeclub/controllers/topic.js` 和 `nodeclub/controllers/reply.js` 中这些路径都是线上运营高频入口，迁移后必须避免用户误导、管理员自锁和运营动作无效。

## What Changes

- 设置页显示当前邮箱，并将邮箱作为只读身份信息展示；不在本变更中提供直接改邮箱能力。
- 设置页显示 GitHub 绑定状态，并提供已登录用户从设置页发起 GitHub 绑定的入口；保持现有首次 GitHub 登录时“注册新账号/关联老账号”流程。
- GitHub OAuth 增加 state 校验，并区分“登录/注册”与“绑定当前账号”两种意图。
- 密码找回邮件和本地账号激活邮件中的用户入口链接使用 `APP_WEB_BASE_URL`，API 只负责最终校验和状态写入。
- 管理员自操作保护：禁止 admin 对自己执行 block、mute、delete_all 等会破坏自身账号或内容可见性的高风险操作。
- 后台管理 shell 使用更宽的 admin 布局，同时对审计、用户、话题、巡检、举报、封禁、敏感词等管理页面定义列宽、换行、截断和长文本展示策略。
- 修复设置页“通知说明”卡片 body padding，使其与其他设置卡片一致。
- 后台系统设置必须从数据库读取并被业务路径消费：注册开关、新用户发帖门槛、发帖/回复限流、归档天数不得只停留在 UI 保存。
- 举报系统形成完整闭环：前台话题/回复举报入口、后端返回后台需要的目标摘要字段、后台可处理且字段不为空。
- IP 封禁后台接入新增/移除操作，并支持单 IP 与 CIDR 匹配。
- 反垃圾 spec 与实现对齐：本变更直接实现已承诺的 Turnstile、新用户限制、举报自动隐藏和渐进封禁，不再拆分或降级。
- 登录页必须提供找回密码入口；密码找回和账号激活邮件在生产缺少 SMTP 时不得返回假成功。
- 敏感词后台“命中次数”必须真实更新；若无法更新则不得展示为运营指标。
- 搜索页文案、API 查询范围和返回 DTO 必须一致，不能声明搜索内容但只查标题并返回 raw DB shape。
- 管理概览不得使用硬编码待处理举报数，已声明的后台指标必须来自真实查询或明确不展示。

## Non-goals

- 不实现改邮箱流程；改邮箱需要新邮箱验证和旧邮箱通知，后续单独提案。
- 不实现 GitHub 解绑；解绑涉及唯一登录方式保护，后续单独提案。
- 不重做整个后台信息架构和报表能力；本变更只修复已确认的账号、后台和运营闭环问题。
- 不实现 GitHub 解绑/换绑和改邮箱；其余已确认的上线阻塞项均纳入本变更。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `auth`: 密码找回/激活邮件链接使用 Web 域名；GitHub OAuth 需要 state 校验并支持已登录用户绑定当前账号。
- `user-management`: 管理员用户操作必须防止对自己执行破坏性或限制性动作。
- `admin-dashboard`: 后台审计、用户、内容治理等管理列表必须在极端字段长度下保持可读、可操作。
- `layout-templates`: admin 模板需要更宽的后台 shell，并区分表格页和表单页的内容宽度策略。
- `web-ui-forms`: 设置页需要展示只读邮箱、GitHub 绑定状态，并保持卡片 body 间距一致。
- `anti-spam`: 举报、IP 封禁、Turnstile、新用户限制、举报自动隐藏和渐进封禁需要完整落地。
- `rate-limiting`: 管理后台限流配置必须被限流中间件读取，不能仅保存到数据库。
- `content-moderation`: 敏感词命中次数必须与实时过滤和历史巡检真实命中保持一致，或从 UI 移除该指标。
- `api-contract`: 搜索接口必须返回前端可消费的稳定 DTO，并与页面宣称的搜索范围一致。
- `production-ops`: 生产邮件路径必须可观测且不能在 SMTP 缺失时假成功。

## Impact

- Web routes: `apps/web/app/routes/setting.tsx`、`auth.github.tsx`、`auth.github.callback.tsx`、`auth.github.new.tsx`、`admin/*.tsx`。
- API routes: `apps/api/src/routes/auth.ts`、`apps/api/src/routes/admin.ts`。
- Mail helpers: `apps/api/src/lib/mail.ts`。
- UI primitives/layout: `apps/web/app/components/AdminLayout.tsx`、`AdminPage.tsx`、`ui/table.tsx`，必要时新增局部 class 约定。
- Env: 生产必须配置 `APP_WEB_BASE_URL=https://next.cnodejs.org`，`APP_API_BASE_URL=https://api.cnodejs.org`。
- Env: Turnstile 必须配置 site key 和 secret key，secret 只存在服务端环境。
- Operational paths: `apps/api/src/middleware/rate-limit.ts`、`apps/api/src/middleware/ip-ban.ts`、举报创建/列表 API、发帖/回复/注册业务路径、后台系统设置页面。
- Search and moderation metrics: `/api/v1/search`、`/search`、敏感词命中统计、管理概览统计。
