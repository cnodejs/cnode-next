# Design: cnode-next Architecture

## Overview

```mermaid
graph TB
  subgraph CF [Cloudflare Workers]
    WEB[apps/web<br/>React Router v8 SSR<br/>next.cnodejs.org<br/>@cloudflare/vite-plugin]
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

## 域名规划

```
cnodejs.org          → 老 nodeclub (Express + MongoDB),保持运行
next.cnodejs.org     → 新前端 (RRv8 SSR, CF Workers)
api.cnodejs.org      → 新后端 API (Hono, 海外服务器)
static.cnodejs.org   → 图片存储 (阿里云 OSS, 镜像回源七牛)
```

新应用上线在 `next.cnodejs.org`,与老 nodeclub 并行运行。验证无误后,将 `cnodejs.org` DNS 切到新前端,老 nodeclub 下线。

## Monorepo 结构

```
cnode-next/                          ← 当前目录
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── apps/
│   ├── web/                        ← React Router v8 (SSR, CF Workers via @cloudflare/vite-plugin)
│   │   ├── app/
│   │   │   ├── routes/
│   │   │   ├── components/
│   │   │   └── styles/
│   │   ├── vite.config.ts
│   │   ├── react-router.config.ts
│   │   └── wrangler.jsonc
│   └── api/                        ← Hono API server
│       ├── src/
│       │   ├── routes/             ← topic, reply, user, message, collect, auth
│       │   ├── middleware/         ← auth, rate-limit, error
│       │   ├── lib/                ← mail, at, message, score, cache
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── db/                         ← 共享数据库层
│   │   ├── src/
│   │   │   ├── schema/             ← Drizzle schema (一份)
│   │   │   ├── client.ts           ← 按 dialect 创建实例
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   │   ├── sqlite/             ← 本地
│   │   │   └── pg/                 ← 生产
│   │   └── drizzle.config.ts
│   └── shared/                     ← 共享类型和工具
│       ├── src/
│       │   ├── types/              ← API 契约 (DTO)
│       │   ├── schemas/            ← Zod 验证 (前后端共用)
│       │   ├── constants/          ← tabs, score 规则, rate limit
│       │   └── utils/              ← at 解析, markdown 配置
│       └── package.json
├── scripts/
│   └── migrate-mongo-to-pg.ts      ← 一次性数据迁移
└── .github/workflows/ci.yml
```

## 决策记录

### 1. Monorepo (pnpm workspace, 无 turborepo)

**选择**: pnpm workspace,不引入 turborepo。

**理由**: 只有 2 apps + 2 packages 的规模,turborepo 带来的构建缓存和并行编排收益有限,而其配置复杂度和 lockfile 机制反而增加维护成本。pnpm workspace 的 `pnpm -r dev` / `pnpm -r build` / `pnpm -r test` 已经够用。dev 时用 concurrently 同时起 web 和 api 即可。

**否决项**:

- npm/yarn workspace: pnpm 的 hoisting 和 disk 效率更好
- turborepo: 规模不够,过度工程
- Nx: 更重,学习成本高

### 2. 前端: React Router v8 (SSR, Cloudflare Workers)

**选择**: React Router v8 的 SSR mode,通过 `@cloudflare/vite-plugin` 部署到 Cloudflare Workers。

**理由**:

- RRv8 是全栈框架,loader/action/middleware 在服务端跑,天然支持 SSR + SEO
- `@cloudflare/vite-plugin` 官方支持 RRv8,本地开发直接跑在 workerd 运行时,与生产行为一致
- Workers 提供完整 runtime API:KV bindings、R2 bindings、Cron Triggers、Durable Objects 等,Pages 缺失这些能力
- KV 通过 bindings 访问 (context.cloudflare.env.KV),而非外部 API 调用,延迟更低
- CF Turnstile 人机验证也是 Workers 侧能力
- 重新设计 UI 用 TailwindCSS + shadcn/ui,摆脱 jQuery/Bootstrap 历史包袱

**否决项**:

- CF Pages: 缺少 Workers bindings (KV/R2/Durable Objects 等),功能受限;Workers 是 CF 的全功能运行时
- Next.js: 偏向 Vercel 生态,CF 部署不如 RRv8 原生
- Astro: 偏静态站,交互式论坛场景不如 RRv8
- Egg/EJS 模板: 不符合重新设计的意图

### 3. 后端: Hono (Node.js)

**选择**: Hono on `@hono/node-server`,部署在海外自有服务器,通过 docker-compose 管理所有服务。

**理由**:

- 前后端分离后,后端是纯 API server,不需要视图渲染
- Hono 轻量,Web 标准化,中间件生态成熟(CORS, JWT, CSRF 等内置)
- Hono 原生为 CF 设计,如果未来想把部分只读 API 搬到边缘,同一套代码可以无缝迁移到 Workers
- 用 Zod 做请求验证,跟前端共享 schema

**部署**: docker-compose 编排 api + postgres + redis 三个容器,API 镜像推送到 GitHub Container Registry (ghcr.io)。前端通过 `@cloudflare/vite-plugin` 部署到 Cloudflare Workers。

**否决项**:

- Egg@3: 多进程模型和约定式 MVC 对于纯 API 后端过重,范式旧,不能跑在 CF Workers 上
- ArtusX: IoC + 装饰器范式现代,但社区小(11 star),CF 适配无先例
- Express: 范式旧,生态虽大但新项目没有理由选它
- NestJS: 过度工程,IoC 对这个规模太重

### 4. 数据库: 本地 SQLite + 生产 PostgreSQL

**选择**: Drizzle ORM,本地开发用 better-sqlite3,生产用 PostgreSQL (自建,docker-compose 部署)。

**理由**:

- 本地零依赖: 不需要装 PostgreSQL,clone 下来 `pnpm db:push` 就能跑
- Drizzle 抹平 dialect 差异: 一份 schema,两个 dialect 生成不同 SQL
- pg 比 MySQL 在类型严格性、JSONB、全文搜索上更好
- nodeclub 原来是 MongoDB,没有 MySQL 思维包袱,可以自由选 pg
- 访问量不大,自建 pg + Redis 通过 docker-compose 部署即可,无需 Serverless

**SQLite/pg 差异处理**:

- BOOLEAN: SQLite 存 0/1,Drizzle 层面统一
- DATETIME: 用 Drizzle 的 `$defaultFn(() => new Date())` 统一
- 外键: SQLite 需 `PRAGMA foreign_keys=ON`,Drizzle 配置处理
- 并发: SQLite 写锁全库级别,本地开发单人够用,CI 上用 pg 跑并发测试

**否决项**:

- MySQL: PlanetScale 取消免费层,类型检查宽松
- CF D1: 访问量虽不大但数据量较大,D1 容量可能受限
- MongoDB + Prisma: 不如完全迁移到关系型

### 5. 认证: Cookie 跨子域 + GitHub OAuth + 本地账号

**选择**:

- Cookie 跨子域 `.cnodejs.org` (前端 next.cnodejs.org + 后端 api.cnodejs.org + 图片 static.cnodejs.org)
- GitHub OAuth: 直接 fetch 调用,不用 passport 中间件
- 本地账号: bcryptjs (cost=10),兼容 nodeclub 老 hash

**理由**:

- 跨子域 cookie 让 SSR loader 和 client-side fetch 都能带认证
- nodeclub 用 bcryptjs cost=10,新项目用同样的参数,老用户 hash 可直接验证,不用重设密码
- GitHub OAuth 在 Hono 上手写很简单,不需要 passport 抽象

**否决项**:

- JWT: 无状态 token 撤销麻烦,论坛场景 cookie + session 更合适
- Auth.js / Lucia: 引入额外抽象,对这个规模过重
- 完全只用 GitHub OAuth: 用户要求保留本地账号

### 6. 邮件: 自建 SMTP (nodemailer)

**选择**: nodemailer + 自建 SMTP,不使用第三方 API。

**理由**: 用户明确要求自己发邮件,不依赖第三方服务。

**实现**: 移植 nodeclub/egg-cnode 的 nodemailer 配置,用 nodemailer-smtp-transport,支持重试。

### 7. 图片存储: 阿里云 OSS + 七牛镜像回源

**选择**: 阿里云 OSS 作为主存储,统一域名 `static.cnodejs.org`。新图片直传 OSS;老图片通过 OSS 镜像回源从七牛拉取,渐进式迁移。

**现状**: `static.cnodejs.org` 已经指向 OSS 且镜像回源已配置好,老图片的七牛 URL 无需改写。

**架构**:

```mermaid
flowchart LR
  USER[用户上传新图片] -->|presigned URL 直传| OSS[阿里云 OSS<br/>static.cnodejs.org]
  READER[用户访问图片] -->|static.cnodejs.org/xxx| OSS
  OSS -->|404 miss<br/>镜像回源| QINIU[七牛云<br/>老图片源站]
  QINIU -->|返回图片| OSS
  OSS -->|缓存后返回| READER
