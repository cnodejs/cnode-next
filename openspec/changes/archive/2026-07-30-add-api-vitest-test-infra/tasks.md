## 1. Vitest 基础设施

- [x] 1.1 为 `apps/api` 添加 Vitest devDependency，尽量与 `apps/web` 使用的版本保持一致。
- [x] 1.2 新增或配置 `apps/api` Vitest 配置，测试环境使用 Node，匹配 `test/**/*.test.ts`。
- [x] 1.3 将 `apps/api/package.json` 的 `test` 脚本改为自动发现测试文件，不再手动枚举每个测试文件。

## 2. 现有测试迁移

- [x] 2.1 将 `apps/api/test/*.test.ts` 从 `node:test` 和 `node:assert/strict` 迁移到 Vitest 的 `test`、`expect`。
- [x] 2.2 确认迁移后的测试不需要 `DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME` 等真实数据库环境变量。
- [x] 2.3 删除仅因手动枚举测试脚本产生的维护负担，确保新增测试文件会自动执行。

## 3. 无真实数据库 Route 测试模式

- [x] 3.1 选择一个轻量 API route 增加 Vitest route-level 示例测试，使用 `app.request` 或等价 Hono 测试入口。
- [x] 3.2 若 route 依赖数据库，抽出可注入 service/db 边界或使用 Vitest mock，确保测试不调用 `createDb()`。
- [x] 3.3 确认测试中不引入 SQLite、PGlite、内存 SQL 数据库或 Drizzle 方言 fallback。
- [x] 3.4 回收仅为测试暴露且无业务复用价值的 route helper，或将其移动到更合适的内部 service 模块。

## 4. 文档同步

- [x] 4.1 更新 `docs/conventions.md`，说明 `apps/api` 使用 Vitest、自动发现测试文件和推荐命名。
- [x] 4.2 更新 `docs/conventions.md`，明确 API 测试不得连接真实 PostgreSQL 测试库，也不得使用 SQLite/fallback 数据库路径。
- [x] 4.3 确认 `wiki/` 不需要更新；本 change 不改变业务规则或 legacy 行为。

## 5. 验证和收尾

- [x] 5.1 运行 `pnpm --filter @cnode/api test`。
- [x] 5.2 运行 `pnpm test`。
- [x] 5.3 运行 `pnpm typecheck`。
- [x] 5.4 运行 `openspec validate --changes add-api-vitest-test-infra`。
- [x] 5.5 发布或 PR 前运行 `pnpm verify`。
