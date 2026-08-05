## ADDED Requirements

### Requirement: API 必须提供生产健康端点

API 服务 SHALL 提供 `GET /health` 作为生产健康检查入口，且该入口 MUST 不依赖认证。

#### Scenario: 浅健康检查成功

- **WHEN** 调用 `GET /health`
- **THEN** API MUST 返回 2xx 响应
- **AND** 响应 MUST 包含 `ok`、`service`、`version`、`commit` 和 `buildTime`
- **AND** 响应 MUST NOT 包含环境变量、数据库地址、token、secret 或内部错误堆栈

#### Scenario: compose 使用健康端点

- **WHEN** 生产 `api` 容器执行 healthcheck
- **THEN** healthcheck MUST 请求 API 专用 `/health` 端点
- **AND** healthcheck MUST NOT 复用 `/api/v1/auth/config` 或其他业务接口

### Requirement: 构建版本信息必须可追溯

API 和 Web 生产构建 SHALL 注入当前 commit 与 build time，使部署后的服务状态可反查到源码版本。

#### Scenario: API 暴露构建版本

- **WHEN** 运维查看 API `/health` 响应
- **THEN** 响应中的 `commit` MUST 对应当前运行镜像构建时的 Git commit
- **AND** `buildTime` MUST 对应镜像构建时间或发布流水线生成时间

#### Scenario: Web 运行时可观测版本

- **WHEN** 运维检查 Web 生产运行状态
- **THEN** Web 服务 MUST 提供可观测的 commit 或 build metadata
- **AND** 该 metadata MUST NOT 要求为了变更 API 域名而重新构建 Web 镜像

### Requirement: 健康检查必须区分进程可用与依赖状态

健康能力 SHALL 明确区分服务进程可用和 PostgreSQL/Redis 等依赖检查，避免短暂依赖抖动导致容器被错误重启。

#### Scenario: 默认健康检查不执行深度依赖检查

- **WHEN** 容器运行默认 healthcheck
- **THEN** API MUST 只验证进程和 HTTP 处理能力可用
- **AND** PostgreSQL 或 Redis 深度检查 MUST NOT 成为默认容器重启条件，除非文档和 compose 明确选择深度模式

#### Scenario: 深度健康检查可用于部署 smoke

- **WHEN** 部署 runbook 需要验证 PostgreSQL 或 Redis 可用性
- **THEN** 系统 MAY 提供单独的深度检查模式或 smoke 命令
- **AND** 深度检查失败 MUST 返回可观测失败状态但不得泄漏 secret