```

**流程**:

新图片上传:

1. 前端请求后端 `POST /api/upload/presign` 获取 OSS presigned URL
2. 前端直传 OSS
3. 前端拿到 `static.cnodejs.org/xxx.png`,在帖子里插入

老图片访问(渐进式迁移):

1. 帖子里的老图片 URL 已经是 `static.cnodejs.org/xxx.png` (或七牛 URL 统一走 static 域名)
2. OSS 收到请求,若无此文件,自动镜像回源七牛
3. OSS 缓存后返回给用户,后续访问直接命中 OSS
4. 迁移完成后可关闭七牛源站

**理由**:

- `static.cnodejs.org` 镜像回源已就绪,无需额外配置
- 老图片无需改写 URL,也无需一次性迁移,按需拉取,零停机
- 七牛老图片逐渐被 OSS 镜像缓存,最终全部迁移完成
- OSS presigned URL 支持前端直传,后端不中转
- 比一次性迁移更安全:有问题可以随时回滚

**否决项**:

- Cloudflare R2: 边缘存储好,但无镜像回源能力,老图片无法渐进式迁移
- 后端代理上传: 简单但浪费带宽
- 本地文件存储: 不能在 CF 上用

### 8. 限流: Redis-based

**选择**: Redis 实现 peruserperday / peripperday 限流,跟 nodeclub 逻辑对齐。

**实现**: 移植 nodeclub/middlewares/limit.js 的逻辑,用 Redis INCR + EXPIRE。

### 9. 数据迁移: MongoDB → PostgreSQL

**选择**: 一次性 TypeScript 脚本,放在 `scripts/migrate-mongo-to-pg.ts`。

**处理**:

- ObjectId → BIGINT 自增 (老链接 404 可接受)
- reply.ups[] 数组 → reply_ups 联表
- Boolean → pg BOOLEAN
- Date → pg TIMESTAMP
- 密码 hash 直接搬 (bcryptjs 兼容)

### 10. 数据模型

```
users (id, loginname, pass, email, avatar, github_id, github_username,
       github_access_token, score, topic_count, reply_count,
       collect_topic_count, is_block, is_star, active, access_token,
       receive_reply_mail, receive_at_mail, retrieve_key, retrieve_time,
       url, location, signature, profile, weibo, level,
       create_at, update_at)

