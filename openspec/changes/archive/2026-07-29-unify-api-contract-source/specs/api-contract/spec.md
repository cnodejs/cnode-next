## MODIFIED Requirements

### Requirement: API 契约必须提供 OAS 机器可读文档

项目 SHALL 提供 OpenAPI Specification (OAS) 文档作为外部 API reference 和未来 smoke/contract 验证的机器可读来源。OAS 文档 MUST 由 `apps/api` 路由内的 zod-openapi 声明自动生成，不得手写维护。

#### Scenario: OAS 文件存在

- **WHEN** 外部开发者或验证脚本查找 API 契约
- **THEN** 仓库 MUST 提供由 `apps/api` 路由 zod-openapi 声明生成的 `api/openapi.json` 文件
- **AND** README 或 API reference MUST 链接到该 OAS 文件
- **AND** 项目 MUST NOT 保留手写的 `api/openapi.yaml` 或任何与路由声明脱节的手写 OAS 文件

#### Scenario: OAS 从路由自动生成

- **WHEN** 开发者修改 `apps/api/src/routes/*.ts` 中某个端点的 path、method、zod schema 或 OpenAPI metadata
- **THEN** 运行 `pnpm gen:openapi` MUST 重新生成 `api/openapi.json` 反映该变更
- **AND** `pnpm verify` 流程 MUST 在 `verify:openapi` 之前自动执行 `gen:openapi`
- **AND** 生成的 `api/openapi.json` MUST 不包含 `x-contract-response-fields` 扩展——响应 schema 由完整 zod 定义描述

#### Scenario: OAS 可被工具读取

- **WHEN** 验证脚本或 OpenAPI 工具读取 OAS 文件
- **THEN** OAS MUST 定义 `openapi` 版本、`info`、`servers`、`paths`、`components.schemas` 和认证方案
- **AND** OAS MUST 不包含生产 secret、真实用户 token 或私有环境变量

#### Scenario: OAS 覆盖全部路由端点

- **WHEN** `apps/api/src/routes/*.ts` 中的任一路由文件新增端点
- **THEN** 生成的 `api/openapi.json` MUST 包含该端点
- **AND** 项目 MUST NOT 保留未在 OAS 中声明的 `/api/v1/*` 端点（除 `/health` 等内部端点外）
