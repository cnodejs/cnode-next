## Why

`apps/api` 当前使用 Node 内置 `node:test`，测试脚本手动枚举文件，导致新增测试容易漏跑，也让生产代码为了测试导出过多 helper。需要引入与 `apps/web` 一致的 Vitest 测试基础设施，同时明确 API 测试不得连接真实 PostgreSQL，包括测试库。

## What Changes

- `apps/api` 测试运行器迁移为 Vitest，测试脚本使用 glob 自动发现测试文件。
- 增加 API 测试约定：优先测试纯函数、权限判定、请求构造、Hono route wiring 和可注入依赖，不为测试连接真实 PostgreSQL。
- 建立不依赖数据库连接的 route-level 测试方式，例如使用 mockable app/db 边界或注入 fake query layer。
- 移除或减少仅为 `node:test`/手动脚本服务的测试组织方式。
- 保持 PostgreSQL-only 的运行时原则；本 change 不引入 SQLite、内存数据库、真实测试库或方言 fallback。

## Scope

### In Scope

- `apps/api` 测试框架、测试脚本、Vitest 配置和测试文件发现规则。
- `apps/api` 中已有 Node test 测试的 Vitest 迁移。
- 不连接真实数据库的 API route 测试夹具或依赖注入边界。
- `docs/conventions.md` 中 API 测试约定的同步。

### Out Of Scope

- 不连接真实 PostgreSQL，包括本地测试库、Docker 测试库或远程测试库。
- 不引入 SQLite、PGlite、内存 SQL 数据库或 Drizzle 方言 fallback。
- 不改写业务逻辑或后台治理功能；只调整测试基础设施和必要的可测试边界。
- 不修改 legacy `../nodeclub/` 或 `egg-cnode/`。

### Affected Areas

- Code: `apps/api`、根 workspace 测试命令。
- Runtime: 无运行时行为变更。
- Contracts: 无公开 API 契约变更。
- Documentation: `docs/conventions.md`。

### High-Risk Categories

- Testing infrastructure: 测试运行器迁移可能影响 `pnpm test`、`pnpm verify` 和 CI 行为。
- Database: 明确禁止真实 PostgreSQL 测试连接和 SQLite fallback，避免测试路径变成新的运行时依赖。

## Non-goals

- 不建立数据库集成测试环境。
- 不通过真实 PostgreSQL 验证查询语义。
- 不为测试暴露新的生产 API，除非该边界本身有复用价值。
- 不把 mock 行为写成业务真相；数据库行为仍以 Drizzle/PostgreSQL 运行时和现有 schema 为准。

## Capabilities

### New Capabilities

- `api-test-infrastructure`: `apps/api` 的 Vitest 测试运行、无真实数据库测试边界、route-level 测试约定和文档同步。

### Modified Capabilities

- 无。

## Impact

- `apps/api/package.json`: 将 `test` 脚本迁移为 Vitest glob 运行，增加必要 devDependency。
- `apps/api/test/`: 迁移现有 `node:test` 测试到 Vitest。
- `apps/api/src/`: 视需要抽出小型可注入边界，避免 route 测试连接真实数据库。
- `docs/conventions.md`: 更新 API 测试约定，明确不连接真实 PostgreSQL、不使用 SQLite fallback。

## Documentation Impact

### docs/

- Updated: `docs/conventions.md` because API 测试运行器、测试发现方式和无真实数据库测试约定发生变化。

### wiki/

- Not Required: 本 change 只改变测试基础设施，不改变业务规则、legacy 行为、迁移背景或社区规则。