topics (id, title, content, author_id, tab, top, good, lock,
        reply_count, visit_count, collect_count, last_reply_id,
        last_reply_at, deleted, create_at, update_at)

replies (id, content, topic_id, author_id, reply_id,
         deleted, create_at, update_at)

reply_ups (reply_id, user_id, create_at)  -- 从 Mongo 的 ups[] 数组拆出
  PRIMARY KEY (reply_id, user_id)

messages (id, type, master_id, author_id, topic_id, reply_id,
          has_read, create_at)

topic_collects (id, user_id, topic_id, create_at)
  UNIQUE (user_id, topic_id)
```

### 11. 积分规则 (行为契约)

| 事件     | 积分变化 | 对应计数器             |
| -------- | -------- | ---------------------- |
| 发帖     | +5       | topic_count +1         |
| 回复     | +5       | reply_count +1         |
| 删除话题 | -5       | topic_count -1         |
| 删除回复 | -5       | reply_count -1         |
| 收藏话题 | 0        | collect_topic_count +1 |
| 取消收藏 | 0        | collect_topic_count -1 |
| 回复点赞 | 0        | (无计数器变化)         |

注意: egg-cnode 的 bug 是发帖时 reply_count+1 而非 topic_count+1,新项目必须用两个独立的函数: `incrementScoreAndTopicCount` 和 `incrementScoreAndReplyCount`。

## 边缘缓存策略 (SSR 回源缓解)

后端在海外,SSR loader 回源延迟 100-200ms。通过 KV 缓存公共数据缓解:

```mermaid
flowchart TD
  A[loader 开始] --> B{查 KV binding}
  B -->|hit| C[用缓存数据渲染<br/><10ms]
  B -->|miss| D[fetch API 回源海外后端]
  D --> E[写入 KV TTL 60s]
  E --> F[渲染返回]
```

可缓存 (匿名看到的公共数据): 话题列表、话题详情 + 回复列表、用户主页、RSS

不可缓存 (用户私有数据,走 SPA 不需要 SSR): 消息页、设置页、发帖/编辑页

## 部署方式

后端通过 docker-compose 编排,所有服务在海外服务器上运行。敏感信息全部走 `.env` 文件,docker-compose.yml 只做编排逻辑,不含任何密钥。

### .env (生产服务器上, 不入 Git)

所有环境变量统一放 `.env`,docker-compose.yml 不写任何 environment,全部通过 `env_file` 注入:

```bash
# ── 应用 ──
APP_ENV=production
APP_PORT=3001

# ── 数据库 (容器间用服务名) ──
DB_DIALECT=pg
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cnode
DB_USER=cnode
DB_PASSWORD=<强密码>

