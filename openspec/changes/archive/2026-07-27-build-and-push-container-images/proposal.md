## Why

当前生产 `docker-compose.prod.yml` 同时包含 `image` 和 `build`，远程服务器执行 compose 时仍可能在服务器上构建 API/Web 镜像，导致内存升高并影响同机运行的 nodeclub、PostgreSQL 和 Redis。cnode-next 需要把镜像构建移动到 GitHub Actions，服务器只负责拉取 GHCR 镜像并启动容器。

## What Changes

- 新增 GitHub Actions workflow，在 GitHub runner 上构建并推送 `ghcr.io/cnodejs/cnode-api:latest` 和 `ghcr.io/cnodejs/cnode-web:latest`。
- 生产 compose 移除所有 `build:` 配置，API、Web、worker、migration/reconcile 服务只使用 `image:`。
- Web 镜像默认改为 `ghcr.io/cnodejs/cnode-web:latest`，与 API 镜像统一使用 GHCR。
- GitHub Actions 不 SSH 登录远程服务器，不执行远程部署。
- 服务器部署流程改为手动或服务器侧脚本执行 `docker compose pull` 和 `docker compose up -d --no-build`。
- Web 镜像不再用 `VITE_APP_API_BASE_URL` 作为构建时配置，浏览器侧 API base 必须由服务器 `.env` 中的运行时配置注入。

## Capabilities

### New Capabilities

- `container-image-delivery`: 定义 GitHub Actions 构建/推送容器镜像和生产服务器 pull-only 部署约束。

### Modified Capabilities

- `production-ops`: 生产替代验收矩阵增加容器镜像来源、服务器不构建镜像、Web 运行时 API 配置的验收要求。

## Impact

- 影响 `.github/workflows/` 下新增的镜像构建 workflow。
- 影响 `docker-compose.prod.yml` 的生产服务镜像配置。
- 影响 `apps/web/Dockerfile` 和 Web 运行时配置注入方式。
- 影响 `apps/web/app/lib/api-client.ts` 的浏览器侧 API base 获取逻辑。
- 影响 `docs/deployment.md` 的部署步骤和环境变量说明。

## Non-goals

- 不在 GitHub Actions 中 SSH 登录服务器，也不自动执行远程部署。
- 不引入 sha tag、release tag 或多环境镜像发布策略；本变更只使用 `latest`。
- 不自动运行数据库迁移；migration/reconcile 仍由运维显式执行。
- 不部署 Cloudflare Workers，不改变当前 docker-compose 作为生产运行入口的方案。
- 不优化镜像体积或重写 Dockerfile 分层策略，除非是移除构建时 API URL 所必需的最小调整。
- 不替换 legacy `nodeclub` 的运行方式；`nodeclub/` 仅作为同机资源竞争背景。
