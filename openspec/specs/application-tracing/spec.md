# application-tracing Specification

## Purpose
TBD - created by archiving change add-opentelemetry-observability. Update Purpose after archive.
## Requirements
### Requirement: Telemetry 必须早于受 instrumentation 模块初始化

API 与 moderation worker SHALL 通过共同的 ESM bootstrap 初始化 OpenTelemetry，并且 SDK 注册 MUST 早于 Hono、HTTP、Undici、PostgreSQL 及其客户端模块加载。

#### Scenario: 启动 API
- **WHEN** 开发脚本或生产容器启动 API
- **THEN** bootstrap MUST 先加载环境配置并完成 telemetry 初始化
- **AND** 随后 MUST 通过动态 import 加载 API 业务入口

#### Scenario: 启动 moderation worker
- **WHEN** worker 命令启动 moderation worker
- **THEN** worker MUST 经过与 API 相同的 telemetry bootstrap
- **AND** PostgreSQL、Undici 或 HTTP 客户端模块 MUST NOT 在 SDK 注册前加载

### Requirement: 应用 tracing 必须可禁用且 fail-open

Telemetry SDK SHALL 支持显式禁用；缺少或无效配置、SDK 初始化失败、Collector 不可用或 OpenObserve 不可用 MUST NOT 阻止 API/worker 启动，也 MUST NOT 阻断或改变业务请求结果。

#### Scenario: SDK 被禁用
- **WHEN** `CNODE_OTEL_ENABLED` 未启用
- **THEN** API MUST 启动并响应 `/health`
- **AND** moderation worker MUST 能进入其正常工作循环

#### Scenario: SDK 配置错误
- **WHEN** OTLP endpoint 缺失或采样 ratio 无效
- **THEN** bootstrap MUST 使用 no-op telemetry 继续加载业务入口
- **AND** 诊断信息 MUST NOT 输出 endpoint 值、凭据或其他 secret

#### Scenario: 遥测后端不可用
- **WHEN** Collector 或 OpenObserve 在 API 处理请求时不可连接
- **THEN** API MUST 在不等待遥测恢复的情况下返回业务响应
- **AND** exporter retry、flush 或 shutdown MUST 使用有界资源与等待时间

### Requirement: API 与 worker 必须具有稳定且可区分的资源属性

应用 spans SHALL 提供低基数 OpenTelemetry resource attributes；API 的 `service.name` MUST 为 `cnode-api`，moderation worker 的 `service.name` MUST 为 `cnode-moderation-worker`，并包含可用的 `service.version`、commit revision 和 `deployment.environment`。

#### Scenario: 导出 API 与 worker spans
- **WHEN** 测试 exporter 分别接收 API 和 worker span
- **THEN** 两组 span MUST 使用不同且预期的 `service.name`
- **AND** version、commit 与 deployment environment MUST 来自稳定部署配置或稳定未知占位
- **AND** resource attributes MUST NOT 包含 request ID、user ID、topic ID 或其他逐请求值

### Requirement: API 必须提供独立且受控的 Hono Request ID

API SHALL 为每个 Hono 请求生成独立 UUID Request ID，将其保存在请求 context，并通过 `X-Request-ID` response header 返回；Request ID MUST 与 OpenTelemetry trace ID 保持不同语义，且 MUST NOT 替代 W3C Trace Context。

#### Scenario: 公网请求建立本地 trace
- **WHEN** API 收到公网请求，无论其是否携带调用方控制的 `traceparent`
- **THEN** OpenTelemetry SDK MUST 为 root trace 生成有效的 128-bit trace ID
- **AND** Hono MUST 独立生成 UUID Request ID
- **AND** response MUST 返回该 Request ID

#### Scenario: 调用方尝试控制 trace context
- **WHEN** 公网请求携带调用方提供的有效或无效 W3C `traceparent`
- **THEN** API MUST NOT 将其作为可信 parent 或沿用其 trace ID
- **AND** 调用方提供的 sampled flag MUST NOT 强制该请求被采样

#### Scenario: 调用方提供 Request ID
- **WHEN** 公网请求包含调用方控制的 `X-Request-ID`
- **THEN** API MUST NOT 将该值作为服务端 Request ID
- **AND** response MUST 返回服务端生成的固定格式 UUID

#### Scenario: 关联已采样 request span
- **WHEN** request span 被采样并导出
- **THEN** span MAY 以 `cnode.request.id` 携带服务端生成的 Request ID
- **AND** Request ID MUST NOT 出现在 resource attributes 或 metrics labels

