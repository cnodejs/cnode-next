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
- **AND** `apps/web/public/openapi.json` MUST 是 `api/openapi.json` 的副本
- **AND** 项目 MUST NOT 保留手写硬编码的端点表格（`apps/web/app/routes/api.tsx` 中的 `endpoints` 数组）

#### Scenario: Base URL 与 endpoint path

- **WHEN** API reference 展示接口列表或接口详情
- **THEN** base URL MUST 只在总览中单独说明
- **AND** endpoint 标题和接口表格 MUST 使用相对 path
- **AND** curl 示例 MAY 使用完整生产 URL

### Requirement: API reference 必须使用统一接口模板

API reference SHALL 对每个核心公开接口使用一致的查阅模板，使读者能快速找到 method、path、认证、参数、请求体、响应字段、错误和示例。

#### Scenario: 接口详情模板

- **WHEN** 文档描述一个核心公开 API endpoint
- **THEN** 文档 MUST 包含 method、relative path、认证要求和一句话 description
- **AND** 文档 MUST 按需包含 `Path Params`、`Query`、`Body`、`Response`、`Errors` 和 `Example` 信息
- **AND** 参数、请求体和响应字段 MUST 优先使用 Markdown 表格
- **AND** 普通说明、错误摘要和示例 MUST NOT 被机械地全部表格化

#### Scenario: 参数表格

- **WHEN** endpoint 有 path params、query 或 body 字段
- **THEN** 文档 MUST 使用 `Name`、`Type`、`Required`、`Default` 或 `Description` 等稳定列说明字段
- **AND** 空 section MAY 省略以保持文档简洁

#### Scenario: 响应和错误表格

- **WHEN** endpoint 有成功响应或错误响应说明
- **THEN** 文档 MUST 使用表格列出核心 response fields、类型和含义
- **AND** 常见错误 MUST 使用 status、message/code 和 description 表格描述

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

### Requirement: OAS 接口必须按对外能力分组

OAS SHALL 使用 tags 按外部能力分组，而不是按代码文件、数据库表或内部模块分组。

#### Scenario: 核心接口分组

- **WHEN** 外部开发者浏览 OAS tags
- **THEN** tags MUST 至少覆盖帖子、回复、用户、收藏、消息、认证、搜索和系统配置
- **AND** 帖子与回复能力 MUST 作为最核心分组出现在文档中

#### Scenario: 管理和内部接口分组

- **WHEN** OAS 包含后台管理、巡检或运维接口
- **THEN** 这些接口 MUST 使用单独 tag 标记为管理或内部能力
- **AND** 文档 MUST 明确它们不是普通外部客户端的主要集成入口

### Requirement: OAS 必须优先覆盖帖子和回复能力

OAS SHALL 第一优先级覆盖对外展示和客户端高频使用的帖子、回复、用户、收藏和消息能力。

#### Scenario: 帖子 API 覆盖

- **WHEN** 外部开发者查看帖子能力
- **THEN** OAS MUST 覆盖帖子列表、帖子详情、发帖、编辑帖子和相关参数
- **AND** OAS MUST 展示成功响应、错误响应、分页和 `mdrender` 语义

#### Scenario: 回复 API 覆盖

- **WHEN** 外部开发者查看回复能力
- **THEN** OAS MUST 覆盖回复列表或帖子回复、创建回复、编辑回复、删除回复、点赞和取消点赞
- **AND** OAS MUST 展示回复作者、内容、时间、点赞状态和 legacy-compatible 字段

#### Scenario: 用户、收藏和消息 API 覆盖

- **WHEN** 外部开发者查看用户、收藏和消息能力
- **THEN** OAS MUST 覆盖用户资料、用户话题、用户回复、收藏/取消收藏、消息列表和消息已读
- **AND** OAS MUST 标注每个接口的认证要求

### Requirement: API 文档必须覆盖 nodeclub 兼容语义

API reference SHALL 明确 `/api/v1/*` 与 legacy `../nodeclub/api_router_v1.js` 和 `../nodeclub/api/v1/` 的兼容关系，但兼容背景 MUST 保持简洁并集中说明。

#### Scenario: 兼容字段说明

- **WHEN** API 响应包含 legacy 字段名、嵌套结构或兼容行为
- **THEN** 文档 MUST 标明字段含义和兼容原因
- **AND** 文档 MUST 标明任何显式废弃、redirect 或不再支持的 legacy 行为

#### Scenario: Markdown 内容渲染说明

- **WHEN** API endpoint 返回 topic、reply 或 message content
- **THEN** 文档 MUST 说明 `mdrender` 参数或默认渲染语义
- **AND** 文档 MUST 给出原始 Markdown 与 HTML 渲染响应的示例

### Requirement: API 文档必须与发布验证关联

API 文档 SHALL 作为 release verification 的检查项，避免实现、OpenSpec 和外部文档长期漂移，但普通 API reference MUST NOT 使用内部评级语言作为读者主叙事。

#### Scenario: 发布前检查 API 文档

- **WHEN** release checklist 被执行
- **THEN** checklist MUST 要求确认新增或变更 API 已更新 API reference
- **AND** 若 API 行为发生变化但文档未更新，发布 MUST 被视为未满足发布准入

#### Scenario: API smoke 与文档示例一致

- **WHEN** API smoke 或 contract verifier 覆盖某个公开 endpoint
- **THEN** 文档中的示例响应 shape MUST 与 verifier 期望的核心字段一致
- **AND** 文档不得展示已废弃或不可调用的示例作为推荐用法

#### Scenario: OAS 被 smoke 或 contract 验证复用

- **WHEN** 未来实现 API smoke 或 contract verifier
- **THEN** verifier SHOULD 复用 OAS 中的 paths、methods、schemas 或 examples 作为检查来源
- **AND** 若 verifier 暂未完全复用 OAS，release checklist MUST 明确记录覆盖差距

## REMOVED Requirements

### Requirement: API reference 必须使用 redocly build-docs 产出静态 HTML

**Reason**: API 文档改由 `swagger-ui-react` 在 `apps/web` 的 `/api` 路由直接渲染 OAS，不再需要 `redocly build-docs` 产出 `api/_generated/index.html` 静态文件。
**Migration**: 删除 `pnpm build:api-docs` 脚本和 `api/_generated/` 目录。外部开发者通过 `apps/web` 的 `/api` 页面或直接读取 `api/openapi.json` 获取文档。

### Requirement: OAS 必须通过 redocly lint 校验

**Reason**: OAS 改由 `@hono/zod-openapi` 从路由声明自动生成，合规性由生成器保证，不再需要 redocly lint 兜底手写 yaml 的规范错误。
**Migration**: 删除 `@redocly/cli` 依赖、`redocly.yaml` 配置、`pnpm verify:openapi` 脚本。`pnpm verify` 的 OAS 环节由 `pnpm gen:openapi` 替代——生成成功即证明路由声明可产出合规 OAS。
