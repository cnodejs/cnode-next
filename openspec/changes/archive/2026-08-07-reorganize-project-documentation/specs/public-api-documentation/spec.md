## MODIFIED Requirements

### Requirement: API 文档必须面向外部参考和学习

项目 SHALL 提供完整的外部 API reference，使第三方开发者能理解如何调用 CNode API、如何认证、如何处理错误以及如何兼容 legacy nodeclub API v1。API reference MUST 由生成的 OAS 驱动渲染，不再手写端点表格。

#### Scenario: 开发者首次阅读 API 文档

- **WHEN** 外部开发者打开 API reference
- **THEN** 文档 MUST 展示 base URL、版本策略、认证方式、通用响应结构、错误格式、分页语义和限流说明
- **AND** 文档 MUST 标注哪些接口公开可读、哪些接口需要登录 session 或 access token
- **AND** 文档 MUST NOT 将 `localhost` 或本地端口作为 API reference 的主要调用地址

#### Scenario: 开发者调用具体接口

- **WHEN** 外部开发者查看某个 API endpoint
- **THEN** 文档 MUST 使用 HTTP method 和相对 path 作为接口标题或接口标识，例如 `GET /api/v1/topics`
- **AND** 文档 MUST 对 path params、query、body 和 response fields 优先使用表格
- **AND** 错误说明 MAY 使用短列表或表格
- **AND** 示例 MUST 使用可复制的 `curl` 或等价 HTTP 请求代码块

#### Scenario: 文档由 OAS 自动渲染

- **WHEN** 开发者访问 `apps/web` 的 API 文档页（`/api` 路由）
- **THEN** 页面 MUST 使用 `swagger-ui-react` 从 `apps/web/public/openapi.json` 渲染文档
- **AND** `apps/web/public/openapi.json` MUST 由 API 路由 zod-openapi 声明直接生成
- **AND** 项目 MUST NOT 保留手写硬编码的端点表格

#### Scenario: Base URL 与 endpoint path

- **WHEN** API reference 展示接口列表或接口详情
- **THEN** base URL MUST 只在总览中单独说明
- **AND** endpoint 标题和接口表格 MUST 使用相对 path
- **AND** curl 示例 MAY 使用完整生产 URL

### Requirement: API 契约必须提供 OAS 机器可读文档

项目 SHALL 从 `apps/api` 路由内的 zod-openapi 声明自动生成 OAS，并 MUST 将 `apps/web/public/openapi.json` 作为唯一版本化生成输出；生成文件不得手工维护。

#### Scenario: OAS 文件存在

- **WHEN** 外部开发者或验证脚本查找 API 契约
- **THEN** 仓库 MUST 提供 `apps/web/public/openapi.json`
- **AND** 项目 MUST NOT 保留 `docs/api/openapi.json`、顶层 `api/openapi.json`、手写 `openapi.yaml` 或其他与路由声明脱节的 OAS 文件

#### Scenario: OAS 从路由自动生成

- **WHEN** 开发者修改 `apps/api/src/routes/*.ts` 中端点的 path、method、zod schema 或 OpenAPI metadata
- **THEN** `pnpm gen:openapi` MUST 重新生成 `apps/web/public/openapi.json`
- **AND** `pnpm verify` MUST 包含该生成步骤

#### Scenario: OAS 可被工具读取

- **WHEN** 验证脚本或 OpenAPI 工具读取 OAS 文件
- **THEN** OAS MUST 定义 `openapi` 版本、`info`、`servers`、`paths`、`components.schemas` 和认证方案
- **AND** OAS MUST NOT 包含生产 secret、真实用户 token 或私有环境变量
