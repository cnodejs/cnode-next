# api-test-infrastructure Specification

## Purpose

Define the API test infrastructure expectations for automatic Vitest discovery, database-free test boundaries, and long-term documentation.

## Requirements

### Requirement: API 使用 Vitest 自动发现测试

`apps/api` SHALL 使用 Vitest 运行测试，并自动发现测试文件，避免新增测试因脚本手动枚举而漏跑。

#### Scenario: 新测试文件被自动执行

- **WHEN** 开发者在 `apps/api/test/` 新增匹配测试命名约定的测试文件
- **THEN** `pnpm --filter @cnode/api test` MUST 自动执行该文件
- **AND** 不需要手动把文件路径加入 `package.json` test 脚本

#### Scenario: 现有测试迁移后继续运行

- **WHEN** 迁移完成后运行 `pnpm --filter @cnode/api test`
- **THEN** 现有 API 单元测试 MUST 在 Vitest 下通过
- **AND** `pnpm test` 和 `pnpm verify` MUST 继续包含 API 测试

### Requirement: API 测试不得连接真实数据库

`apps/api` 测试 SHALL 不连接任何真实 PostgreSQL 实例。测试也 MUST NOT 引入 SQLite、PGlite、内存 SQL 数据库或 Drizzle 方言 fallback。

#### Scenario: 测试运行不要求数据库环境变量

- **WHEN** 开发者未配置 `POSTGRES_HOST`、`POSTGRES_USER`、`POSTGRES_PASSWORD` 或 `POSTGRES_DB` 时运行 API 测试
- **THEN** 测试 MUST 能运行不依赖数据库的用例
- **AND** 测试基础设施 MUST NOT 为通过测试而提供 SQLite 或其他数据库 fallback

#### Scenario: Route 测试使用 fake 边界

- **WHEN** API route 测试需要覆盖依赖数据库的分支
- **THEN** 测试 MUST 使用可注入依赖、mock service 或 fake query layer
- **AND** 测试 MUST 明确只验证 route 行为和服务编排，不声称验证 PostgreSQL 查询语义

### Requirement: API 测试约定文档化

测试基础设施变更 SHALL 更新长期维护文档，使开发者知道如何新增 API 测试以及数据库边界。

#### Scenario: 文档说明测试运行器

- **WHEN** Vitest 测试基础设施实现完成
- **THEN** `docs/conventions.md` MUST 说明 `apps/api` 使用 Vitest 和自动测试发现
- **AND** 文档 MUST 删除或替换手动枚举 API 测试文件的旧约定

#### Scenario: 文档说明无真实数据库约束

- **WHEN** 文档描述 API 测试分层
- **THEN** 文档 MUST 明确 API 测试不连接真实 PostgreSQL 测试库
- **AND** 文档 MUST 明确不得使用 SQLite 或方言 fallback 作为 release path
