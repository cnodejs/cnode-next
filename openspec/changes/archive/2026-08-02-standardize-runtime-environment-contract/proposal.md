## Why

cnode-next 当前同时使用泛化的 `APP_*`、`DB_*` 和不一致的 `REDIS_DB` 环境变量，无法从名称稳定判断应用归属、基础设施类型和字段语义，且数据库与 Redis 配置读取散落在应用、Drizzle、迁移脚本和部署文件中。项目需要先建立单一、语义化的环境变量契约，再据此治理实现和部署配置。

## What Changes

- **BREAKING**：应用配置将 `APP_*` 前缀一次性替换为 `CNODE_*`，字段后缀保持原有语义。
- **BREAKING**：PostgreSQL 连接契约一次性替换为 `POSTGRES_HOST`、`POSTGRES_PORT`、`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`，删除 `DB_*` 运行时支持且不提供 alias、fallback 或过渡期。
- Redis 连接契约保持 `REDIS_HOST`、`REDIS_PORT`、`REDIS_DB`、`REDIS_PASSWORD`，集中其解析逻辑但不进行无收益重命名。
- Production Compose 通过 `env_file` 直接注入统一配置，不维护重复 environment 映射。
- 统一 PostgreSQL 和 Redis 配置的解析、必填校验、类型转换和默认值，禁止各消费者自行解释同一变量。
- 同步受版本控制的 env 模板、Compose、脚本、测试、OpenSpec 和文档，使硬切换后的仓库不存在旧运行时变量引用。
- 明确保护开发者真实配置：不得读取、打印、修改、覆盖、删除或自动迁移任何真实 dotenv 文件。

## Capabilities

### New Capabilities

- `runtime-environment-contract`: 定义应用 `CNODE_*`、PostgreSQL `POSTGRES_*`、Redis `REDIS_*` 的语义字段、单一配置入口、vendor adapter 边界和不兼容切换规则。

### Modified Capabilities

- `postgres-first-dev-runtime`: 将 PostgreSQL 和 Redis 的开发、CLI 与运行时配置要求改为新的 `CNODE_*` 契约，并禁止旧变量 fallback。
- `explicit-migration-rehearsal-profile`: 将显式 migration profile 文档改为新的 PostgreSQL 变量，同时加强真实 dotenv 文件保护。

## Impact

### Change Scope

- In scope：`packages/db`、`apps/api`、根目录迁移脚本、部署 preflight、Drizzle 配置、`deployment/docker-compose.yml`、受版本控制的 env 示例、相关测试、`docs/` 和活跃 OpenSpec specs。
- Out of scope：修改任何真实 `.env*` 文件或外部配置、执行部署、轮换凭据、运行数据库迁移、修改 PostgreSQL 数据或数据卷、改变 legacy `nodeclub/` 或 `egg-cnode/`。
- Affected systems：本地开发启动、API、moderation worker、Drizzle CLI、schema migration、seed、MongoDB 到 PostgreSQL 迁移验证、生产 Compose 配置。
- High-risk categories：生产环境变量硬切换、数据库凭据映射、CLI 配置一致性、意外连接错误和 secret 泄漏。

### Non-goals

- 本 change 不修改业务功能、数据库 schema、论坛线上行为或 legacy 兼容行为。
- 不引入 `DATABASE_URL`、多数据库 dialect、SQLite fallback 或永久兼容别名。
- 不在本 change 中完成 SMTP、OSS、Auth 等所有环境变量的全面重命名；它们仅受通用命名规则约束，后续按独立治理范围处理。
- 不自动迁移开发者或生产环境中的真实 secret；生产切换必须由运维在部署窗口人工一次性完成。

### Documentation Impact

- 更新 `docs/development.md`、迁移文档和相关运维文档中的 PostgreSQL、Redis 与显式 profile 示例。
- 更新 `.env.example` 与 `deployment/.env.production.example`，仅保留占位值。
- 不修改 `wiki/`；若后续发现仓库外 wiki 存在旧变量说明，作为部署治理的人工跟进项处理。
