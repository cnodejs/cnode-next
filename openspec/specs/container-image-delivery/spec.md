# container-image-delivery Specification

## Purpose
TBD - created by archiving change build-and-push-container-images. Update Purpose after archive.
## Requirements
### Requirement: GitHub Actions 构建并推送生产容器镜像

系统 MUST 使用 GitHub Actions 在 GitHub runner 上构建 cnode-next 生产容器镜像，并推送到 GitHub Container Registry。workflow MUST 只负责镜像构建和推送，不得连接生产服务器执行部署。

#### Scenario: API 镜像发布到 GHCR latest
- **WHEN** GitHub Actions 在主分支运行容器镜像发布 workflow
- **THEN** workflow MUST 使用 `apps/api/Dockerfile` 构建 API 镜像
- **AND** workflow MUST 推送 `ghcr.io/cnodejs/cnode-api:latest`

#### Scenario: Web 镜像发布到 GHCR latest
- **WHEN** GitHub Actions 在主分支运行容器镜像发布 workflow
- **THEN** workflow MUST 使用 `apps/web/Dockerfile` 构建 Web 镜像
- **AND** workflow MUST 推送 `ghcr.io/cnodejs/cnode-web:latest`

#### Scenario: Workflow 不部署远程服务器
- **WHEN** GitHub Actions 完成镜像推送
- **THEN** workflow MUST NOT SSH 登录生产服务器
- **AND** workflow MUST NOT 执行远程 `docker compose pull` 或 `docker compose up`

### Requirement: 生产服务器只拉取并运行镜像

生产 docker-compose 编排 MUST 只引用已发布镜像，服务器部署流程 MUST 通过 `pull` 和 `up --no-build` 启动服务，避免在同机运行的 nodeclub、PostgreSQL、Redis 旁边执行镜像构建。

#### Scenario: Compose 不包含本地构建定义
- **WHEN** 运维查看 `docker-compose.prod.yml`
- **THEN** `api`、`web`、`worker`、`migrate-schema`、`migrate-data`、`reconcile` 服务 MUST NOT 包含 `build:` 配置
- **AND** 这些服务 MUST 使用 `image:` 引用 GHCR 镜像

#### Scenario: 手动部署拉取最新镜像
- **WHEN** 运维在生产服务器部署新版本
- **THEN** 运维 MUST 执行 `docker compose -f docker-compose.prod.yml pull api web worker`
- **AND** 运维 MUST 执行 `docker compose -f docker-compose.prod.yml up -d --no-build api web worker`
- **AND** 该流程 MUST NOT 在服务器上执行 Docker build

#### Scenario: Migration 任务使用 API 镜像
- **WHEN** 运维执行 `migrate-schema`、`migrate-data` 或 `reconcile`
- **THEN** 这些一次性任务 MUST 使用 `CNODE_API_IMAGE` 指向的 API 镜像
- **AND** 这些任务 MUST NOT 在服务器上通过 compose build migration target

### Requirement: Web 镜像使用运行时 API 配置

Web 镜像 MUST 不依赖构建时 API base URL。SSR 侧和浏览器侧 API 请求都 MUST 根据服务器运行时环境变量决定 API 地址。

#### Scenario: SSR 使用内部 API 地址
- **WHEN** React Router loader 在 Web 容器服务端执行 API 请求
- **THEN** 系统 MUST 优先使用 `APP_API_INTERNAL_BASE_URL`
- **AND** 在生产 compose 中该值 MUST 指向 `http://api:3001`

#### Scenario: 浏览器使用公开 API 地址
- **WHEN** 浏览器侧交互调用 `apiFetch` 或上传客户端请求 API
- **THEN** 系统 MUST 使用从服务器运行时 `.env` 注入到页面的 `APP_API_BASE_URL`
- **AND** 浏览器侧 MUST NOT 依赖 `VITE_APP_API_BASE_URL` 或其他构建时变量决定 API base URL

#### Scenario: 同一 Web 镜像可复用到不同运行环境
- **WHEN** 同一个 `ghcr.io/cnodejs/cnode-web:latest` 镜像在不同服务器环境启动
- **THEN** 浏览器侧 API base MUST 随该环境的 `.env` 变化
- **AND** 不得要求为不同 API 域名重新构建 Web 镜像

