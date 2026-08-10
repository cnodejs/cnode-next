## 1. MVP 基础与依赖

- [x] 1.1 确认 `simplify-compose-operations` 已提供 OpenObserve 基线，记录实际 endpoint、OpenObserve digest 的兼容检查方法，但不修改该 change 或其 `latest` 镜像选择（预计 0.5h）
- [x] 1.2 为 `apps/api` 增加版本相互兼容的 OpenTelemetry Node SDK、OTLP/HTTP exporter、resources、semantic conventions 及 HTTP/Undici/PostgreSQL instrumentation 依赖并更新 lockfile（预计 1h）
- [x] 1.3 实现共享 typed telemetry 配置解析，覆盖 enabled、Collector endpoint、`[0,1]` sample ratio、部署环境和稳定版本/commit 属性，确保错误只报告变量名与类型（预计 1.5h）
- [x] 1.4 增加配置单元测试，覆盖默认禁用、有效 ratio、`0`、`1`、非有限数、越界值和缺失 endpoint（预计 1h）

## 2. MVP 应用 tracing

- [x] 2.1 实现 API/worker 共用 NodeSDK 初始化与 no-op fail-open 边界，配置 OTLP/HTTP exporter、`ParentBasedSampler(TraceIdRatioBasedSampler)` 和有界 shutdown（预计 1.5h）
- [x] 2.2 配置 HTTP、Undici、PostgreSQL 自动 instrumentation，关闭 body/header 捕获并限制数据库属性为低基数 operation/system 信息（预计 1h）
- [x] 2.3 实现 export 前 span sanitizer，删除 cookie、Authorization、session/token、body、邮件/用户内容、连接串、数据库身份、SQL text/parameters 等禁止属性（预计 1.5h）
- [x] 2.4 实现 Hono tracing 与 Request ID middleware：以匹配路由模板命名关联 span，记录 method/status 和 allowlist 错误类型；为每个请求生成独立 UUID，通过 `X-Request-ID` 返回并以 `cnode.request.id` 关联已采样 request span；不信任入站 Request ID，不记录原始异常 message/stack（预计 2h）
- [x] 2.5 增加 exporter/middleware 测试，验证路由模板、错误状态、公网投递 `traceparent` 不控制本地 trace ID 或强制采样、Request ID 独立性和响应头、提前返回/错误路径、HTTP/Undici/PostgreSQL child 关联及禁止字段缺失（预计 2.5h）

## 3. MVP Bootstrap 与启动路径

- [x] 3.1 实现先加载 dotenv 和 telemetry、再按角色动态 import API 或 moderation worker 的 ESM + `tsx` bootstrap（预计 1h）
- [x] 3.2 将 API dev、moderation worker script 与 Docker `CMD` 切换到共同 bootstrap，并保持业务入口可单独导入测试（预计 1h）
- [x] 3.3 增加导入顺序与角色 resource 测试，证明 SDK 注册早于 Hono/HTTP/Undici/PostgreSQL，且 `service.name` 分别为 `cnode-api` 和 `cnode-moderation-worker`（预计 1.5h）
- [x] 3.4 增加 disabled、配置错误和 SDK 初始化失败时的启动测试，验证 API 仍响应 `/health` 且 worker 可进入工作循环（预计 1.5h）
- [x] 3.5 使用不可连接的本地 OTLP endpoint 测试 exporter 故障，验证请求结果不受影响、queue/等待有界且诊断不包含配置值（预计 1h）

## 4. MVP Collector 与 Compose