#### Scenario: tracing 禁用或请求未采样
- **WHEN** telemetry 被禁用或 sampler 不记录该请求
- **THEN** API MUST 仍生成并返回 Request ID
- **AND** 系统 MUST NOT 声称该 Request ID 必然对应可检索的 trace 或日志

### Requirement: 应用必须使用 parent-based ratio sampling

Tracing SHALL 使用 parent-based sampler 包装 trace-id ratio root sampler，并通过已验证的 `[0,1]` ratio 配置控制本地 root traces。当前公网 API 入站请求 SHALL 作为本地 root，不得信任调用方提供的远程 parent；parent-based 继承 SHALL 适用于该 root 以下的进程内 child spans。

#### Scenario: 活动本地 parent 提供采样决定
- **WHEN** Hono、HTTP、Undici 或 PostgreSQL child span 在活动本地 parent 下创建
- **THEN** child span MUST 继承本地 parent 的 sampled 或 not-sampled 决定

#### Scenario: 创建本地 root trace
- **WHEN** 请求或 worker 操作没有有效 parent trace
- **THEN** SDK MUST 按配置的 ratio 决定是否采样
- **AND** ratio 为 `0` 与 `1` 的测试 MUST 分别产生确定的不采样与全采样结果

#### Scenario: ratio 无效
- **WHEN** ratio 不是有限数或超出 `[0,1]`
- **THEN** telemetry MUST 降级为 no-op
- **AND** API 与 worker MUST 继续启动

### Requirement: MVP 必须覆盖 HTTP、Undici、PostgreSQL 与 Hono 请求错误

Node.js SDK SHALL 自动 instrument HTTP、Undici 与 PostgreSQL；Hono middleware SHALL 为请求建立使用匹配路由模板命名的关联 span，并记录状态码与经过分类的错误状态。

#### Scenario: Hono 请求成功
- **WHEN** 客户端请求包含路径参数或 query 的 Hono route
- **THEN** request span MUST 使用匹配路由模板而不是原始 URL 命名
- **AND** span MUST 记录 HTTP method、route 和 response status

#### Scenario: Hono 请求失败
- **WHEN** route 或 middleware 抛出错误
- **THEN** request span MUST 标记 error status
- **AND** span MAY 记录经过 allowlist 的错误类型
- **AND** span MUST NOT 记录原始 error message、stack 或 response body

#### Scenario: 应用发出 HTTP 或 PostgreSQL 调用
- **WHEN** API 或 worker 在活动 trace 内使用 HTTP、Undici 或 PostgreSQL 客户端
- **THEN** 对应 client spans MUST 与活动 trace 关联

### Requirement: Spans 不得携带敏感内容或不受控高基数数据

应用 SHALL 在 export 前删除敏感与不受控高基数 attributes，并且 instrumentation MUST NOT 采集 cookie、Authorization、session/token、请求/响应 body、邮件内容、用户正文、数据库凭据、连接串、SQL statement 或 SQL parameters。

#### Scenario: 处理含认证和正文的请求
- **WHEN** 请求包含 cookie、Authorization、session/token 或用户正文
- **THEN** 导出的 resource、span attributes 和 events MUST NOT 包含这些 header 名对应的值或 body 内容

#### Scenario: 执行 PostgreSQL 查询
- **WHEN** PostgreSQL instrumentation 观察参数化或动态查询
- **THEN** 导出 span MUST NOT 包含 `db.statement`、`db.query.text`、query parameters、连接串、数据库用户名或密码
- **AND** span MAY 保留低基数数据库系统和 operation 属性

#### Scenario: 发送邮件或处理用户内容
- **WHEN** 活动 trace 覆盖邮件发送或 moderation 扫描
- **THEN** span MUST NOT 包含邮件正文、收件人内容、topic/reply 正文、命中的敏感词或内容 preview

### Requirement: MVP 日志范围必须保持有限

本 change SHALL 以 traces 为默认交付，不得要求全面替换现有 `console.*`；若增加日志关联，MUST 仅限结构化记录中的 `trace_id`/`span_id` 且遵守相同敏感信息限制。

#### Scenario: 验收 MVP
- **WHEN** 维护者检查实现范围
- **THEN** traces MUST 可独立运行和验收
- **AND** 验收 MUST NOT 以完成全应用日志迁移、metrics、dashboard 或 alert 为前提
