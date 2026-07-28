## Why

API 契约目前存在四份独立维护的"真理"：手写 `api/openapi.yaml`（1385 行）、`apps/api/routes/*.ts` 内联的 zod schema、`packages/shared/src/types/index.ts` 手写 DTO、`apps/web/api-contract.manifest.json` 手写 48 行契约清单。`apps/web/app/routes/api.tsx` 还硬编码了 4 行表格冒充 API 文档页。它们之间没有机械同步机制，已经发生漂移（例如 `shared/schemas/signupSchema` 字段名是 `loginname`，而 `api/routes/auth.ts` 的 `signinSchema` 字段名是 `name`）。需要将唯一数据源收敛为 `apps/api` 路由内的 zod 声明，让 OAS、web 调用类型和文档都从它派生，从根本上消灭漂移。

## What Changes

- **BREAKING**：升级 `zod` 3→4 和 `hono` 4.6→4.10+，全项目 8 个 zod 使用文件需适配 zod 4 破坏性变更。
- `apps/api/src/routes/*.ts`（9 文件，137 个端点）从 `@hono/zod-validator` 迁移到 `@hono/zod-openapi`，每个端点声明 path/method/zod schema/OpenAPI metadata。
- 新增 `gen:openapi` 脚本，从 zod-openapi 路由注册表自动生成 `api/openapi.json`，取代手写 `api/openapi.yaml`。
- `apps/api/src/app.ts` 注册 `/openapi.json` endpoint 暴露生成的 OAS。
- `apps/web` 新增 `openapi-typescript` codegen，从 `api/openapi.json` 产出 `apps/web/app/lib/api-types.ts`；42 处 `apiFetch<T>` 的手写 `T` 改用生成类型。
- `apps/web/app/routes/api.tsx` 替换硬编码表格为 `swagger-ui-react`，从 `apps/web/public/openapi.json` 渲染。
- 删除 `api/openapi.yaml`（含 45 处 `x-contract-response-fields` 扩展）、`apps/web/api-contract.manifest.json`、`api/_generated/`。
- 删除 `@redocly/cli` 依赖、`redocly.yaml` 配置、`verify:openapi` 和 `build:api-docs` 脚本——OAS 由 zod-openapi 自动生成，合规性由生成器保证，不再需要 redocly lint 兜底。
- 删除 `packages/shared/src/types/index.ts`（HTTP DTO），web 类型改从 OAS codegen 获取。
- 删除 `packages/shared/src/constants/index.ts`（6 个常量全部死代码，无外部消费者）。
- 将 `packages/shared/src/utils/at.ts`（`fetchUsers`/`linkUsers`，仅 api 消费）迁移到 `apps/api/src/lib/at.ts`。
- 重构 `packages/shared/src/schemas/index.ts`：删除与 api 内联版本重复的 `createTopicSchema`/`updateTopicSchema`/`createReplySchema`（死代码），保留 `signupSchema`/`signinSchema`/`githubUnbindSchema`，内容与 api 的 zod-openapi 版本对齐，由 api re-export 以确保唯一数据源。
- 更新 `pnpm verify` 流程，前置 `gen:openapi` 和 `gen:web-types` 步骤。
- 清理 `docs/conventions.md`、`docs/development.md`、`.github/PULL_REQUEST_TEMPLATE.md` 中对 `manifest.json` 的引用。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `api-contract`：OAS 数据源从手写 `api/openapi.yaml` 改为由 `apps/api` 路由 zod-openapi 声明自动生成 `api/openapi.json`；删除 `x-contract-response-fields` 扩展，响应 schema 由完整 zod 定义描述。
- `web-api-contract-integration`：web 调用类型从手写 `packages/shared/types` 改为从 OAS codegen（`openapi-typescript`）；表单运行时校验 zod schema 改为从 api re-export 获取；删除 `apps/web/api-contract.manifest.json` 手写契约清单。
- `public-api-documentation`：API 文档页从手写表格改为 `swagger-ui-react` 渲染 OAS；`redocly build-docs` 产出（`api/_generated/`）被删除；`redocly lint`（`verify:openapi`）被删除，OAS 合规由生成器保证。

## Impact

- **代码**：`apps/api/src/routes/*.ts`（9 文件全量重写）、`apps/api/src/app.ts`、`apps/web/app/lib/api-client.ts`、`apps/web/app/routes/api.tsx`、`apps/web` 42 处 `apiFetch<T>` 调用点、`packages/shared/src/*`。
- **依赖**：`apps/api` 新增 `@hono/zod-openapi`；`apps/web` 新增 `openapi-typescript`、`swagger-ui-react`；`zod` 3→4、`hono` 4.6→4.10+ 全项目升级。
- **工具链**：`package.json` 新增 `gen:openapi`、`gen:web-types` 脚本；删除 `verify:openapi`、`build:api-docs` 脚本和 `@redocly/cli` 依赖；`verify` 流程用 `gen:openapi` 替代原 `verify:openapi`。
- **文档**：`docs/conventions.md`、`docs/development.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`README.md` 中 OAS 路径和 manifest 引用需更新。
- **OpenSpec**：`openspec/specs/api-contract/`、`openspec/specs/web-api-contract-integration/`、`openspec/specs/public-api-documentation/` 的 spec delta 需反映新链路。

## Non-goals

- 不改动 API 的业务行为和响应数据结构——路由迁移只改声明方式，不改 `c.json()` 返回的内容。
- 不替换 `apps/web/app/lib/api-client.ts` 的 `apiFetch` 函数签名——它仍作为 fetch 壳存在，只是 `T` 参数来源从手写换成 OAS codegen。
- 不引入 `openapi-fetch` 或 `orval` 等 runtime client——只做类型 codegen，保留 `apiFetch<T>` 调用模式。
- 不迁移 `smoke:api-contract` 脚本——它是独立的 runtime smoke，不读 OAS，保持原样。
- 不改动 `@cnode/db`（Drizzle schema）和 Redis 层。
- 不处理 `apps/api/src/routes/admin.ts` 里手写的 `createReportSchema`（非 zod 校验）——它会被本次迁移顺便升级为 zod-openapi 声明，但不改动其校验规则语义。
