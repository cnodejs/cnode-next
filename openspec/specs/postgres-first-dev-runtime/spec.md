# postgres-first-dev-runtime Specification

## Purpose
定义 cnode-next 的数据库运行时策略、开发连接配置、本地 secret 边界和 PostgreSQL boolean 兼容要求；项目只允许 PostgreSQL 作为开发、测试、迁移验证、CI 和生产数据库。

## Requirements
### Requirement: Development runtime SHALL use PostgreSQL as the default migration validation database
The project MUST document PostgreSQL as the only supported database for current development, testing, migration validation, CI verification, and production runtime work.

#### Scenario: Developer prepares a local runtime
- **WHEN** a developer follows the development setup documentation
- **THEN** the documented path MUST direct them to a PostgreSQL-backed runtime
- **AND** the documented path MUST NOT offer SQLite as a fallback runtime

#### Scenario: SQLite behavior is referenced
- **WHEN** active code, scripts, docs, or specs mention SQLite
- **THEN** the mention MUST be removed unless it is in archived historical change records or generic OpenSpec tooling instructions outside application scope

#### Scenario: Runtime database client is created
- **WHEN** API、worker、migration 或测试验证脚本创建数据库连接
- **THEN** it MUST create a PostgreSQL-backed client
- **AND** it MUST NOT branch on `DB_DIALECT` or import `better-sqlite3`

### Requirement: Developers SHALL provide PostgreSQL and Redis connection settings
Developers MUST be able to run cnode-next against PostgreSQL/Redis by providing connection settings, regardless of whether the service endpoint comes from local docker-compose or a secure tunnel.

#### Scenario: Developer configures database/cache endpoints
- **WHEN** a developer needs to run the project locally
- **THEN** documentation MUST instruct them to provide PostgreSQL/Redis host, port, database, and credentials via local environment variables

#### Scenario: Endpoint comes from a tunnel
- **WHEN** a developer validates migrated data through a remote rehearsal database
- **THEN** documentation MUST treat the tunnel as a local endpoint and MUST NOT require exposing database ports publicly

### Requirement: Local secrets SHALL remain untracked
Local database credentials and tunnel-specific values MUST be stored outside tracked files.

#### Scenario: Local override file is used
- **WHEN** a developer stores local PostgreSQL connection values
- **THEN** the values MUST be stored in an ignored `.env.local` file

### Requirement: API boolean 状态必须兼容 PostgreSQL

读写 boolean 数据库列的核心 API 路由 SHALL 使用与验收迁移 runtime 中 PostgreSQL schema 兼容的谓词和值。

#### Scenario: 消息已读状态使用 PostgreSQL boolean

- **WHEN** API 在 PostgreSQL-backed runtime 中统计、列出或标记消息已读
- **THEN** 它 MUST 使用 boolean-compatible values 比较和赋值 `messages.has_read`
- **AND** 它 MUST NOT 发出 `boolean = integer` 谓词

#### Scenario: 话题和回复可见性使用 PostgreSQL boolean

- **WHEN** API 在 PostgreSQL-backed runtime 中过滤可见话题或回复
- **THEN** 它 MUST 使用 boolean-compatible values 比较 `deleted`、`top`、`good`、`lock` 等 boolean 列
- **AND** 话题详情加载回复时 MUST NOT 因为 `replies.deleted` 是 boolean 而失败

#### Scenario: 管理员状态变更使用 PostgreSQL boolean

- **WHEN** 管理员在 PostgreSQL-backed runtime 中切换话题或用户状态
- **THEN** API MUST 为 `top`、`good`、`lock`、`deleted`、`is_block` 写入 boolean-compatible values
