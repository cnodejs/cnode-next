# Deployment

本文档描述生产环境的部署方式。

## 后端: docker-compose

后端通过 docker-compose 编排,所有服务在海外服务器上运行:

```bash
# 服务器上
docker compose -f docker-compose.prod.yml up -d postgres redis api
```

### 服务编排

| 服务     | 镜像                             | 职责                                 |
| -------- | -------------------------------- | ------------------------------------ |
| api      | ghcr.io/<owner>/cnode-api:latest | Hono API server                      |
| postgres | postgres:18-bookworm             | PostgreSQL 数据库                    |
| redis    | redis:7-bookworm                 | 缓存/session/限流                    |

所有服务在 `cnode-internal` 内网通信。对外入口可由既有反向代理接入 API/Web，本变更不要求新增 Cloudflare Workers 部署。

### 环境变量

所有敏感配置通过 `.env` 文件注入，不提交真实值。详见 `.env.example`。

### 镜像构建

`apps/api/Dockerfile` 提供 API 多阶段构建和 migration target。GitHub Actions 构建镜像与推送 ghcr.io 暂不纳入当前阶段，后续单独实现。

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

CI、ghcr.io 镜像推送、Cloudflare Workers 发布和 release gate 属于后续单独提案。

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
