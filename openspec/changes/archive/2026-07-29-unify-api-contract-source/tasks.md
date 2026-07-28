## 1. 依赖升级

- [x] 1.1 升级 `zod` 3→4（`apps/api`、`apps/web`、`packages/shared` 的 `package.json`），跑 `pnpm install`
- [x] 1.2 升级 `hono` 4.6→4.10+（`apps/api/package.json`），跑 `pnpm install`
- [x] 1.3 安装 `@hono/zod-openapi` 到 `apps/api`，安装 `swagger-ui-react` 到 `apps/web`
- [x] 1.4 适配 zod 4 破坏性变更：检查 `apps/api/src/routes/*.ts`（8 个文件）和 `packages/shared/src/schemas/index.ts` 的所有 zod schema，修复 `.min()` 错误消息、`z.infer` optional 行为、`z.object().strict()` 等差异
- [x] 1.5 运行 `pnpm typecheck` 和 `pnpm test`，确认 zod 4 升级无回归

## 2. gen:openapi 脚本骨架

- [x] 2.1 在 `apps/api/scripts/` 新建 `gen-openapi.ts`，调用 `@hono/zod-openapi` 的 `OpenApiHono` 注册表生成 OAS JSON
- [x] 2.2 在 `apps/api/package.json` 添加 `"gen:openapi": "tsx scripts/gen-openapi.ts"` 脚本
- [x] 2.3 在根 `package.json` 添加 `"gen:openapi": "pnpm --filter @cnode/api gen:openapi"`
- [x] 2.4 运行 `pnpm gen:openapi` 产出初始 `api/openapi.json`（此时可为空 schema），确认脚本可运行

## 3. shared schema 源头重构（先于路由迁移，避免循环依赖）

- [x] 3.1 将 `packages/shared/src/utils/at.ts`（`fetchUsers`/`linkUsers`）迁移到 `apps/api/src/lib/at.ts`，更新 `apps/api/src/lib/markdown.ts`、`apps/api/src/lib/at.ts`（已存在）、`apps/api/src/routes/collect.ts` 的 import 路径
- [x] 3.2 删除 `packages/shared/src/utils/index.ts` 和 `packages/shared/src/utils/` 目录
- [x] 3.3 删除 `packages/shared/src/constants/index.ts`（6 个死代码常量）和对应的 `packages/shared/src/constants/` 目录
- [x] 3.4 删除 `packages/shared/src/types/index.ts`（手写 HTTP DTO）
- [x] 3.5 重写 `packages/shared/src/schemas/index.ts`：按领域组织，定义所有 zod schema（请求体、响应体、表单校验），从现有 `apps/api/src/routes/*.ts` 的内联 schema 提取并集中定义（topic/reply/auth/user/collect/message/community/admin 领域）
- [x] 3.6 更新 `packages/shared/src/index.ts`：移除 `types`、`constants`、`utils` 的 re-export，只保留 `schemas`
- [x] 3.7 运行 `pnpm typecheck`，确认 shared 重构无回归

## 4. 路由迁移：核心写入路径（topic/reply/auth）

- [x] 4.1 迁移 `apps/api/src/routes/topic.ts`：将 `Hono` 换为 `OpenAPIHono`，4 个端点用 `.openapi()` 声明；从 `@cnode/shared` import schema，注册时加 OpenAPI metadata
- [x] 4.2 迁移 `apps/api/src/routes/reply.ts`：5 个端点（create/edit/get/delete/ups）迁移到 zod-openapi；为 `delete` 和 `ups` 补充 zod schema（定义在 shared）
- [x] 4.3 迁移 `apps/api/src/routes/auth.ts`：迁移所有端点到 zod-openapi；从 `@cnode/shared` import `signupSchema`/`signinSchema`/`githubUnbindSchema` 等
- [x] 4.4 运行 `pnpm gen:openapi`，确认 topic/reply/auth 端点出现在 `api/openapi.json`
- [x] 4.5 运行 `pnpm typecheck` 和 `pnpm test`，确认迁移无回归

