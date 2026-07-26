# Rewrite CNode to cnode-next

## Why

CNode 的线上版本 nodeclub(Express + MongoDB + EJS)自 2013 年起一直在跑,技术栈严重过时:callback 风格、无类型、jQuery 前端。访问量虽不大,但维护成本高、新功能难加、SEO 依赖老旧模板。

egg-cnode 是一次未完成的迁移尝试(Egg.js + Mongoose + EJS),从未上线,存在多处功能缺口和 bug(发帖不增 topic_count、API 契约不一致、GitHub OAuth 流程丢失等)。它不具备继续维护的价值。

与其继续在老旧框架上打补丁,不如用现代技术栈重写,把 nodeclub/egg-cnode 作为业务逻辑参考文档,逐一对照实现。

## What

在当前目录下新建 monorepo 项目 cnode-next,前后端分离:

- **前端** (apps/web): React Router v8 SSR,通过 `@cloudflare/vite-plugin` 部署到 Cloudflare Workers
- **后端** (apps/api): Hono 纯 API server,部署在海外自有服务器
- **共享** (packages/db, packages/shared): Drizzle schema、API 契约类型、Zod 验证、常量

数据从 MongoDB 迁移到 PostgreSQL,本地开发用 SQLite。功能与 nodeclub 对齐,UI 用 TailwindCSS + shadcn/ui 重新设计。

## Scope

In scope:

- 话题 CRUD、回复、收藏、@提及、消息通知、积分
- 本地账号注册/登录(兼容老 bcrypt hash)+ GitHub OAuth
- CNode API v1 契约对齐(给第三方客户端用)
- 密码找回(邮件激活)、限流、RSS、sitemap
- 图片上传(阿里云 OSS presigned URL + 七牛镜像回源渐进迁移)
- MongoDB → PostgreSQL 数据迁移脚本
- 重新设计 UI(TailwindCSS + shadcn/ui)

UGC 内容治理:

- 关键字过滤(发帖/回复时实时拦截敏感词)
- 定期巡检(扫描已发布内容,敏感内容自动隐藏)
- 用户举报(举报队列 + 管理员审核 + 自动隐藏阈值)
- 新用户限制(注册后需满足条件才能发帖)
- 人机验证(Cloudflare Turnstile,注册/风险行为触发)
- 渐进式封禁(警告→临时禁言→永久封禁)
- IP 封禁
- 操作审计日志

内容生命周期:

- 草稿箱 + 自动保存(防止长帖意外丢失)
- 编辑历史(可追溯、可回退)
- 内容归档(老帖自动锁定)

SEO & 社交分享:

- Open Graph + Twitter Card 标签
- JSON-LD 结构化数据
- Canonical URL

社区管理:

- 版主团队(配置式,无需角色系统)
- 管理员重置用户密码
- 用户管理面板(搜索/禁言/删除发言)
- 管理后台(/admin/*):概览(统计+趋势+最近数据)/内容管理/巡检结果/用户管理/封禁管理/举报队列/敏感词管理/审计日志/系统设置(注册开关/版主配置/新用户限制/巡检配置/限流配置)

安全:

- 密码强度校验(注册/改密码时)
- Session 管理(查看活跃设备、强制下线)

## Non-goals

- 保留老链接 SEO(ObjectId → BIGINT,老链接 404 可接受)
- 实时功能(WebSocket、在线状态)
- 移动端 native App
- 国际化(仍然只做中文)
- 复刻 nodeclub 的所有视觉细节(TailwindCSS 重新设计,不逐像素还原)
- 将 egg-cnode 补全后再迁移(直接重写,不补旧代码)
- 关注/粉丝功能(nodeclub 的 followers/followings 是死代码,不实现)
- 管理员 2FA(本次不做,后续再加)
- 角色权限系统(版主通过配置文件设置,不建角色表)
- 邮件摘要/周报、热门推荐(后续再加)
