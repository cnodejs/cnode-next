## MODIFIED Requirements

### Requirement: Developers SHALL provide PostgreSQL and Redis connection settings
Developers MUST be able to run cnode-next against PostgreSQL/Redis by providing connection settings through the unified root `.env` contract. 应用配置 MUST 使用 `CNODE_*`，PostgreSQL 与 Redis MUST 分别使用 `POSTGRES_*` 与 `REDIS_*`，且不得接受旧变量 fallback。

#### Scenario: Developer configures database/cache endpoints
- **WHEN** a developer needs to run the project locally
- **THEN** documentation MUST instruct them to provide PostgreSQL host, port, database, user and password via `POSTGRES_HOST`、`POSTGRES_PORT`、`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`
- **AND** documentation MUST instruct them to provide Redis host, port, database index and optional password via `REDIS_HOST`、`REDIS_PORT`、`REDIS_DB`、`REDIS_PASSWORD`
- **AND** `.env.local` or app-local dotenv files such as `apps/web/.env` or `apps/web/.env.local` MUST NOT be required for normal local startup

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
