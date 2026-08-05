# runtime-environment-contract Specification

## Purpose

TBD - created by archiving change standardize-runtime-environment-contract. Update Purpose after archive.

## Requirements

### Requirement: Runtime environment variables SHALL use semantic prefixes

cnode-next 应用配置 MUST 将原 `APP_*` 前缀替换为 `CNODE_*`；PostgreSQL 与 Redis 配置 MUST 分别使用既有生态前缀 `POSTGRES_*` 与 `REDIS_*`，使变量名称明确表达配置归属和属性。

#### Scenario: Maintainer adds a project runtime variable

- **WHEN** 维护者为 cnode-next 增加新的应用运行时环境变量
- **THEN** 变量名 MUST 以 `CNODE_` 开头
- **AND** 名称 MUST 使用能够表达资源、能力和属性的完整单词
- **AND** PostgreSQL 或 Redis 连接字段 MUST NOT 添加 `CNODE_` 前缀

#### Scenario: Legacy application variable is supplied

- **WHEN** 进程只提供 `APP_*` 应用配置
- **THEN** 应用 MUST NOT 将其作为 `CNODE_*` 的 alias 或 fallback

#### Scenario: Same contract is used in different environments

- **WHEN** 本地、rehearsal、CI 或 production 为同一运行时能力提供不同配置值
- **THEN** 各环境 MUST 使用相同变量名
- **AND** 部署环境名称 MUST NOT 编码到变量名中

### Requirement: PostgreSQL connection SHALL use one CNODE contract

所有 PostgreSQL 运行时消费者 MUST 只使用 `POSTGRES_HOST`、`POSTGRES_PORT`、`POSTGRES_DB`、`POSTGRES_USER` 和 `POSTGRES_PASSWORD`。

#### Scenario: PostgreSQL config is parsed

- **WHEN** API、worker、Drizzle、migration、seed 或运维脚本建立 PostgreSQL 连接
- **THEN** `POSTGRES_HOST`、`POSTGRES_DB`、`POSTGRES_USER` 和 `POSTGRES_PASSWORD` MUST 为非空值
- **AND** 未提供 `POSTGRES_PORT` 时 MUST 使用唯一默认值 `5432`
- **AND** 无效端口 MUST 在建立连接前失败

#### Scenario: Legacy PostgreSQL variable is supplied

- **WHEN** 进程只提供 `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD` 或 `DATABASE_URL`
- **THEN** PostgreSQL 配置解析 MUST 失败并指出缺少的新变量名
- **AND** 系统 MUST NOT 将旧变量作为 alias 或 fallback

### Requirement: Redis connection SHALL use one CNODE contract

所有真实 Redis 运行时消费者 MUST 只使用 `REDIS_HOST`、`REDIS_PORT`、`REDIS_DB` 和 `REDIS_PASSWORD`。

#### Scenario: Redis config is parsed

- **WHEN** API 或 worker 选择真实 Redis client
- **THEN** `REDIS_HOST` MUST 为非空值
- **AND** 未提供 `REDIS_PORT` 时 MUST 使用 `6379`
- **AND** 未提供 `REDIS_DB` 时 MUST 使用 `0`
- **AND** port 与 database index MUST 在建立连接前验证为有效整数

#### Scenario: Test does not use a real Redis service

- **WHEN** 自动化测试通过 mock 或 fake 边界验证 API 行为
- **THEN** 测试 MUST NOT 要求真实 `REDIS_*` 凭据
- **AND** mock 选择 MUST NOT 由部分缺失的生产连接变量静默触发

### Requirement: Runtime resource config SHALL be parsed centrally

PostgreSQL 与 Redis 配置的必填校验、类型转换和默认值 MUST 由共享的 typed parser 统一定义，消费者不得各自解释同一环境变量。

#### Scenario: Multiple consumers create resource clients

- **WHEN** API、worker、DB package、Drizzle config 或独立脚本读取同一资源配置
- **THEN** 所有消费者 MUST 获得相同字段、默认值和验证结果
- **AND** PostgreSQL consumer MUST 使用结构化连接字段而不是手工拼接连接 URL

#### Scenario: Secret config is invalid

- **WHEN** password 等 secret 变量缺失或无效
- **THEN** 错误信息 MUST 只标识变量名和错误类型
- **AND** 错误、日志和健康响应 MUST NOT 包含 secret 值

### Requirement: Compose SHALL inject the unified environment file directly

Production Compose MUST use `env_file` to inject the unified runtime configuration and MUST NOT repeat the complete variable contract in each service.

#### Scenario: Compose initializes PostgreSQL

- **WHEN** production Compose 配置 PostgreSQL 官方镜像
- **THEN** Compose MUST 通过 `env_file` 向运行时 service 注入统一配置
- **AND** PostgreSQL 官方镜像 MUST 直接消费 `POSTGRES_DB`、`POSTGRES_USER` 和 `POSTGRES_PASSWORD`
- **AND** operator MUST NOT 被要求为同一值维护第二套输入变量

### Requirement: Contract migration SHALL be an atomic hard cutover

受版本控制的代码、模板、Compose、测试、活跃 specs 和文档 MUST 在同一个 change 中一次性切换到新契约，不得提供兼容窗口。

#### Scenario: Repository is checked after migration

- **WHEN** 实施完成后检查 shipped source 和活跃文档
- **THEN** 不得存在旧 PostgreSQL 或 Redis 运行时变量引用
- **AND** 不得存在新旧变量 alias、fallback 或 deprecated compatibility path

#### Scenario: New required variables are absent

- **WHEN** 运行时仍只配置旧变量
- **THEN** 依赖该资源的进程 MUST 快速失败
- **AND** 进程 MUST NOT 静默连接默认、旧或其他环境的资源

### Requirement: Real dotenv files SHALL remain human-managed and untouched

自动实施与验证 MUST NOT 读取、打印、修改、覆盖、删除或自动迁移开发者真实 dotenv 文件。

#### Scenario: Tracked templates are migrated

- **WHEN** 实施者更新 `.env.example` 或 `deployment/.env.production.example`
- **THEN** 只能写入新变量及非敏感占位值
- **AND** 不得根据真实 dotenv 内容生成模板

#### Scenario: Real dotenv files exist in the workspace

- **WHEN** 实施或验证发现真实 dotenv 文件
- **THEN** 必须保持文件及其内容不变
- **AND** 真实配置迁移 MUST 留给后续明确授权的人工流程
