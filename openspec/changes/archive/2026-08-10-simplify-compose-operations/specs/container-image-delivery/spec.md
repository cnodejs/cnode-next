## MODIFIED Requirements

### Requirement: 部署过程只拉取并运行镜像

生产 docker-compose 编排 MUST 只引用已发布镜像，部署流程 MUST 通过 `pull` 和 `up --no-build` 启动服务，不得在部署过程中构建应用镜像。

#### Scenario: Compose 不包含本地构建定义

- **WHEN** 运维查看 `docs/deployment/docker-compose.yml`
- **THEN** `api`、`web` 和 `worker` 服务 MUST NOT 包含 `build:` 配置
- **AND** 这些服务 MUST 使用 `image:` 引用 GHCR 镜像

#### Scenario: 手动部署拉取指定镜像

- **WHEN** 运维部署新版本
- **THEN** 运维 MUST 设置 `CNODE_API_IMAGE` 和 `CNODE_WEB_IMAGE` 指向 SHA tag 或 digest
- **AND** 运维 MUST 执行 `docker compose -f docs/deployment/docker-compose.yml pull api web worker`
- **AND** 运维 MUST 执行 `docker compose -f docs/deployment/docker-compose.yml up -d --no-build --no-deps api worker` 和等价 Web 命令
- **AND** 该流程 MUST NOT 执行 Docker build

#### Scenario: Schema migration 复用 API 服务定义

- **WHEN** 运维执行 reviewed PostgreSQL schema migration
- **THEN** 命令 MUST 使用 `docker compose run --rm api pnpm db:migrate`
- **AND** 该一次性任务 MUST 使用 `CNODE_API_IMAGE` 指向的 API 镜像
- **AND** 该任务 MUST NOT 通过 compose build migration target
