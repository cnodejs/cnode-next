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
Developers MUST be able to run cnode-next against PostgreSQL/Redis by providing connection settings through the unified root `.env` contract, regardless of whether the service endpoint comes from local containers or a secure tunnel. 应用配置 MUST 使用 `CNODE_*`，PostgreSQL 与 Redis MUST 分别使用 `POSTGRES_*` 与 `REDIS_*`，且不得接受旧变量 fallback。

#### Scenario: Developer configures database/cache endpoints
- **WHEN** a developer needs to run the project locally
- **THEN** documentation MUST instruct them to provide PostgreSQL host, port, database, user and password via `POSTGRES_HOST`、`POSTGRES_PORT`、`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`
- **AND** documentation MUST instruct them to provide Redis host, port, database index and optional password via `REDIS_HOST`、`REDIS_PORT`、`REDIS_DB`、`REDIS_PASSWORD`
- **AND** `.env.local` or app-local dotenv files such as `apps/web/.env` or `apps/web/.env.local` MUST NOT be required for normal local startup

#### Scenario: Endpoint comes from a tunnel
- **WHEN** a developer validates migrated data through a remote rehearsal database
- **THEN** documentation MUST treat the tunnel as a local endpoint and MUST NOT require exposing database ports publicly
- **AND** the remote or rehearsal endpoint MUST be selected through an explicit env profile rather than the default `pnpm dev` environment

#### Scenario: Workspace dev commands load environment consistently
- **WHEN** a developer starts Web and API together with `pnpm dev`
- **THEN** both applications MUST load local environment values from the same repository root contract
- **AND** Web, API, and DB scripts MUST NOT depend on separate app-local dotenv files for shared values such as `CNODE_API_BASE_URL`, `POSTGRES_HOST`, `REDIS_HOST`, or auth cookie settings
- **AND** runtime consumers MUST NOT fall back to `APP_*`、`DB_*` or `DATABASE_URL`

#### Scenario: Package script invokes framework or database CLI
- **WHEN** a package script invokes a CLI that needs application runtime environment, such as `react-router`, `drizzle-kit`, `tsx` application scripts, or API worker scripts
- **THEN** the CLI MUST receive the repository root environment contract through its natural config file or script entrypoint
- **AND** the default package script command shape MUST NOT be changed solely to wrap the CLI with an env launcher

#### Scenario: Package script runs unrelated quality tooling
- **WHEN** a package script runs tooling that does not need application runtime environment, such as lint, typecheck, format, secret scanning, or production compose template validation
- **THEN** the script SHOULD NOT load local dotenv files
- **AND** it MUST NOT require local secrets to succeed

### Requirement: Local secrets SHALL remain untracked
Local database credentials, tunnel-specific values, auth secrets, OAuth secrets, SMTP secrets, OSS secrets, and other private runtime values MUST be stored outside tracked files and MUST NOT be printed, copied into scripts, or overwritten by automated migration steps.

#### Scenario: Local override file is used
- **WHEN** a developer stores local PostgreSQL connection values
- **THEN** the values MUST be stored in an ignored `.env` file at the repository root
- **AND** `.env.example` MUST remain a placeholder template without real secrets

#### Scenario: Existing local dotenv files are present
- **WHEN** `.env`, `.env.local`, `apps/web/.env`, `apps/web/.env.local`, or other ignored dotenv files already exist in a developer workspace
- **THEN** implementation steps MUST NOT delete, overwrite, print, or commit their contents
- **AND** any cleanup or migration of real local dotenv files MUST require explicit human confirmation outside automated implementation

#### Scenario: Environment values are supplied externally
- **WHEN** CI, shell, compose, or a hosting runtime has already supplied an environment variable
- **THEN** local dotenv loading MUST NOT override that existing value
- **AND** the externally supplied value MUST remain authoritative for that process

#### Scenario: Deprecated local override file exists
- **WHEN** repository root `.env.local` exists in a developer workspace
- **THEN** default local loading MUST ignore it
- **AND** implementation MUST NOT delete, overwrite, print, or migrate it without explicit human confirmation

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
