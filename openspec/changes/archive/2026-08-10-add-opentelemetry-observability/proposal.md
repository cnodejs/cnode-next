## Why

当前 API 与 moderation worker 缺少跨 HTTP、Undici 和 PostgreSQL 调用链的统一追踪，生产故障只能依赖分散日志定位。生产 Compose 已计划纳管 OpenObserve，因此需要以 OpenTelemetry Collector 为隔离层建立可失效开放、最小权限且不泄露敏感内容的 traces 基线。

## What Changes

- 为 `apps/api` 的 Hono API 与 moderation worker 引入 Node.js OpenTelemetry SDK，通过早于受 instrumentation 模块加载的 ESM bootstrap/preload 初始化 tracing。
- 自动追踪 HTTP、Undici、PostgreSQL，并为 Hono 请求与错误建立 spans；API 为每个请求生成独立 Hono Request ID，通过响应头返回并关联到 request span；区分 API 与 worker 的 `service.name`，附加版本/commit、部署环境等低基数 resource attributes。
- 使用 parent-based ratio sampling，并支持显式禁用；SDK 缺失、配置错误或遥测后端不可用时，业务进程与请求保持可用。
- 应用仅通过 OTLP/HTTP 向内部 OpenTelemetry Collector 发送 traces；Collector 使用 memory limiter、batch、export retry，并通过可配置 OTLP endpoint、专用 Basic token 与 `stream-name: default` 写入 OpenObserve；共享 dotenv 由现有 Compose 基线继续统一注入，但应用不得读取或使用 OpenObserve 凭据。
- 在生产 Compose 增加仅连接 `cnode-internal` 的 Collector 与版本化配置，不发布 OTLP receiver 宿主端口。
- 增加敏感数据与高基数治理：不采集 cookie、Authorization、session/token、请求/响应 body、邮件内容、用户正文或数据库凭据，并审查 SQL statement/attributes。
- 同步安全占位的 dotenv 示例，以及 `docs/arch/` 和 `docs/deployment/` 的架构与运维说明。
- 增加启动、故障降级、采样、安全字段、服务区分和 Compose 只读渲染验证；普通 `pnpm verify` 不启动 Docker Compose。

## Capabilities

### New Capabilities

- `application-tracing`：定义 API 与 moderation worker 的初始化顺序、自动与 Hono tracing、资源属性、采样、敏感信息约束及 fail-open 行为。
- `telemetry-pipeline`：定义应用经内部 Collector 向 OpenObserve 发送 traces 的 Compose 拓扑、处理器、重试、最小权限凭据与只读验证行为。

### Modified Capabilities

无。现有 `runtime-environment-contract` 已约束新增应用变量采用 `CNODE_*`，现有部署规范无需改变既有 requirement。

## Impact

### Scope

- In scope：`apps/api` API 与 moderation worker 启动链、Node.js OpenTelemetry 依赖和测试、Hono Request ID 与 trace 关联、Collector Compose 服务与配置、受版本控制的 dotenv 示例、`docs/arch/` 与 `docs/deployment/`，以及本 proposal 新增的 capabilities。
- Out of scope：浏览器 tracing、Web SSR tracing、完整 metrics/dashboard/alert、Redis 自定义 span、全面替换 `console.*`、PostgreSQL schema/data/migration/seed，以及 OpenObserve 镜像选择。
- Affected systems：API/worker Node.js runtime、生产 Compose 内网、OpenTelemetry Collector、OpenObserve ingestion、CI 与部署 preflight。
- High-risk categories：ESM 模块加载顺序、遥测故障影响业务、凭据隔离、敏感数据泄露、trace 高基数与采样成本。
- Deployment prerequisite：依赖 `simplify-compose-operations` 提供 OpenObserve 基线；实际 OTLP endpoint 与专用 ingestion token 由部署 dotenv 提供。本 change 不修改该 change；其 `latest` 镜像存在兼容漂移风险，本 change 记录并验证兼容性，但不改变镜像选择。

### Documentation Impact

- `docs/arch/` 记录 tracing 初始化边界、数据流、resource 与敏感数据策略；`docs/deployment/` 更新 Collector、专用 ingestion 凭据、采样、验证和故障排查。
- `docs/deployment/env.production.example` 及适用的根 dotenv example 只增加安全占位项，不读取或复制真实 dotenv。
- `docs/biz/`、根治理文件、app README、生成的 Web OpenAPI 资产不受影响。
- 适用 Skill：`cnode-docs`，用于文档归属、安全示例和单一权威来源。

## Non-goals

- MVP 以 traces 为主；结构化日志与 `trace_id`/`span_id` 关联仅允许作为有限后续阶段，不承诺日志体系迁移。
- 不让 Hono 直接调用 OpenObserve，不向宿主公网发布 OTLP receiver，不让应用代码读取或使用 OpenObserve 凭据。
- 不暴露真实 secret、用户数据、生产地址或仓库外私有拓扑。
