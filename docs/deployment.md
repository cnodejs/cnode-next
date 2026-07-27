# Deployment

本文档描述生产环境的部署方式。

## 容器镜像发布

GitHub Actions 负责在 GitHub runner 上构建并推送生产镜像到 GHCR：

| 镜像 | Dockerfile |
| ---- | ---------- |
| `ghcr.io/cnodejs/cnode-api:latest` | `apps/api/Dockerfile` |
| `ghcr.io/cnodejs/cnode-web:latest` | `apps/web/Dockerfile` |

workflow 只构建和推送镜像，不保存服务器 SSH 凭据，不连接生产服务器，也不执行远程 `docker compose` 部署命令。

## 后端: docker-compose

后端通过 docker-compose 编排,所有服务在海外服务器上运行:

```bash
# 服务器上
docker compose -f docker-compose.prod.yml pull api web worker
docker compose -f docker-compose.prod.yml up -d --no-build postgres redis api web worker
```

### 服务编排

| 服务     | 镜像                             | 职责                                 |
| -------- | -------------------------------- | ------------------------------------ |
| api      | ghcr.io/cnodejs/cnode-api:latest | Hono API server                      |
| web      | ghcr.io/cnodejs/cnode-web:latest | React Router SSR frontend            |
| worker   | ghcr.io/cnodejs/cnode-api:latest | 内容巡检扫描任务和定时调度           |
| postgres | postgres:18-bookworm             | PostgreSQL 数据库                    |
| redis    | redis:7-bookworm                 | 缓存/session/限流/worker 锁          |

所有服务在 `cnode-internal` 内网通信。对外入口可由既有反向代理接入 API/Web，本变更不要求新增 Cloudflare Workers 部署。

生产 `docker-compose.prod.yml` 不包含应用服务 `build:` 配置。`api`、`worker`、`migrate-schema`、`migrate-data` 和 `reconcile` 通过 `CNODE_API_IMAGE` 覆盖 API 镜像，`web` 通过 `CNODE_WEB_IMAGE` 覆盖 Web 镜像。标准生产部署必须使用 `pull` 和 `up --no-build`，避免在同机运行的 legacy nodeclub、PostgreSQL 和 Redis 旁边执行 Docker build。

### 内容巡检 Worker

`worker` 使用同一个 API 镜像，通过 `pnpm --filter @cnode/api worker:moderation` 启动。扫描任务按主键游标分批读取话题和回复，每批结束后写入巡检命中并休眠，避免一次性全库扫描影响线上请求。

相关环境变量：

```bash
MODERATION_SCHEDULE_ENABLED=0       # 1 开启定时增量扫描
MODERATION_SCHEDULE_INTERVAL_MS=3600000
MODERATION_SCAN_BATCH_SIZE=200
MODERATION_SCAN_THROTTLE_MS=500
MODERATION_SCAN_MAX_BATCHES_PER_RUN=100
```

生产出现资源压力时，可先停止 `worker` 服务或调大 `MODERATION_SCAN_THROTTLE_MS`；`api` 和 `web` 不依赖 worker 常驻可用。

### 环境变量

所有敏感配置通过 `.env` 文件注入，不提交真实值。详见 `.env.example`。

Web API 地址分为服务端内网地址和浏览器公开地址：

```bash
APP_API_INTERNAL_BASE_URL=http://api:3001      # React Router SSR loader 在 web 容器内访问 API
APP_API_BASE_URL=https://api.cnodejs.org       # 注入到 HTML，供浏览器侧 apiFetch 和上传客户端使用
```

`APP_API_INTERNAL_BASE_URL` 由生产 compose 设置为 `http://api:3001`。`APP_API_BASE_URL` 来自服务器 `.env`，Web 根文档会把它注入到 `window.__CNODE_CONFIG__.apiBaseUrl`。Web 镜像不使用 `VITE_APP_API_BASE_URL` 等构建时 API 地址，因此同一个 `ghcr.io/cnodejs/cnode-web:latest` 可在不同服务器环境复用。

### 镜像构建

`apps/api/Dockerfile` 和 `apps/web/Dockerfile` 只在 GitHub Actions 或显式本地构建时使用。生产服务器不通过 compose build 构建镜像。

服务器执行 migration 或 reconcile 时同样使用已拉取的 API 镜像：

```bash
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate-schema
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate-data
docker compose -f docker-compose.prod.yml --profile migrate run --rm reconcile
```

## 前端

当前阶段先保障本地/预发布运行与迁移数据验证。`apps/web` 保留 `wrangler.jsonc` 与 `@cloudflare/vite-plugin` 配置，但 Cloudflare Workers 部署暂不纳入当前阶段。

本地验证：

```bash
pnpm dev
```

## DNS 切换

切换前需要完成：

1. 配置生产 `.env`：cookie domain、SMTP、OSS、GitHub OAuth、PostgreSQL、Redis。
2. 执行最终 Mongo-to-PostgreSQL 全量迁移和对账。
3. 验证新 API/Web 与老 `cnodejs.org` 并行运行正常。
4. 按实际入口方案切换 DNS/反向代理。
5. 老 nodeclub 下线。

Cloudflare Workers 发布和 release gate 属于后续单独提案。

## 文件上传与静态域名

历史站点使用两个静态域名：

| 域名 | 职责 |
| ---- | ---- |
| `static.cnodejs.org` | 用户上传图片公开访问域名，旧站七牛 `qn_access.origin` 指向这里 |
| `static2.cnodejs.org` | 站点静态资源 CDN，例如 logo、CSS/JS/public assets |

新站上传继续使用 `static.cnodejs.org` 作为公开 URL。`POST /api/v1/upload/presign` 使用 `.env` 中的 OSS AK/SK/bucket 生成 OSS signed PUT URL，并返回：

- `url`: 最终插入 Markdown 的公开图片地址，形如 `https://static.cnodejs.org/cnode-next/uploads/...`
- `upload_url`: 浏览器直传 OSS 的 signed PUT URL
- `headers`: 上传时必须携带的请求头

相关环境变量：

```bash
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_REGION=oss-cn-hongkong
OSS_ENDPOINT=
OSS_STATIC_HOST=https://static.cnodejs.org
OSS_UPLOAD_PREFIX=cnode-next/uploads
OSS_UPLOAD_EXPIRES=600
```

`static2.cnodejs.org` 不用于用户上传。
新上传对象默认写入 `cnode-next/uploads/` 前缀，文件名使用 UUID，不包含日期路径，避免与历史七牛/OSS 文件 key 冲突。
