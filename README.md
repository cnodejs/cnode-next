# cnode-next

CNode 社区重写版本。当前阶段聚焦 MongoDB 到 PostgreSQL 迁移后的可运行验证，前端和 API 可在本地运行并连接 PostgreSQL 数据源。

## 技术栈

| 层           | 技术                                                               |
| ------------ | ------------------------------------------------------------------ |
| 前端         | React Router v8 (SSR), TailwindCSS + shadcn/ui                     |
| 后端         | Hono (@hono/node-server), Node.js                                  |
| 数据库       | PostgreSQL                                                         |
| ORM          | Drizzle ORM                                                        |
| 缓存/Session | Redis                                                              |
| 图片存储     | 阿里云 OSS (七牛镜像回源)                                          |
| 邮件         | nodemailer (自建 SMTP)                                             |
| 认证         | Cookie 跨子域 + GitHub OAuth + 本地账号 (bcryptjs)                 |

## 快速上手

```bash
# 安装依赖
pnpm install

# 准备 .env.local，并提供 PostgreSQL/Redis 连接地址
cp .env.example .env.local

# 初始化 PostgreSQL schema
pnpm db:push:pg

# 启动开发 (web + api 同时)
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

## 目录结构

```
cnode-next/
├── apps/
│   ├── web/          # React Router v8 (SSR, CF Workers)
│   └── api/          # Hono API server
├── packages/
│   ├── db/           # Drizzle schema (PostgreSQL-first)
│   └── shared/       # API 契约类型, Zod schemas, 常量
├── docs/             # 深入文档
├── openspec/         # OpenSpec 变更管理
└── nodeclub/         # 老代码参考
```

## 文档

- [架构详解](docs/architecture.md)
- [本地开发](docs/development.md)
- [部署指南](docs/deployment.md)
- [API 契约](docs/api-reference.md)
- [数据库](docs/database.md)
- [内容审核](docs/content-moderation.md)
- [迁移指南](docs/migration-guide.md)

## 参考代码

`nodeclub/` (Express + MongoDB) 和 `egg-cnode/` (Egg.js, 未完成) 是迁移期业务逻辑参考，当前阶段保留。
