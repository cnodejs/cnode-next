## Why

现有 OpenTelemetry 链路只导出 traces，API 与 moderation worker 的运行日志仍是非结构化 `console.*`，请求量、错误率、延迟和 Node.js 运行状态也无法连续观测。将结构化日志和低基数指标接入既有 Collector/OpenObserve 链路，可以在不接触业务数据的前提下关联请求、错误和运行状态。

## What Changes

- 为 `cnode-api` 的每个 HTTP 请求记录一条结构化 completion access log，并关联服务端 `request_id` 以及可用的 trace context。
- 将 API 与 moderation worker 的异常、启动、关闭、telemetry 降级和 worker tick 结果改为受控的结构化运行日志。
- 为 API 提供全量聚合的 HTTP 请求量、耗时、并发请求和错误指标，不从已采样 traces 推导请求指标。
- 为 moderation worker 提供 tick 耗时、结果、锁获取和失败指标，并为两个运行角色提供 Node.js runtime 指标。
- 扩展应用 telemetry 初始化与 Collector 配置，使 traces、logs 和 metrics 可独立启停、独立降级、批量导出并在关闭时有界刷新。
- 对日志采用源头 allowlist 与 Collector 二次清理，禁止采集认证信息、用户身份和内容、邮件内容、SQL、原始 URL query、请求/响应 body 及不受控异常详情。
- 保持 API 与 worker 的稳定且不同的 `service.name`，并同步生产部署配置、运维验证和可观测性架构说明。

## Capabilities

### New Capabilities

- `application-logs-metrics`: 定义 API 全量 access log、API/worker 运行日志、HTTP/worker/runtime 指标、关联字段、低基数和敏感数据边界。

### Modified Capabilities

- `application-tracing`: 将原 traces-only MVP 边界调整为三信号共存，并要求每种信号独立故障降级且共享稳定资源身份。
- `telemetry-pipeline`: 将应用到 OpenObserve 的 Collector 链路从 traces 扩展为 traces、logs 和 metrics 三条有界 pipeline，并增加日志清理与三信号部署验证。

## Impact

- 应用代码：`apps/api/src/telemetry/`、Hono telemetry/error/access-log middleware、API bootstrap、moderation worker 及现有生产 `console.*` 调用。
- 依赖：增加与当前 OpenTelemetry JS 版本线匹配的 logs、metrics exporter/SDK 和 Node.js runtime instrumentation 依赖。
- 部署：更新 `docs/deployment/otel-collector.yaml`、`docs/deployment/docker-compose.yml` 和安全 dotenv example；应用继续只连接内部 Collector，不持有 OpenObserve 凭据。
- 后端：OpenObserve 接收 API 与 worker 的 traces、logs 和 metrics；不改变公开 HTTP API、数据库 schema 或业务数据。
- 高风险类别：日志敏感信息泄露、metric attribute 高基数、全量 access log 存储增长、Exporter 故障向业务传播延迟、shutdown 等待失控。

## Scope

包含 `cnode-api` 与 `cnode-moderation-worker` 两个运行角色，以及它们共用的 bootstrap、SDK、Collector 和 OpenObserve ingestion 链路。API access log 覆盖包括 `/health` 在内的每个 HTTP 请求，每个请求只生成一条 completion access log。

不包含 Web、PostgreSQL/Redis telemetry、Docker/宿主机指标、Collector/OpenObserve 自监控、dashboard/alert 体系、tail sampling、用户行为分析或基于业务内容的指标。

## Non-goals

- 不保证每条全量日志都能定位到 trace；未采样请求可以没有可检索 trace。
- 不采集请求/响应正文、用户内容、用户身份、邮件地址或主题、SQL、原始异常 message/stack。
- 不通过 Docker socket、容器日志目录或基础设施 exporter 收集遥测。
- 不改变 moderation scan 的任务状态、领取、恢复或业务处理语义。

## Documentation Impact

- 更新 `docs/arch/architecture.md` 中应用三信号、资源身份、关联和敏感数据边界。
- 更新 `docs/deployment/deployment.md`、`otel-collector.yaml`、`docker-compose.yml` 与 `env.production.example` 中的配置、验证、降级和回滚说明。
- `docs/biz/`、根治理文件、`apps/*/README.md` 和生成的 `apps/web/public/openapi.json` 不需要修改，因为本 change 不改变业务规则、贡献治理、应用命令或公开 API 契约。
- 文档工作适用 `cnode-docs` Skill，并只使用安全占位配置。
