# Deployment

本文档描述生产环境的部署方式。

## 后端: docker-compose

后端通过 docker-compose 编排,所有服务在海外服务器上运行:

```bash
# 服务器上
docker pull ghcr.io/<owner>/cnode-api:latest
docker compose up -d
```

### 服务编排

| 服务     | 镜像                             | 职责                                 |
| -------- | -------------------------------- | ------------------------------------ |
| caddy    | caddy:2-alpine                   | 反向代理 + ACME 证书 (Let's Encrypt) |
| api      | ghcr.io/<owner>/cnode-api:latest | Hono API server                      |
| postgres | postgres:16-alpine               | PostgreSQL 数据库                    |
| redis    | redis:7-alpine                   | 缓存/session/限流                    |

所有服务在 `cnode-internal` 内网通信,Caddy 监听 80/443 对外。

### 环境变量

所有配置通过 `.env` 文件注入,docker-compose.yml 零 environment。详见 `.env.example`。

### 镜像构建

1. `apps/api/Dockerfile` 多阶段构建
2. GitHub Actions 自动构建并推送到 ghcr.io
3. 服务器 `docker pull` + `docker compose up -d` 更新

## 前端: Cloudflare Workers

前端通过 `@cloudflare/vite-plugin` 部署到 CF Workers:

```bash
cd apps/web
pnpm run deploy    # wrangler deploy
```

部署到 `next.cnodejs.org`。

## DNS 切换

新应用在 `next.cnodejs.org` 上线,与老 `cnodejs.org` 并行运行:

1. 验证 `next.cnodejs.org` + `api.cnodejs.org` 功能正常
2. 运行数据迁移脚本
3. 将 `cnodejs.org` DNS 切到 CF Workers 新前端
4. 老 nodeclub 下线
