## MODIFIED Requirements

### Requirement: 生产部署不得依赖唯一 latest tag

生产 `api`、`web` 和 `worker` 服务 SHALL 使用显式 `CNODE_API_IMAGE` 与 `CNODE_WEB_IMAGE` 指向不可变发布物；通过 `docker compose run --rm api` 执行的 schema migration SHALL 复用同一不可变 API 镜像。

#### Scenario: compose 要求显式生产镜像

- **WHEN** 运维渲染生产 `docs/deployment/docker-compose.yml`
- **THEN** `api` 和 `worker` MUST 使用 `CNODE_API_IMAGE` 指向的不可变 API 镜像
- **AND** `web` MUST 使用 `CNODE_WEB_IMAGE` 指向的不可变 Web 镜像
- **AND** 通过 `docker compose run --rm api pnpm db:migrate` 执行的 schema migration MUST 使用相同的 `CNODE_API_IMAGE`

#### Scenario: latest 仅作为便利标签

- **WHEN** CI 额外推送 `latest`
- **THEN** 生产部署文档 MUST 明确 `latest` 不可作为生产部署依据
- **AND** 部署审计记录 MUST 使用 SHA tag 或 digest
