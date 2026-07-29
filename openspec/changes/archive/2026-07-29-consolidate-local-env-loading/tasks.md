## 1. 统一加载基础

- [x] 1.1 盘点当前所有 env 加载入口和 package scripts，确认 API、Web、DB、migration、worker 的实际启动路径。
- [x] 1.2 建立脚本矩阵，标明每个 package script 是否需要本地 env、自然加载点在哪里、是否应保持不加载 dotenv。
- [x] 1.3 设计并实现薄的 root env loader，支持定位仓库根、读取 root `.env`、读取 `CNODE_ENV_FILE` 显式 profile，并保持已有 `process.env` 优先。
- [x] 1.4 确认默认 package scripts 保持原样，不通过额外 launcher 包裹 `react-router`、`drizzle-kit` 或 `tsx` 命令。
- [x] 1.5 为 loader 添加单元测试或等价验证，覆盖默认 `.env`、显式 profile 覆盖默认值、已有 `process.env` 不被覆盖、`.env.local` 不被默认加载、缺失文件安全跳过。

## 2. 接入运行入口

- [x] 2.1 将 `apps/api` 的 runtime loader 改为通过 workspace root 查找加载 root `.env`，保留默认 `tsx watch src/index.ts` 和 worker 命令。
- [x] 2.2 将 `apps/web` 的 `vite.config.ts` 接入 root env loader，保持 `react-router dev/build/typegen` 默认命令不变。
- [x] 2.3 将 `packages/db` 的 Drizzle config、migrate、seed 接入 root env loader，保持 `drizzle-kit` 和 `tsx src/*` 默认命令不变。
- [x] 2.4 将根 `migrate:mongo-to-pg`、`migrate:reconcile` 和其他需要运行时地址/凭据的 root scripts 在脚本入口加载 root `.env`，保持默认命令不变。
- [x] 2.5 保持 lint、format、typecheck 中纯 `tsc`、secret scan、`verify:compose-config` 等无关质量工具不加载本地 dotenv。

## 3. 远程 Profile 安全边界

- [x] 3.1 文档化 `CNODE_ENV_FILE=.env.remote.local` 或等价显式 profile 用法，说明远程 DB 推荐通过 SSH tunnel 暴露为本地 endpoint。
- [x] 3.2 确保默认 `pnpm dev` 不自动读取 `.env.remote.local`、`.env.rehearsal.local` 或其他 profile 文件。
- [x] 3.3 对 app-local dotenv 文件存在的情况仅提供提示或文档说明，不删除、不覆盖、不打印真实内容。

## 4. 文档和模板

- [x] 4.1 更新 `README.md` 和 `docs/development.md`，明确 root `.env` 是唯一默认本地真实配置入口，`.env.local` 和 app-local `.env*` 不再推荐。
- [x] 4.2 在开发文档中加入脚本矩阵，说明哪些命令通过自然配置/脚本入口加载 root env，哪些命令不会读取本地 dotenv。
- [x] 4.3 更新 `.env.example` 的注释和变量分组，保留 placeholder，不加入真实 secret。
- [x] 4.4 保持 `deployment/.env.production.example` 和生产 compose 注入模型独立，不把生产改成应用内 dotenv 读取。

## 5. 验证

- [x] 5.1 运行与 loader 相关的测试或新增测试，确认 env 合并优先级符合 spec。
- [x] 5.2 验证 `pnpm --filter @cnode/web dev`、`pnpm --filter @cnode/api dev`、`pnpm db:push:pg`、`pnpm migrate:reconcile` 的 env 加载路径符合脚本矩阵，可用安全 dummy env 文件验证，不打印真实值，且默认命令保持原样。
- [x] 5.3 运行 `pnpm --filter @cnode/api typecheck` 和 `pnpm --filter @cnode/web typecheck`，确认 API/Web 接入无类型错误。
- [x] 5.4 运行 `pnpm --filter @cnode/db typecheck`，确认 DB scripts 接入无类型错误。
- [x] 5.5 运行 `openspec validate "consolidate-local-env-loading" --type change --strict`，确认 proposal/spec/design/tasks 通过校验。
