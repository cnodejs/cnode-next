# web-api-contract-integration Specification

## Purpose
TBD - created by archiving change reach-production-grade-release-readiness. Update Purpose after archive.
## Requirements
### Requirement: Web API 调用必须引用 OAS 契约
`apps/web` SHALL 与 OAS API 契约建立持续校验关系，避免前端调用、后端实现和外部 API 文档漂移。

#### Scenario: Web 使用 OAS 类型或校验
- **WHEN** `apps/web` 调用 `/api/v1/*` 或其他公开 API
- **THEN** 项目 MUST 提供从 OAS 生成的 TypeScript 类型、生成 API client、或验证脚本中的 OAS path/schema 校验
- **AND** 该机制 MUST 被 `pnpm verify` 或 release readiness checklist 覆盖

#### Scenario: Web 调用未记录 API
- **WHEN** `apps/web` 新增对某个 API path 的调用
- **THEN** OAS MUST 包含该 path、method、认证要求和核心响应 schema
- **AND** 若 OAS 未覆盖该调用，验证 MUST 失败或 release readiness checklist MUST 标记为未达 D 级准入

### Requirement: OAS 更新必须能驱动 Web 契约同步
当 OAS 中影响 Web 的 API path、method、request 或 response schema 发生变化时，项目 SHALL 提供机制提醒或阻断未同步的 Web 调用。

#### Scenario: OAS 删除 Web 依赖接口
- **WHEN** OAS 删除或重命名 `apps/web` 仍在调用的 API path
- **THEN** 验证 MUST 失败或生成类型 MUST 导致 typecheck 失败
- **AND** 开发者 MUST 同步更新 Web 调用或恢复 OAS 契约

#### Scenario: OAS 修改核心响应字段
- **WHEN** OAS 修改 Web loader、action 或组件依赖的核心响应字段
- **THEN** 生成类型或契约验证 MUST 能提示 Web 代码需要同步
- **AND** Web 不得继续依赖已从 OAS 移除的字段作为稳定契约

### Requirement: Web 契约集成必须优先覆盖核心外部能力
Web 与 OAS 的持续集成 SHALL 优先覆盖帖子、回复、用户、收藏和消息相关 API。

#### Scenario: 帖子和回复调用被覆盖
- **WHEN** Web 加载首页、话题详情、发帖或回帖页面
- **THEN** 相关 API paths MUST 在 OAS 中定义
- **AND** Web 契约校验 MUST 覆盖这些 paths 的 method 和核心响应字段

#### Scenario: 用户、收藏和消息调用被覆盖
- **WHEN** Web 加载用户页、收藏状态或消息页
- **THEN** 相关 API paths MUST 在 OAS 中定义
- **AND** Web 契约校验 MUST 标注登录态或 access token 要求