## 5. 路由迁移：读取路径（user/collect/message）

- [x] 5.1 迁移 `apps/api/src/routes/user.ts`：8 个端点迁移到 zod-openapi；为当前无校验的端点（`GET /user/:loginname` 等）补充 query/param schema（定义在 shared）
- [x] 5.2 迁移 `apps/api/src/routes/collect.ts`：3 个端点迁移到 zod-openapi；从 shared import `collectSchema`
- [x] 5.3 迁移 `apps/api/src/routes/message.ts`：4 个端点迁移到 zod-openapi；为当前用 `c.req.json()` 手动取 body 的 `mark_all`/`mark_one` 补充 zod schema（定义在 shared）
- [x] 5.4 运行 `pnpm gen:openapi`，确认 user/collect/message 端点出现在 `api/openapi.json`
- [x] 5.5 运行 `pnpm typecheck` 和 `pnpm test`

## 6. 路由迁移：辅助路径（community/admin）

- [x] 6.1 迁移 `apps/api/src/routes/community.ts`：1 个端点（`GET /sidebar/home`）迁移到 zod-openapi
- [x] 6.2 迁移 `apps/api/src/routes/admin.ts`：40 个端点迁移到 zod-openapi；`createReportSchema`（手写非 zod 校验）重写为 zod schema（定义在 shared）但保持校验规则语义不变（`targetType` 仍为 `"topic" | "reply"`，`type` 仍 trim+slice(50)）
- [x] 6.3 更新 `apps/api/src/routes/index.ts`：将各子路由的 `Hono` 实例挂载改为 `OpenAPIHono`
- [x] 6.4 在 `apps/api/src/app.ts` 注册 `GET /openapi.json` endpoint 暴露生成的 OAS
- [x] 6.5 运行 `pnpm gen:openapi`，确认全部 137 个端点出现在 `api/openapi.json`，OAS path 数与实际路由数一致
- [x] 6.6 运行 `pnpm typecheck` 和 `pnpm test`

## 7. web 类型派生与表单 schema 接入

- [x] 7.1 更新 `apps/web/app/components/TopicList.tsx`：删除 `import type { TopicDTO } from "@cnode/shared"`，改用 `z.infer` 从 `@cnode/shared` 的 schema 派生
- [x] 7.2 在 `apps/web/app/lib/` 新建 `api-types.ts`，从 `@cnode/shared` 导出的 zod schema 用 `z.infer` 派生 HTTP 响应类型（如 `type TopicDTO = z.infer<typeof topicResponseSchema>` 等）
- [x] 7.3 更新 `apps/web/app/lib/api-client.ts`：`apiFetch<T>` 的 `T` 注释说明来源改为从 `~/lib/api-types` 派生
- [x] 7.4 更新 `apps/web` 42 处 `apiFetch<T>` 调用：将手写 `T`（如 `{ success: boolean; data: any[] }`）替换为从 `~/lib/api-types` 派生的类型
- [x] 7.5 确认 `apps/web/app/routes/signup.tsx` 的 `signupSchema` 从 `@cnode/shared` import，`.extend({ confirmPass }).refine(...)` 保持不变
- [x] 7.6 确认 `apps/web/app/routes/signin.tsx` 的 `signinSchema` 和 `apps/web/app/routes/setting.tsx` 的 `githubUnbindSchema` 从 `@cnode/shared` import
- [x] 7.7 运行 `pnpm typecheck`，确认 web 类型派生无回归

## 8. API 文档页 swagger-ui-react

- [x] 8.1 在 `apps/web/package.json` 确认 `swagger-ui-react` 已安装
- [x] 8.2 新增 copy 步骤：在 `apps/api` 的 `gen:openapi` 脚本或根 `package.json` 新增脚本，将 `api/openapi.json` 复制到 `apps/web/public/openapi.json`
- [x] 8.3 重写 `apps/web/app/routes/api.tsx`：删除硬编码 `endpoints` 数组，改用 `swagger-ui-react` 从 `/openapi.json`（public 目录）渲染文档；用 `ClientOnly` 或动态 import 包裹避免 SSR 报错
- [x] 8.4 确认 `apps/web/app/routes/api.tsx` 的 `meta` 和页面布局保持现有风格（`Layout` + `ContentPage`）
- [x] 8.5 本地 `pnpm dev`，访问 `/api` 页面，确认 swagger-ui 渲染成功

