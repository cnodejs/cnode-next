# Tasks: rewrite-to-cnode-next

## Phase 0: 项目骨架

- [x] `git init` + 初始提交 (含 nodeclub/egg-cnode 作为参考代码)
- [x] 根 .gitignore (node_modules, .env, .local/, dist/, .DS_Store, *.db, .wrangler/, coverage/)
- [x] pnpm-workspace.yaml + 根 package.json (scripts: dev/build/test/lint)
- [x] 根 README.md (简洁: 简介 + 技术栈 + 快速上手 + 目录概览 + docs/ 链接)
- [x] AGENTS.md (AI 助手指引:项目上下文、技术栈、约定、常用命令)
- [x] docs/ 目录 (architecture, development, deployment, api-reference, database, content-moderation, migration-guide)
- [x] .env.example (所有环境变量模板)
- [x] tsconfig.base.json (strict, paths 映射 @cnode/db, @cnode/shared)
- [x] 创建 apps/web (React Router v8, @cloudflare/vite-plugin, vite.config.ts, react-router.config.ts, wrangler.jsonc)
- [x] 创建 apps/api (Hono, @hono/node-server, tsconfig)
- [x] 创建 packages/db (Drizzle schema 骨架 + client.ts 双 dialect)
- [x] 创建 packages/shared (types + zod schemas + constants 骨架)
- [x] dev 脚本用 concurrently 同时启动 web + api
- [x] ESLint + Prettier 配置

## Phase 1: 数据库层 (packages/db)

- [x] Drizzle schema: users 表 (对照 nodeclub models/user.js)
- [x] Drizzle schema: topics 表
- [x] Drizzle schema: replies 表
- [x] Drizzle schema: reply_ups 表 (从 Mongo 的 ups[] 拆出)
- [x] Drizzle schema: messages 表
- [x] Drizzle schema: topic_collects 表
- [x] client.ts: 按 DB_DIALECT 环境变量创建 drizzle 实例 (sqlite / pg)
- [x] drizzle.config.ts (sqlite + pg 两份配置)
- [x] 生成初始 migration (sqlite + pg)
- [x] seed 脚本: 灌入测试用户 + 测试话题
- [x] 验证: pnpm db:push 在 sqlite 上跑通, pnpm db:push:pg 在本地 pg 上跑通

## Phase 2: 后端核心 (apps/api)

- [x] Hono app entry (index.ts, 路由挂载, 全局 error handler)
- [x] auth middleware: 从 cookie 取 session, 解析 user, 注入 ctx
- [x] rate-limit middleware: Redis INCR + EXPIRE (peruserperday / peripperday)
- [x] /auth/local: POST 登录 (bcryptjs 验证, 设 cookie session)
- [x] /auth/local: POST 注册 (发激活邮件, active=true 后可登录)
- [x] /auth/local: GET active_account (账号激活)
- [x] /auth/local: 密码找回 (search_pass / reset_pass, 邮件含 retrieve_key)
- [x] /auth/github: GitHub OAuth flow (redirect → callback → 设 cookie)
- [x] /auth/signout: 登出 (清 cookie)
- [x] lib/mail.ts: nodemailer + smtpTransport, 重试 5 次 (移植 nodeclub common/mail.js)
- [x] lib/at.ts: @提及解析 (fetchUsers + linkUsers, 移植 nodeclub common/at.js)
- [x] lib/message.ts: sendReplyMessage / sendAtMessage (移植 nodeclub common/message.js)
- [x] lib/score.ts: incrementScoreAndTopicCount / incrementScoreAndReplyCount (两个独立函数, 修 egg-cnode bug)
- [x] lib/cache.ts: Redis get/set/incr wrapper

## Phase 3: 后端 API (apps/api)

