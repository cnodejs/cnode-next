## ADDED Requirements

### Requirement: 镜像部署命令必须使用统一编排入口
项目 SHALL 通过 `deployment/docker-compose.yml` 引用已发布的不可变镜像，并在部署过程中禁止本地镜像构建。

#### Scenario: 拉取待部署镜像
- **WHEN** 维护者准备部署指定版本
- **THEN** `CNODE_API_IMAGE` 和 `CNODE_WEB_IMAGE` MUST 使用 SHA tag 或 digest
- **AND** 拉取命令 MUST 使用 `docker compose -f deployment/docker-compose.yml pull`

#### Scenario: 启动应用服务
- **WHEN** 已发布镜像完成拉取
- **THEN** 启动命令 MUST 使用 `docker compose -f deployment/docker-compose.yml up -d --no-build`
- **AND** Compose 中的应用服务 MUST NOT 包含 `build:` 配置

#### Scenario: 执行 reviewed migration
- **WHEN** 发布包含已审查的 PostgreSQL migration
- **THEN** migration MUST 作为显式的一次性任务使用已发布 API 镜像执行
- **AND** 普通服务启动 MUST NOT 隐式执行 migration
