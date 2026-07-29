## Why

当前本地开发环境变量存在多个配置平面：仓库根 `.env` / `.env.local`、`apps/web/.env` / `.env.local` 以及包内各自 loader。`pnpm dev` 同时启动 Web 和 API 时，不同入口可能读取不同文件或使用不同覆盖顺序，导致 Web、API、DB 脚本连接到不一致的运行环境。

这次变更要把本地 env 加载契约收敛为“默认安全、本地；远程显式选择”，避免开发者为了让某个应用正常启动而在多个目录复制 `.env`。

## What Changes

- 统一本地 env 加载语义：默认只读取仓库根 `.env`，并保持 shell/CI/compose 已显式传入的 `process.env` 优先级最高。
- 引入显式 env profile 约定，例如通过 `CNODE_ENV_FILE=.env.remote.local` 选择远程数据库或迁移演练配置。
- 约束 `pnpm dev` 的默认路径面向本地 PostgreSQL/Redis，不应隐式连接远程数据库。
- 废弃 `apps/web/.env`、`apps/web/.env.local` 等 app-local env 作为本地配置入口；迁移过程中不得删除、覆盖或打印用户现有真实 env 文件内容。
- 统一 API、Web SSR/dev、DB migration/seed、migration/reconcile 脚本的 root env 加载行为。
- 文档明确 `.env.example` 是模板、`.env` 是默认本地真实配置、`.env.<profile>.local` 是显式私有 profile、`deployment/.env.production.example` 继续作为生产模板。

## Non-goals

- 不修改、不删除、不覆盖现有真实 `.env`、`.env.local`、`apps/web/.env` 或 `apps/web/.env.local` 文件内容；其中 `.env.local` 仅作为已有文件被保护，不再作为默认加载源。
- 不把生产部署改为应用内读取 dotenv；生产继续由 `deployment/docker-compose.prod.yml` 或等价部署编排注入环境变量。
- 不新增 SQLite、本地数据库 fallback 或 `DB_DIALECT` 兼容路径。
- 不把数据库密码、OAuth secret、SMTP secret 等真实值写入 `package.json` scripts、文档或 OpenSpec artifacts。
- 不改变 legacy `../nodeclub/` 线上系统行为；该目录仅作为历史行为参考，不作为本次实现目标。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `postgres-first-dev-runtime`: 明确本地 env 默认入口为 root `.env`、覆盖顺序、`.env.local` 和 app-local env 废弃边界，以及 PostgreSQL/Redis 配置必须通过统一 root env contract 提供。
- `local-remote-migration-rehearsal`: 明确远程数据库或迁移演练必须通过显式 env profile 选择，默认 `pnpm dev` 不应隐式使用远程数据库配置。

## Impact

- 受影响代码：`apps/api/src/load-env.ts`、`apps/api/src/index.ts`、`apps/api/src/worker/moderation-scan.ts`、`apps/web/vite.config.ts`、`packages/db/src/load-env.ts`、`packages/db/src/migrate.ts`、`packages/db/src/seed.ts`、根 `package.json` scripts、migration/reconcile 相关脚本。
- 受影响文档：`README.md`、`docs/development.md`、`.env.example` 中本地 env 使用说明。
- 受影响运行方式：`pnpm dev`、`pnpm --filter @cnode/web dev`、`pnpm --filter @cnode/api dev`、`pnpm db:*`、`pnpm migrate:*`。
- 安全影响：真实 env 文件仅作为输入被读取；实现和文档不得打印 secret，不得提交真实 env 内容。
