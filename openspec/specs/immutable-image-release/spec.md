# immutable-image-release Specification

## Purpose
TBD - created by archiving change reach-production-grade-release-readiness. Update Purpose after archive.
## Requirements
### Requirement: 生产镜像必须以不可变标识发布
CI SHALL 为 API 和 Web 生产镜像发布 commit SHA tag 或 digest，使每个生产部署都能精确追溯到源码提交。

#### Scenario: API 镜像发布 SHA tag
- **WHEN** main 分支通过发布验证并构建 API 镜像
- **THEN** CI MUST 推送 `ghcr.io/cnodejs/cnode-api:sha-<commit>` 或记录等价 image digest
- **AND** 该 tag 或 digest MUST 对应构建时的 Git commit

#### Scenario: Web 镜像发布 SHA tag
- **WHEN** main 分支通过发布验证并构建 Web 镜像
- **THEN** CI MUST 推送 `ghcr.io/cnodejs/cnode-web:sha-<commit>` 或记录等价 image digest
- **AND** 该 tag 或 digest MUST 对应构建时的 Git commit

### Requirement: 生产部署不得依赖唯一 latest tag
生产 `api`、`web` 和 `worker` 服务 SHALL 使用显式 `CNODE_API_IMAGE` 与 `CNODE_WEB_IMAGE` 指向不可变发布物。

#### Scenario: compose 要求显式生产镜像
- **WHEN** 运维渲染生产 `docker-compose.prod.yml`
- **THEN** `api`、`worker`、`migrate-schema`、`migrate-data` 和 `reconcile` MUST 使用 `CNODE_API_IMAGE` 指向的不可变 API 镜像
- **AND** `web` MUST 使用 `CNODE_WEB_IMAGE` 指向的不可变 Web 镜像

#### Scenario: latest 仅作为便利标签
- **WHEN** CI 额外推送 `latest`
- **THEN** 生产部署文档 MUST 明确 `latest` 不可作为 D 级生产部署依据
- **AND** 部署审计记录 MUST 使用 SHA tag 或 digest

### Requirement: 回滚必须使用已知旧发布物
生产回滚 SHALL 使用上一次成功部署记录中的旧 SHA tag 或 digest，而不是重新解析 `latest`。

#### Scenario: 部署前记录旧镜像
- **WHEN** 运维开始部署新版本
- **THEN** runbook MUST 要求记录当前运行的 API 和 Web image tag 或 digest
- **AND** 该记录 MUST 可用于失败回滚

#### Scenario: 新版本 smoke 失败后回滚
- **WHEN** 新版本部署后 health 或 smoke 失败
- **THEN** 运维 MUST 将 API/Web 镜像引用恢复到旧 SHA tag 或 digest
- **AND** 回滚后 MUST 重新验证 health 和 smoke