- [x] GET /api/v1/topics (列表, 分页, mdrender 选项, linkUsers 处理)
- [x] GET /api/v1/topic/:id (详情 + 回复 + author + is_collect + is_uped, linkUsers 处理)
- [x] POST /api/v1/topics (发帖, 验证 title/tab/content, 积分 +5, topic_count +1, @提及消息)
- [x] POST /api/v1/topics/update (编辑, 权限检查, 重新触发 @提及)
- [x] POST /api/v1/topic/:topic_id/replies (回复, 积分 +5, reply_count +1, 更新 last_reply, @提及消息, 回复消息)
- [x] POST /api/v1/reply/:reply_id/ups (点赞, 不能自己赞自己, debug 模式放行, 返回 { action, success })
- [x] GET /api/v1/user/:loginname (返回 recent_topics + recent_replies, 对齐 CNode API 契约)
- [x] POST /api/v1/accesstoken (token 验证, 返回 loginname/avatar_url/id)
- [x] GET /api/v1/messages (列表, mdrender, 返回 has_read + hasnot_read)
- [x] GET /api/v1/message/count (返回 { success, data: count } 对齐契约)
- [x] POST /api/v1/message/mark_all (标记全部已读)
- [x] POST /api/v1/message/mark_one/:msg_id (标记单条已读)
- [x] POST /api/v1/topic_collect/collect (收藏, collect_count +1)
- [x] POST /api/v1/topic_collect/de_collect (取消收藏, collect_count -1)
- [x] GET /api/v1/topic_collect/:loginname (用户收藏列表)
- [x] POST /api/v1/user/refresh_token (刷新 accessToken)
- [x] POST /api/v1/upload/presign (返回 OSS presigned URL)
- [x] 验证: 所有 API 端点的响应格式与 nodeclub api_router_v1.js 对齐

## Phase 4: 后端 Web 路由 (apps/api)

- [x] 这些路由给 SSR loader 调用, 返回 JSON, 逻辑同上但走 cookie 认证而非 token
- [x] GET /topics, GET /topic/:id, GET /user/:name 等 (复用 API 逻辑)
- [x] POST /topic/create, POST /topic/:tid/edit 等 (表单提交)
- [x] POST /topic/:tid/top, /good, /lock (admin 操作)
- [x] POST /user/:name/block, /delete_all (admin 操作)
- [x] POST /user/set_star, /cancel_star (admin 操作)
- [x] GET /rss (返回 XML)
- [x] GET /sitemap.xml (返回 XML)
- [x] GET /search (搜索, 配置为 google/baidu/local)

## Phase 5: 前端骨架 (apps/web)

- [x] React Router v7 初始化 (SSR mode, @react-router/node)
- [x] Layout 组件 (Header + Sidebar + Content + Footer)
- [x] TailwindCSS 配置
- [x] API client (fetch wrapper, 带 cookie credentials)
- [x] KV cache wrapper (get/set with TTL, dev 环境跳过)
- [x] Markdown 渲染组件 (基础实现, 待接 react-markdown)
- [x] Markdown 编辑器组件 (基础实现, 待接 @uiw/react-md-editor)
- [x] 分页组件
- [x] 时间格式组件 (dayjs fromNow)
- [x] @提及链接化组件 (packages/shared/utils/at.ts)
- [x] 暗色模式: ThemeToggle 组件 + inline script 防闪烁
- [x] ErrorBoundary: 404/403/500

## Phase 6: 前端页面 (apps/web) — 真正实现

- [x] _index.tsx: 首页话题列表 (loader + KV 缓存 + 分 tab + 分页)
- [x] topic.$tid.tsx: 话题详情 (loader + 回复列表 + inline 回复提交)
- [x] topic.create.tsx: 发帖页 (表单 + API 调用)
- [x] topic.$tid.edit.tsx: 编辑页 (表单 + API 调用)
- [x] user.$name.tsx: 用户主页 (loader + API)
- [x] signin.tsx: 登录 (表单 + API + 错误提示 + GitHub 入口)
- [x] auth.github.tsx: GitHub OAuth 发起 (loader redirect)
- [x] auth.github.callback.tsx: GitHub OAuth 回调 (loader + API)
- [x] rss.tsx: RSS (resource route)
- [x] sitemap.tsx: sitemap (resource route)
- [x] about.tsx / faq.tsx / getstart.tsx: 静态页
- [x] Layout: Header + Sidebar + MobileNav + Footer
- [x] signup.tsx: 注册表单 (接 API + 密码强度校验)
- [x] setting.tsx: 用户设置 (资料修改 + 密码修改 + 刷新 token)
- [x] my.messages.tsx: 消息列表 (已读/未读 + 标记已读)
- [x] search.tsx: 搜索 (站内/Google/Baidu)
- [x] search_pass.tsx: 找回密码 (输入邮箱 + 发送重置邮件)
- [x] reset_pass.tsx: 重置密码 (验证 key + 新密码)
- [x] active_account.tsx: 账号激活 (验证 key)
- [x] reply.$id.edit.tsx: 回复编辑 (完善 inline editor)
- [x] user.$name.collections.tsx: 用户收藏列表
- [x] user.$name.topics.tsx: 用户话题列表
- [x] user.$name.replies.tsx: 用户回复列表
- [x] Header: 登录后显示用户信息 + 消息铃铛 + 未读 badge
- [x] SEO: OG tags + JSON-LD + canonical (部分已实现, 待完善)

