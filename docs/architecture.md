# Architecture

本文档描述 cnode-next 的整体架构、前后端分工、数据流和域名规划。

## 总览

```mermaid
graph TB
  subgraph CF [Cloudflare Workers]
    WEB[apps/web<br/>React Router v7 SSR<br/>next.cnodejs.org<br/>@cloudflare/vite-plugin]
    KV[(KV Binding<br/>页面缓存 TTL 60s)]
  end

  subgraph SERVER [海外服务器 Node.js]
    API[apps/api<br/>Hono @hono/node-server<br/>api.cnodejs.org]
    REDIS[(Redis<br/>cache/session/限流)]
    PG[(PostgreSQL)]
  end

  subgraph ALIYUN [阿里云]
    OSS[(OSS<br/>static.cnodejs.org<br/>图片存储+镜像回源)]
    QINIU[七牛云<br/>老图片源站]
  end

  OLD[老 nodeclub<br/>cnodejs.org<br/>Express + MongoDB]

  WEB -->|HTTPS fetch JSON API<br/>Cookie .cnodejs.org| API
  WEB -.->|KV binding| KV
  WEB -->|presigned URL 直传| OSS
  API --> REDIS
  API --> PG
  OSS -.->|404 miss 镜像回源| QINIU

  SHARED[packages/shared<br/>API 契约类型, Zod, 常量]
  DBPKG[packages/db<br/>Drizzle schema 一份<br/>SQLite/pg 双 dialect]
  DBPKG -.-> API
  DBPKG -.-> WEB
  SHARED -.-> API
  SHARED -.-> WEB
```

## Monorepo 结构

cnode-next 使用 pnpm workspace 管理 monorepo,不引入 turborepo。包含 2 个应用和 2 个共享包:

- `apps/web`: React Router v7 前端,通过 `@cloudflare/vite-plugin` 部署到 CF Workers
- `apps/api`: Hono API server,通过 docker-compose 部署在海外自有服务器
- `packages/db`: Drizzle ORM schema (一份, SQLite/pg 双 dialect)
- `packages/shared`: API 契约类型, Zod schemas, 常量, 纯函数

前后端通过共享 `packages/db` 和 `packages/shared` 实现类型安全:改 schema 或 API 契约一次,前后端同时类型检查。

## 域名规划

```
cnodejs.org          → 老 nodeclub (Express + MongoDB),保持运行
next.cnodejs.org     → 新前端 (React Router v7 SSR, CF Workers)
api.cnodejs.org      → 新后端 API (Hono, 海外服务器)
static.cnodejs.org   → 图片存储 (阿里云 OSS, 镜像回源七牛)
static2.cnodejs.org  → 站点静态资源 CDN (logo/CSS/JS/public assets)
```

新应用先在 `next.cnodejs.org` 上线,与老 nodeclub 并行运行。验证无误后,将 `cnodejs.org` DNS 切到新前端,老 nodeclub 下线。

## 认证流程

认证 Cookie 跨子域 `.cnodejs.org`,使 SSR loader 和 client-side fetch 都能携带认证。

- 本地账号: bcryptjs (cost=10),兼容 nodeclub 老 hash
- GitHub OAuth: 两段式流程 (新用户选择注册新账号或关联老账号)
- API accessToken: 每个用户维护 accessToken,API 请求通过 accesstoken 参数认证

## 边缘缓存策略

后端在海外,SSR loader 回源延迟 100-200ms。通过 KV 缓存公共数据缓解:

1. loader 查 KV 缓存,hit 则直接渲染 (<10ms)
2. miss 则 fetch API 回源,写入 KV (TTL 60s),渲染返回

可缓存 (匿名看到的公共数据): 话题列表、话题详情 + 回复列表、用户主页、RSS

不可缓存 (用户私有数据,走 SPA 不需要 SSR): 消息页、设置页、发帖/编辑页