# ── Redis ──
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<强密码>

# Postgres 初始化 (docker postgres 镜像读这些)
POSTGRES_DB=cnode
POSTGRES_USER=cnode
POSTGRES_PASSWORD=<强密码>          # 与 DB_PASSWORD 保持一致

# ── 认证 ──
AUTH_SESSION_SECRET=<随机字符串>
AUTH_COOKIE_DOMAIN=.cnodejs.org
AUTH_COOKIE_NAME=node_club
AUTH_GITHUB_CLIENT_ID=
AUTH_GITHUB_CLIENT_SECRET=
AUTH_GITHUB_CALLBACK_URL=https://next.cnodejs.org/auth/github/callback

# ── 邮件 ──
SMTP_HOST=
SMTP_PORT=25
SMTP_USER=
SMTP_PASS=
SMTP_FROM=cnode@xxx
SMTP_FROM_NAME=CNode

# ── 阿里云 OSS ──
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_REGION=oss-cn-hangzhou
OSS_STATIC_HOST=https://static.cnodejs.org

# ── Cloudflare ──
CF_ACCOUNT_ID=
CF_API_TOKEN=
CF_KV_NAMESPACE_ID=
CF_TURNSTILE_SITE_KEY=
CF_TURNSTILE_SECRET_KEY=

# ── Caddy (反代 + ACME) ──
Caddy_DOMAIN=api.cnodejs.org
Caddy_UPSTREAM=api:3001           # docker 内网, Caddy 和 api 在同一 compose
```

### docker-compose.yml

```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    env_file: .env
    networks:
      - cnode-internal
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  api:
    image: ghcr.io/<owner>/cnode-api:latest
    restart: unless-stopped
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - cnode-internal
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file: .env
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cnode -d cnode"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - cnode-internal
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: >
      sh -c 'redis-server
      --requirepass "$$REDIS_PASSWORD"
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru'
    env_file: .env
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a $$REDIS_PASSWORD ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - cnode-internal
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  caddy_data:
  caddy_config:
  pg_data:
  redis_data:

networks:
  cnode-internal:
    driver: bridge