## 9. 清理手写副本

- [x] 9.1 删除 `api/openapi.yaml`（1385 行手写 OAS）
- [x] 9.2 删除 `apps/web/api-contract.manifest.json`（48 行手写契约清单）
- [x] 9.3 删除 `api/_generated/` 目录（redocly build-docs 产出，已空）
- [x] 9.4 删除根 `package.json` 的 `build:api-docs` 脚本
- [x] 9.5 删除根 `package.json` 的 `verify:openapi` 脚本和 `@redocly/cli` 依赖
- [x] 9.6 删除 `redocly.yaml` 配置文件
- [x] 9.7 更新 `package.json` 的 `verify` 脚本：移除 `pnpm verify:openapi`，在原位置插入 `pnpm gen:openapi`（确保 `api/openapi.json` 与路由声明同步）
- [x] 9.8 新增 `gen:web-types` 脚本：将 `api/openapi.json` 复制到 `apps/web/public/openapi.json`（供 swagger-ui-react 读取）

## 10. 文档与 PR 模板清理

- [x] 10.1 更新 `docs/conventions.md`：删除 `api-contract.manifest.json` 和 `verify:openapi-contract`/`verify:api-contract` 的引用；将"OAS 是唯一真理"的描述改为"OAS 由 `apps/api` 路由 zod-openapi 声明自动生成"
- [x] 10.2 更新 `docs/development.md`：删除 `api/openapi.yaml` 和 `api-contract.manifest.json` 的同步说明；改为说明运行 `pnpm gen:openapi` 生成 OAS
- [x] 10.3 更新 `.github/PULL_REQUEST_TEMPLATE.md`：删除 `api-contract.manifest.json` 引用
- [x] 10.4 更新 `README.md`：若提及 `api/openapi.yaml` 则改为 `api/openapi.json` 并说明生成方式

## 11. OpenSpec spec 更新

- [x] 11.1 确认 `openspec/changes/unify-api-contract-source/specs/api-contract/spec.md` 的 delta 正确（MODIFIED: OAS 从路由生成，删除 x-contract-response-fields）
- [x] 11.2 确认 `openspec/changes/unify-api-contract-source/specs/web-api-contract-integration/spec.md` 的 delta 正确（MODIFIED: 类型从 z.infer 派生；ADDED: 表单 schema re-export）
- [x] 11.3 确认 `openspec/changes/unify-api-contract-source/specs/public-api-documentation/spec.md` 的 delta 正确（MODIFIED: 文档由 swagger-ui-react 渲染；REMOVED: redocly build-docs）
- [x] 11.4 运行 `openspec validate --change unify-api-contract-source --strict`，确认 spec delta 通过校验

## 12. 最终验证

- [x] 12.1 运行 `pnpm gen:openapi`，确认 `api/openapi.json` 生成成功且 path 数与路由数一致
- [x] 12.2 运行 `pnpm typecheck`，全项目类型检查通过
- [x] 12.3 运行 `pnpm test`，所有测试通过
- [x] 12.4 运行 `pnpm lint`，ESLint 通过
- [x] 12.5 运行 `pnpm build`，所有 package/app 构建通过
- [x] 12.6 运行 `pnpm smoke:api-contract`，runtime smoke 通过
- [x] 12.7 运行 `openspec validate --all --strict`，OpenSpec 校验通过
- [x] 12.8 运行 `pnpm verify`，完整 release gate 通过
- [x] 12.9 本地 `pnpm dev`，手动冒泡：访问 `/api` 页面确认 swagger-ui 渲染；访问首页、话题详情、登录、注册、发帖、回帖确认功能正常
