## 1. Web 运行时配置

- [x] 1.1 在 Web SSR 根文档中注入运行时公开配置，使浏览器可读取 `.env` 中的 `APP_API_BASE_URL`。
- [x] 1.2 调整 `apps/web/app/lib/api-client.ts`，浏览器侧优先读取运行时注入配置，不再依赖 `import.meta.env.VITE_APP_API_BASE_URL`。
- [x] 1.3 调整上传客户端等浏览器侧 API 调用，确认全部复用新的运行时 API base 获取逻辑。
- [x] 1.4 从 `apps/web/Dockerfile` 移除 `VITE_APP_API_BASE_URL` build arg 和相关 `ENV`。

## 2. 生产 Compose Pull-Only

- [x] 2.1 从 `docker-compose.prod.yml` 的 `api`、`web`、`worker` 服务移除 `build:` 配置。
- [x] 2.2 从 `docker-compose.prod.yml` 的 `migrate-schema`、`migrate-data`、`reconcile` 服务移除 `build:` 和 migration target 构建配置。
- [x] 2.3 将 Web 默认镜像改为 `ghcr.io/cnodejs/cnode-web:latest`。
- [x] 2.4 确认 `api`、`worker` 和 migration/reconcile 服务继续使用 `CNODE_API_IMAGE`。

## 3. GitHub Actions 镜像发布

- [x] 3.1 新增 GitHub Actions workflow，使用 `GITHUB_TOKEN` 登录 GHCR，并授予 `contents: read`、`packages: write` 权限。
- [x] 3.2 在 workflow 中构建并推送 `ghcr.io/cnodejs/cnode-api:latest`。
- [x] 3.3 在 workflow 中构建并推送 `ghcr.io/cnodejs/cnode-web:latest`。
- [x] 3.4 确认 workflow 不包含 SSH、远程服务器地址、远程 `docker compose` 命令或部署 secrets。

## 4. 文档和验证

- [x] 4.1 更新 `docs/deployment.md`，说明 GitHub Actions 只构建推送镜像，服务器手动执行 `pull` 和 `up --no-build`。
- [x] 4.2 更新环境变量说明，明确 `APP_API_INTERNAL_BASE_URL` 用于 SSR 内网请求，`APP_API_BASE_URL` 用于浏览器运行时公开 API 地址。
- [x] 4.3 运行 `pnpm --filter @cnode/web build`，确认 Web 镜像不需要 `VITE_APP_API_BASE_URL` 也能构建。
- [x] 4.4 运行 `docker compose -f docker-compose.prod.yml config`，确认生产 compose 不包含应用服务 `build:`。
- [ ] 4.5 首次推送后在远程服务器执行 `docker compose -f docker-compose.prod.yml pull api web worker` 和 `docker compose -f docker-compose.prod.yml up -d --no-build api web worker`，确认不会触发服务器本地构建。
