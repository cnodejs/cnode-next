# web-api-contract-integration Specification

## Purpose

TBD - created by archiving change reach-production-grade-release-readiness. Update Purpose after archive.

## Requirements

### Requirement: Web API 调用必须引用 OAS 契约

`apps/web` SHALL 与 API 契约建立持续校验关系，避免前端调用、后端实现和外部 API 文档漂移。web 调用类型 MUST 从 API 路由的 zod-openapi 声明派生（通过 `z.infer`），不再手写 DTO 或维护独立的契约清单。

#### Scenario: Web 使用从 API 派生的类型

- **WHEN** `apps/web` 调用 `/api/v1/*` 或其他公开 API
- **THEN** 调用方使用的 TypeScript 类型 MUST 通过 `z.infer<typeof schema>` 从 `packages/shared/schemas` re-export 的 zod schema 派生
- **AND** 该 zod schema MUST 与 `apps/api/src/routes/*.ts` 中 zod-openapi 声明的 schema 为同一份源
- **AND** 项目 MUST NOT 保留 `packages/shared/src/types/index.ts` 中的手写 HTTP DTO
- **AND** 项目 MUST NOT 保留 `apps/web/api-contract.manifest.json` 手写契约清单

#### Scenario: Web 调用未记录 API

- **WHEN** `apps/web` 新增对某个 API path 的调用
- **THEN** 对应端点 MUST 在 `apps/api/src/routes/*.ts` 中以 zod-openapi 声明
- **AND** 该 schema MUST 通过 `packages/shared/schemas` 可被 web import
- **AND** 若端点未声明，`pnpm gen:openapi` 产出的 OAS MUST 不包含该 path，从而阻断 web 类型派生

### Requirement: OAS 更新必须能驱动 Web 契约同步

当 `apps/api` 路由中影响 Web 的 API path、method、request 或 response schema 发生变化时，项目 SHALL 提供机制提醒或阻断未同步的 Web 调用。

#### Scenario: 路由删除 Web 依赖接口

- **WHEN** `apps/api/src/routes/*.ts` 删除或重命名 `apps/web` 仍在调用的端点
- **THEN** re-export 的 zod schema MUST 导致 web 端 typecheck 失败
- **AND** 开发者 MUST 同步更新 Web 调用或恢复路由声明

#### Scenario: 路由修改核心响应字段

- **WHEN** `apps/api/src/routes/*.ts` 修改 Web loader、action 或组件依赖的核心响应字段
- **THEN** `z.infer` 派生类型 MUST 反映该变更
- **AND** Web 不得继续依赖已从 schema 移除的字段作为稳定契约

### Requirement: Web 契约集成必须优先覆盖核心外部能力

Web 与 API 路由的持续集成 SHALL 优先覆盖帖子、回复、用户、收藏和消息相关 API。

#### Scenario: 帖子和回复调用被覆盖

- **WHEN** Web 加载首页、话题详情、发帖或回帖页面
- **THEN** 相关端点 MUST 在 `apps/api/src/routes/*.ts` 中以 zod-openapi 声明
- **AND** Web 调用 MUST 使用从该 schema 派生的类型

#### Scenario: 用户、收藏和消息调用被覆盖

- **WHEN** Web 加载用户页、收藏状态或消息页
- **THEN** 相关端点 MUST 在 `apps/api/src/routes/*.ts` 中以 zod-openapi 声明
- **AND** Web schema 派生 MUST 标注登录态或 access token 要求

### Requirement: Web 表单校验 zod schema 必须从 shared 派生

Web 表单运行时校验使用的 zod schema MUST 从 `packages/shared/schemas` import，该 schema 与 `apps/api` 路由的 zod-openapi 声明引用同一份源，不得在 web 端手写副本。

#### Scenario: 表单 schema 来源唯一

- **WHEN** `apps/web` 的 signup/signin/setting 等表单使用 `zodResolver` 进行运行时校验
- **THEN** 传入 `zodResolver` 的 zod schema MUST 从 `packages/shared/schemas` import
- **AND** `packages/shared/schemas` MUST 是 schema 的定义源头（不是从 api re-export）
- **AND** `apps/api/src/routes/*.ts` MUST 从 `@cnode/shared` import 同一份 schema 用于 zod-openapi 注册
- **AND** Web MUST NOT 手写与 API 路由重复的表单 zod schema

#### Scenario: 客户端扩展字段不污染契约源

- **WHEN** Web 表单需要客户端独有字段（如 `confirmPass`）或跨字段校验（如两次密码一致）
- **THEN** Web MUST 在 import 的 schema 基础上用 `.extend()` 或 `.refine()` 叠加客户端逻辑
- **AND** 这些扩展 MUST NOT 回写到 `packages/shared/schemas` 的 schema 定义中