- [x] 4.1 选择并锁定与当前 OpenObserve OTLP ingestion 兼容的具体 OpenTelemetry Collector Contrib 镜像版本（不得使用 `latest`），记录版本依据（预计 0.5h）
- [x] 4.2 增加 Collector 配置：OTLP/HTTP receiver、`memory_limiter`、敏感属性删除、`batch`、有界 queue/timeout/retry 及 OpenObserve exporter（预计 1.5h）
- [x] 4.3 在生产 Compose 增加仅连接 `cnode-internal`、不发布宿主端口、只读挂载配置的 Collector，并让 API/worker 仅持有 Collector endpoint（预计 1.5h）
- [x] 4.4 更新单一 dotenv example，加入 `CNODE_OTEL_*` 和 Collector 专用 ingestion 凭据安全占位；确认 API、worker、Web 的配置与代码不读取或使用 ingestion password 或 `ZO_ROOT_USER_PASSWORD`（预计 1h）
- [x] 4.5 增加 Collector 配置静态测试或 fixture 验证，确认处理器顺序、retry/资源上限及第二层敏感属性删除（预计 1.5h）
- [x] 4.6 以安全占位值执行只读 `docker compose config` preflight，验证 service DNS、网络、无 `ports`、环境隔离和 OpenObserve 基址；不得启动服务或读取真实 dotenv（预计 1h）

## 5. 功能完整与故障验收

- [x] 5.1 使用内存 exporter 验证 API/worker 的 `service.name`、version/commit/environment 稳定属性及无逐请求 resource 高基数值（预计 1h）
- [x] 5.2 验证本地 parent sampled/not-sampled 继承、root ratio `0`/`1` 的确定行为，以及公网 `traceparent` 的 trace ID/sampled flag 均不被信任（预计 1h）
- [x] 5.3 执行含 cookie、Authorization、token、请求/响应 body、邮件内容、用户正文和 moderation preview 的 fixture 测试，断言导出 telemetry 不含原值（预计 1.5h）
- [x] 5.4 执行含动态 SQL、参数与数据库凭据 fixture 的测试，断言不存在 `db.statement`、`db.query.text`、parameters、连接串、用户名或密码（预计 1h）
- [x] 5.5 验证 Collector/OpenObserve 长时间不可用时 API 请求与 worker 循环不阻断，telemetry 达到 queue/memory 限制时可丢弃且进程可有界退出（预计 1.5h）

## 6. 文档同步

- [x] 6.1 在 `docs/arch/` 选择一个权威 owner，记录 bootstrap 导入顺序、W3C trace ID 与 Hono Request ID 的不同生命周期、数据流、sampling/resource 契约、敏感与高基数边界，并核对 Mermaid 图与最终实现一致（预计 1.5h）
- [x] 6.2 更新 `docs/deployment/deployment.md` 或既有权威部署文档，覆盖专用最小权限 ingestion 身份、只读 preflight、启停/回滚、fail-open 排障及 OpenObserve `latest` digest 兼容风险（预计 1.5h）
- [x] 6.3 审查 dotenv examples 与文档：仅保留安全占位，不包含真实 secret、用户数据、生产地址或私有拓扑；检查并移除过时/重复路径引用，不新增 README/index（预计 1h）
- [x] 6.4 明确 MVP 只承诺 traces；将结构化日志 `trace_id`/`span_id` 关联列为有限后续项，不承诺全面替换 `console.*`、metrics/dashboard/alert 或 Web tracing（预计 0.5h）

## 7. 验证与审计

- [x] 7.1 运行 API targeted tests、lint 和 typecheck，修复 tracing 与 bootstrap 回归（预计 1h）
- [x] 7.2 运行 `pnpm secrets:scan`，确认代码、Collector 配置、dotenv examples 和文档没有真实凭据或用户数据（预计 0.5h）
- [x] 7.3 运行 `pnpm verify` 并确认其未执行 `docker compose up`、未创建容器、未连接真实 OpenObserve；Compose 只读 render 仅保留为部署 preflight（预计 1.5h）
- [x] 7.4 执行 Database Change Audit，确认 `packages/db/src/schema/`、Drizzle migrations、seed 和真实 PostgreSQL 数据均未被修改（预计 0.5h）
- [x] 7.5 运行当前 CLI 支持的 OpenSpec strict validation，复核 proposal、design、specs、tasks、文档图示与实现一致并达到 archive-ready（预计 0.5h）