## Phase 7: 管理后台 (apps/web /admin/*)

- [x] adminLayout: 侧边栏 + 权限检查 loader
- [x] admin._index.tsx: 概览 (统计卡片 + 最近注册/发布 + 待处理)
- [x] admin.topics.tsx: 话题管理
- [x] admin.mod.tsx: 巡检结果
- [x] admin.users.tsx: 用户管理
- [x] admin.bans.tsx: 封禁管理
- [x] admin.reports.tsx: 举报队列
- [x] admin.keywords.tsx: 敏感词管理
- [x] admin.audit.tsx: 审计日志
- [x] admin.settings.tsx: 系统设置

## Phase 7.5: 管理后台 API (apps/api)

- [x] GET /admin/stats (用户/话题/回复统计 + 今日数据)
- [x] GET /admin/recent-users (最近 10 个注册用户)
- [x] GET /admin/recent-topics (最近 10 个话题)
- [x] GET /admin/topics (话题列表, snake_case 字段)
- [x] POST /admin/topics/:action (批量操作: top/good/mute/delete)
- [x] GET /admin/users (用户列表, snake_case 字段)
- [x] GET /admin/bans/users (被封禁用户)
- [x] GET /admin/bans/ips (IP 封禁列表, 暂返回空)
- [x] GET /admin/reports (举报队列, 暂返回空)
- [x] POST /admin/reports/:id/:action (处理举报, 暂 stub)
- [x] GET /admin/keywords (敏感词, 暂返回空)
- [x] POST /admin/keywords + /bulk + DELETE (暂 stub)
- [x] GET /admin/moderation (巡检结果, 暂返回空)
- [x] POST /admin/moderation/:id/:action (处理巡检, 暂 stub)
- [x] GET /admin/audit (审计日志, 暂返回空)
- [x] GET/POST /admin/settings (系统配置)

## Phase 7: 数据迁移

- [ ] scripts/migrate-mongo-to-pg.ts
- [ ] 读 MongoDB (mongodb driver), 写 PostgreSQL (drizzle)
- [ ] ObjectId → BIGINT 自增 (按插入顺序)
- [ ] reply.ups[] → reply_ups 联表行
- [ ] Boolean 0/1 → pg BOOLEAN
- [ ] Date → pg TIMESTAMP
- [ ] pass hash 直接搬 (bcryptjs 兼容)
- [ ] 验证: 用户数、话题数、回复数对账

## Phase 8: 部署

- [ ] apps/api: Dockerfile (多阶段构建, 精简镜像)
- [ ] docker-compose.yml (api + postgres + redis 三容器编排)
- [ ] GitHub Actions: 构建 API 镜像并推送到 ghcr.io
- [ ] 服务器: docker pull + docker-compose up -d 部署
- [ ] apps/web: wrangler.jsonc + @cloudflare/vite-plugin 配置, 部署到 CF Workers (next.cnodejs.org)
- [ ] 配置 .cnodejs.org 跨子域 cookie (next/api/static 共享)
- [ ] 配置阿里云 OSS bucket + presigned URL 权限
- [ ] 配置 OSS 镜像回源到七牛 (渐进式迁移老图片)
- [ ] 配置 SMTP (自建邮件服务)
- [ ] 配置 GitHub OAuth callback URL (指向 next.cnodejs.org)
- [ ] 运行数据迁移脚本
- [ ] 验证 next.cnodejs.org 与老 cnodejs.org 并行运行正常
- [ ] 切换 DNS (cnodejs.org → CF Workers 新前端, 老 nodeclub 下线)

## Phase 9: 收尾

- [ ] 删除 nodeclub/egg-cnode 目录 (项目参考完毕)
- [ ] 更新 README.md (最终版本,确保 docs/ 链接有效)
- [ ] 更新 AGENTS.md (最终版本,补充实际命令、注意事项)
- [ ] 完善 docs/ 各文档 (补充实施过程中发现的新内容)
- [ ] CI: GitHub Actions (lint + typecheck + test, sqlite 跑测试)
- [ ] CI: GitHub Actions 构建 API 镜像并推送到 ghcr.io
- [ ] API 契约测试: 对照 nodeclub api_router_v1.js 验证响应格式