```

### Caddyfile

Caddy 通过 `Caddy_DOMAIN` 和 `Caddy_UPSTREAM` 环境变量配置,自动申请 ACME 证书:

```caddy
{$Caddy_DOMAIN} {
    reverse_proxy {$Caddy_UPSTREAM}
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

**变量管理原则**:

- docker-compose.yml 零 environment,所有变量通过 `env_file: .env` 注入
- 容器间连接参数 (DB_HOST=postgres, REDIS_HOST=redis, Caddy_UPSTREAM=api:3001) 也放 .env
- Postgres/Redis 密码在 healthcheck 和 command 中用 `$$VAR` (双美元符号, 转义给容器内 shell 解析)
- `.env` 在 `.gitignore` 中,不入 Git;仓库提供 `.env.example` 作模板

**生产要点**:

- Caddy 监听 80/443,自动通过 ACME (Let's Encrypt) 申请和续期证书
- API 不暴露端口,仅在内网 `cnode-internal` 与 Caddy 通信
- Postgres/Redis 不暴露端口,仅内网通信
- 所有服务配 `restart: unless-stopped`
- Postgres/Redis 配 healthcheck,API 用 `depends_on.condition: service_healthy` 等依赖就绪
- 日志限制大小和文件数,避免磁盘写满
- Redis 设 `maxmemory` + LRU 淘汰,防止内存溢出

**部署流程**:

1. GitHub Actions 构建 API 镜像并推送到 ghcr.io
2. 服务器 `docker pull ghcr.io/<owner>/cnode-api:latest`
3. `docker compose up -d` 滚动更新
4. 前端通过 `@cloudflare/vite-plugin` 部署到 Cloudflare Workers

## 项目文档

### 文档结构

```
cnode-next/
├── README.md                ← 入口:项目简介 + 快速上手 + 链接到 docs/
├── AGENTS.md                ← AI 助手指引 (项目上下文 + 常用命令 + 约定)
├── .env.example             ← 环境变量模板
└── docs/                    ← 深入文档 (按主题组织)
    ├── architecture.md      ← 架构详解:monorepo 结构、前后端分工、数据流
    ├── development.md        ← 本地开发:pnpm dev、db:push、seed、调试技巧
    ├── deployment.md        ← 部署:docker-compose、ghcr.io、CF Workers、DNS 切换
    ├── api-reference.md     ← API v1 契约:端点、请求/响应格式、示例
    ├── database.md          ← 数据库:schema、migration、双 dialect 注意事项
    ├── content-moderation.md← 内容审核:敏感词配置、巡检、举报流程
    └── migration-guide.md   ← 从 nodeclub 迁移:数据映射、行为差异、核对清单
```

**原则**: README 是入口,简洁,指向 docs/ 的深入文档。README 保持一屏能看完;细节放 docs/。

### README.md (根目录)

项目入口文档,保持简洁,包含:

- 项目简介 (cnode-next 是什么,一句话)
- 技术栈一览表 (一行)
- 快速上手 (git clone → pnpm install → pnpm db:push → pnpm dev)
- 目录结构概览 (简短 tree)
- 文档链接 (指向 docs/ 各文档)
- 参考代码说明 (nodeclub/egg-cnode 是业务逻辑参考,Phase 9 删除)

### AGENTS.md (根目录)

AI 助手(如 Claude Code, Codex)的工作指引,包含:

- 项目上下文 (cnode-next 重写项目,业务逻辑参考 nodeclub/egg-cnode)
- 技术栈 (RRv8, Hono, Drizzle, PostgreSQL, CF Workers)
- 目录约定 (哪个包负责什么)
- 常用命令 (pnpm dev, pnpm db:push, pnpm test, pnpm lint)
- 代码风格约定 (strict TS, Zod 验证, 纯函数放 packages/shared)
- 迁移参考指引 (对照 nodeclub 哪个文件实现哪个功能)
- OpenSpec 工作流 (openspec list/show/instructions)

### docs/ 各文档职责

| 文档                  | 内容                                                             |
| --------------------- | ---------------------------------------------------------------- |
| architecture.md       | monorepo 结构、前后端分工、边缘缓存策略、域名规划                |
| development.md        | 本地开发环境、SQLite/pg 切换、seed、调试                         |
| deployment.md         | docker-compose 编排、ghcr.io 镜像、CF Workers 部署、DNS 切换流程 |
| api-reference.md      | CNode API v1 全端点契约、请求/响应示例                           |
| database.md           | Drizzle schema、migration 流程、SQLite/pg 差异                   |
| content-moderation.md | 敏感词库管理、巡检配置、举报队列、封禁策略                       |
| migration-guide.md    | MongoDB→pg 字段映射、行为差异、数据核对清单                      |

### .env.example

根目录提供 `.env.example`,按服务分组列出所有环境变量:

```bash
# ── 应用 ──
APP_NAME=cnode-next
APP_ENV=development
APP_PORT=3001
APP_API_BASE_URL=http://localhost:3001

# ── 数据库 ──
DB_DIALECT=sqlite                    # sqlite | pg
# 本地 SQLite:
DB_SQLITE_PATH=.local/dev.db
# 生产 PostgreSQL (DB_URL 覆盖下面的单独字段):
# DB_URL=postgresql://cnode:xxx@localhost:5432/cnode
DB_HOST=
DB_PORT=5432
DB_NAME=cnode
DB_USER=
DB_PASSWORD=

# ── Redis ──
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ── 认证 / Session ──
AUTH_SESSION_SECRET=change-me
AUTH_COOKIE_DOMAIN=.cnodejs.org
AUTH_COOKIE_NAME=node_club
AUTH_GITHUB_CLIENT_ID=
AUTH_GITHUB_CLIENT_SECRET=
AUTH_GITHUB_CALLBACK_URL=https://next.cnodejs.org/auth/github/callback

# ── 邮件 (SMTP) ──
SMTP_HOST=
SMTP_PORT=25
SMTP_USER=
SMTP_PASS=
SMTP_FROM=cnode@localhost
SMTP_FROM_NAME=CNode

# ── 阿里云 OSS ──
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_REGION=oss-cn-hangzhou
OSS_ENDPOINT=
OSS_STATIC_HOST=https://static.cnodejs.org

# ── Cloudflare ──
CF_ACCOUNT_ID=
CF_API_TOKEN=
CF_KV_NAMESPACE_ID=
CF_TURNSTILE_SITE_KEY=
CF_TURNSTILE_SECRET_KEY=
```

### .gitignore

必须忽略: node_modules, .env, .local/, dist/, *.db, .DS_Store, .wrangler/, coverage/

## 前端设计

### 视觉方向

CNode 是开发者社区,视觉风格借鉴 GitHub:信息密度高、不花哨、读着舒服。亮色/暗色双模式标配。

色彩体系 (借鉴 GitHub):

- 亮色: 背景 #FFFFFF / #F8F9FA, 文字 #1F2328, 主题色 #0969DA
- 暗色: 背景 #0D1117 / #161B22, 文字 #E6EDF3, 主题色 #58A6FF
- 强调: 绿 (精华), 橙 (置顶), 红 (删除/危险)
- 代码高亮: Shiki (VS Code Dark+ / Light)

字体:

- 正文: system-ui / -apple-system (系统字体,零加载)
- 代码: "JetBrains Mono" / "Fira Code" (等宽,支持连字)
- 字号: 正文 16px / line-height 1.75, 代码 14px / line-height 1.5, 小字 13px
- 帖子正文 max-w-3xl (768px), 列表页 max-w-5xl (1024px)

### 布局

桌面端: Header (logo + 搜索 + 用户) + 主内容区 (左列表/详情 + 右侧边栏 256px) + Footer

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Header]  Logo CNode  [搜索框]            [发帖] [登录/头像]        │
├─────────────────────────────────────────────────────────────────────┤
│  [Tab: 全部 分享 问答 招聘 精华]                                     │
├──────────────────────────────────────────┬──────────────────────────┤
│  [话题列表]                               │  [Sidebar]               │
│  ┌────────────────────────────────────┐  │  ┌──────────────────┐    │
│  │ 👤 author   📝 标题                │  │  │ 个人信息 / 登录   │    │
│  │ [tab] [顶] [精]                    │  │  │ 积分 / 发布数    │    │
│  │ 💬 12  👁 345  · 3h ago            │  │  └──────────────────┘    │
│  └────────────────────────────────────┘  │  ┌──────────────────┐    │
│  [← 1 2 3 下一页 →]                       │  │ 无人回复的话题   │    │
│                                          │  └──────────────────┘    │
└──────────────────────────────────────────┴──────────────────────────┘
```

移动端: 汉堡菜单 + 横向滚动 Tab + 底部导航栏 (首页/发帖/消息/我的)。侧边栏内容 (无人回复、作者其他话题) 移到帖子详情正文下方。

### 组件体系

shadcn/ui 基础组件: Button, Input, Textarea, Dialog, DropdownMenu, Tabs, Avatar, Badge, Card, Tooltip, Toast, Pagination, Sheet, Skeleton

自定义业务组件:

| 分类       | 组件                                                                                                       | 职责                   |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ---------------------- |
| Layout     | Header, Sidebar, MobileNav, Footer                                                                         | 页面框架               |
| Topic      | TopicList, TopicListItem, TopicDetail, TopicEditor, TopicTabs                                              | 话题 CRUD              |
| Reply      | ReplyList, ReplyItem, ReplyEditor                                                                          | 回复列表 + inline 编辑 |
| User       | UserCard, UserHeader, Avatar                                                                               | 用户展示               |
| Common     | MarkdownView, MarkdownEditor, CodeBlock, TimeAgo, Pagination, SearchBar, TagBadge, StatusBadge, EmptyState | 通用                   |
| Moderation | ReportDialog, AdminPanel, AuditLog                                                                         | 审核                   |
| Auth       | SignInForm, SignUpForm, GithubButton                                                                       | 认证                   |

### Markdown 渲染

- 渲染: react-markdown + rehype-sanitize
- 代码高亮: Shiki (VS Code 风格), CodeBlock 组件含复制按钮 + 长代码折叠
- 图片: 点击放大 (lightbox), 限制最大宽度
- 外链: rel="nofollow noopener", 新标签打开
- @提及: 前端组件渲染时 linkUsers

### Markdown 编辑器

- @uiw/react-md-editor 或 ByteMD
- 分屏预览 (左编辑右预览,可切换)
- 工具栏 (加粗/链接/图片/代码块)
- 自动保存 (每 30s 存草稿)
- 图片粘贴/拖拽上传 (获取 presigned URL 直传)
- @提及自动补全 (输入 @ 弹出用户名列表)

### 暗色模式

- 方案: next-themes (class 策略), TailwindCSS darkMode: 'class'
- 切换: Header 的 ThemeToggle 组件 (太阳/月亮图标)
- 默认跟随系统 (prefers-color-scheme: dark),用户可手动覆盖存 localStorage
- SSR: suppressHydrationWarning 防止闪烁

### 交互优化 (对比老版 CNode)

| 老版痛点          | 新设计改进                                         |
| ----------------- | -------------------------------------------------- |
| EpicEditor 已停维 | @uiw/react-md-editor + 自动保存 + 图片拖拽         |
| 回复后整页刷新    | RRv8 action, client-side 重新验证,不刷新整页       |
| 翻页整页刷新      | client-side navigation, URL 同步,只更新列表区      |
| 搜索跳 Google     | 站内搜索框, Cmd+K 快捷键,结果在站内展示            |
| 无实时消息提示    | Header 铃铛 + 未读数 badge + 下拉最近 5 条         |
| 列表项信息杂乱    | 头像 + 标题为主,meta 行次要,badge 不抢视觉         |
| 500 文本错误      | ErrorBoundary (404 空状态 / 403 无权限 / 500 重试) |

### 加载状态

使用 shadcn Skeleton 组件 (pulse 动画),配合 RRv8 的 HydrateFallback。列表页和详情页都有 skeleton 占位,避免白屏。

### 路由 → 页面 → 组件映射 (前台)

| Route                   | Page 组件           | 主要子组件                |
| ----------------------- | ------------------- | ------------------------- |
| /                       | _index.tsx          | TopicList + TopicTabs     |
| /topic/:tid             | topic.$tid.tsx      | TopicDetail + ReplyList   |
| /topic/create           | topic.create.tsx    | TopicEditor               |
| /topic/:tid/edit        | topic.$tid.edit.tsx | TopicEditor               |
| /reply/:id/edit         | reply.$id.edit.tsx  | ReplyEditor (inline)      |
| /user/:name             | user.$name.tsx      | UserHeader + TopicList    |
| /user/:name/collections | user.$name.coll.tsx | TopicList                 |
| /user/:name/topics      | user.$name.top.tsx  | TopicList                 |
| /user/:name/replies     | user.$name.rep.tsx  | ReplyList                 |
| /setting                | setting.tsx         | SettingsForm              |
| /signin                 | signin.tsx          | SignInForm + GithubButton |
| /signup                 | signup.tsx          | SignUpForm + Turnstile    |
| /auth/github/callback   | auth.github.tsx     | OAuth callback            |
| /my/messages            | my.messages.tsx     | MessageList               |
| /search                 | search.tsx          | SearchResults             |
| /about, /faq, /getstart | about.tsx etc       | StaticPage                |
| /rss                    | rss.tsx             | (resource route XML)      |
| /sitemap.xml            | sitemap.tsx         | (resource route XML)      |

## 管理后台设计

### 布局

管理后台在同一个 RRv8 应用内,走 `/admin/*` 路由,使用独立的 adminLayout (侧边栏 + 内容区)。所有 `/admin/*` 路由的 loader 检查权限,非管理员/版主 302 跳首页。

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Header]  CNode Admin           [回到前台] [暗色切换] [👤 admin]    │
├──────────────┬──────────────────────────────────────────────────────┤
│  [Sidebar]   │  [内容区]                                            │
│  📊 概览      │                                                      │
│  📝 内容管理  │  当前页面内容                                         │
│    话题列表  │                                                      │
│    回复列表  │                                                      │
│    巡检结果  │                                                      │
│  👤 用户管理  │                                                      │
│    用户列表  │                                                      │
│    封禁管理  │                                                      │
│  🚩 举报队列  │                                                      │
│  📛 敏感词     │                                                      │
│  📋 审计日志  │                                                      │
│  ⚙️  设置     │                                                      │
│    版主配置  │                                                      │
│    系统配置  │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘
```

### 权限分层 (配置式, 不建角色表)

```
config.admins = ['admin_loginname']          ← 超级管理员
config.moderators = ['mod1', 'mod2']          ← 版主
```

| 权限                         | 超级管理员 | 版主 |
| ---------------------------- | ---------- | ---- |
| 举报队列处理                 | ✅         | ✅   |
| 巡检结果处理 (恢复/确认删除) | ✅         | ✅   |
| 话题/回复 隐藏/删除          | ✅         | ✅   |
| 临时禁言 (7天/30天)          | ✅         | ✅   |
| 置顶/加精/锁定               | ✅         | ✅   |
| 版主配置 / 系统配置          | ✅         | ❌   |
| 敏感词管理                   | ✅         | ❌   |
| IP 封禁                      | ✅         | ❌   |
| 审计日志查看                 | ✅         | ❌   |
| 重置用户密码                 | ✅         | ❌   |
| 永久封禁                     | ✅         | ❌   |

### 管理后台路由 → 页面

| Route             | Page 组件          | 主要内容                                                 |
| ----------------- | ------------------ | -------------------------------------------------------- |
| /admin            | admin._index.tsx   | 概览: 统计卡片 + 7天趋势 + 待处理事项 + 最近审计         |
| /admin/topics     | admin.topics.tsx   | 话题管理: 搜索/筛选/批量操作 (隐藏/删除/置顶/加精)       |
| /admin/moderation | admin.mod.tsx      | 巡检结果: 命中词高亮 + 恢复/确认删除/标记误报            |
| /admin/users      | admin.users.tsx    | 用户管理: 搜索/禁言/解禁/重置密码/删除发言               |
| /admin/bans       | admin.bans.tsx     | 封禁管理: 用户封禁列表 + IP 封禁列表 (含 CIDR)           |
| /admin/reports    | admin.reports.tsx  | 举报队列: 内容预览 + 确认违规/驳回/封禁作者              |
| /admin/keywords   | admin.keywords.tsx | 敏感词管理: 增删/批量导入/分类/命中统计                  |
| /admin/audit      | admin.audit.tsx    | 审计日志: 按操作人/动作/时间筛选, 保留 90 天             |
| /admin/settings   | admin.settings.tsx | 系统设置: 注册开关/版主配置/新用户限制/巡检配置/限流配置 |

### 概览页 `/admin`

统计卡片 (当前值):

- 用户总数、话题总数、回复总数
- 今日发帖、今日回复、今日注册
- 待审举报、巡检命中 (待处理)

7 天趋势图 (折线图, 可切换指标):

- 新增话题数 / 新增回复数 / 新增注册用户数 (三条线)
- 活跃用户数 (发过帖或回过复的去重用户)
- 使用 recharts 或轻量 sparkline

最近注册用户 (最近 10 条):

- 头像 + 用户名 + 注册时间 + 状态 (正常/未激活/已封禁)
- 点击跳转用户主页

最近发布话题 (最近 10 条):

- 标题 + 作者 + 发布时间 + 状态
- 点击跳转话题

待处理事项:

- 待审举报数 (跳转举报队列)
- 巡检命中待处理数 (跳转巡检结果)
- 自动封禁用户数 (跳转封禁管理)

最近审计操作 (最近 10 条):

- 时间 / 操作人 / 动作 / 目标 / 结果

### 话题管理 `/admin/topics`

搜索: 标题/作者/ID。筛选: 状态 (正常/已隐藏/已删除)、Tab、日期范围。
表格列: 复选框、标题、作者、Tab、状态、回复数、操作。
批量操作: 批量隐藏/删除/置顶/加精。
行操作下拉: 查看/编辑/置顶/加精/锁定/隐藏/恢复/删除/查看编辑历史。

### 巡检结果 `/admin/moderation`

筛选: 全部/待处理/已处理。
每条展示: 话题或回复的标题/作者/巡检时间/命中敏感词/内容预览 (命中词高亮)。
操作: 查看完整内容/恢复显示/确认删除/标记误报。

### 用户管理 `/admin/users`

搜索: 用户名/邮箱/ID。筛选: 状态 (正常/警告/禁言/封禁)。排序: 注册时间/积分/发帖数。
表格列: 用户 (头像+名)、邮箱、积分、话题数、回复数、封禁状态、操作。
行操作下拉: 查看主页/重置密码 (弹窗)/警告/临时禁言 (7天/30天)/永久封禁/解禁/删除所有发言/查看操作历史。

### 封禁管理 `/admin/bans`

双 Tab: 用户封禁 + IP 封禁。
用户封禁: 用户/级别/开始时间/到期时间/原因/解禁按钮。手动封禁弹窗 (用户名+级别+原因)。
IP 封禁: 添加 IP 或 CIDR 段。列表: IP/段/封禁时间/原因/自动或手动/移除。

### 举报队列 `/admin/reports`

筛选: 全部/待处理/已确认/已驳回,按类型,按日期。
每条展示: 举报类型/举报人 (多人时列全部)/时间/被举报内容预览 (含完整链接)/补充说明。
操作: 确认违规→隐藏内容/确认违规→删除内容/驳回/封禁作者 (弹窗选级别)。
自动隐藏: 同一内容被 N 人举报时自动 muted,在队列中标记。

### 敏感词管理 `/admin/keywords`

搜索 + 分类筛选。
表格: 敏感词/分类/命中次数/添加时间/编辑/删除。
添加: 单个输入。批量导入: 文本框一行一个词,可选 `词,分类` 格式。

### 审计日志 `/admin/audit`

搜索 + 筛选: 操作人/动作类型/日期范围。
表格: 时间/操作人/动作/目标/结果。
保留 90 天,分页查看。

### 系统设置 `/admin/settings`

五个 Tab:

- 注册配置: 是否开放注册 (开关) / 关闭注册时跳转 GitHub OAuth / 每 IP 每天注册上限。
- 版主配置: 管理员/版主 loginname 列表 (对应 config.admins / config.moderators),可增删。
- 新用户限制: 注册 N 小时后可发帖 / 回复 N 条后可发帖 / 积分达 N 可发帖 (满足任一即可)。
- 巡检配置: 巡检频率 (Cron) / 自动隐藏阈值 (被举报 N 次) / 归档天数 (N 天无回复自动归档)。
- 限流配置: 每用户每天发帖/回复次数 / 每 IP 每天注册次数。
