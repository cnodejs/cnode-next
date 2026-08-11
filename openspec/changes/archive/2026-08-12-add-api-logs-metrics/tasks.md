## 1. MVP Telemetry 基础

- [x] 1.1 为 `apps/api` 增加与当前 OpenTelemetry 版本线匹配的 logs、metrics exporter/SDK 和 Node.js runtime instrumentation 依赖，并确认 lockfile 只包含预期变更
- [x] 1.2 扩展 telemetry 配置解析，支持内部 OTLP base endpoint、总开关和 traces/logs/metrics 独立开关，并为有效、无效和默认配置补充单元测试
- [x] 1.3 重构 telemetry runtime，使三个信号共享稳定 resource、独立初始化/降级，并在共同超时内并发执行有界 shutdown
- [x] 1.4 为三信号初始化失败、单信号禁用、其他信号继续运行和 shutdown 超时补充 failure-path 测试

## 2. MVP 结构化日志

- [x] 2.1 实现字段 allowlist 的应用日志接口，使固定事件同时输出单行 JSON stdout 和可选 OTel LogRecord，并关联 active trace context
- [x] 2.2 为日志接口补充 severity、resource、trace/span/sample 关联、OTLP 禁用 stdout 兜底和禁止任意 Error/对象字段的测试
- [x] 2.3 在 Hono telemetry middleware 中生成每请求一条 completion access log，使用最终 route template、status、duration 和服务端 Request ID，并移除文本 Hono access logger
- [x] 2.4 为成功、4xx、5xx、unmatched、`/health`、未采样请求和 middleware 抛错场景验证单请求单日志与安全字段
- [x] 2.5 将 API error、bootstrap、server lifecycle、Turnstile 和邮件运行日志迁移到固定事件，并验证邮箱、主题、正文、配置值、error message/stack 不会输出
- [x] 2.6 将 moderation worker lifecycle、tick completion 和 failure 日志迁移到固定事件，验证 outcome 有限且不包含 job ID、lock owner、敏感词或扫描内容

## 3. Feature-Complete 应用指标

- [x] 3.1 定义封装后的 API HTTP instruments，记录全量 request count、duration、active requests 和 errors，并限制 method、route template、status 与 allowlist error type attributes
- [x] 3.2 使用 in-memory metric exporter 测试采样率不影响指标、动态路径聚合到 route template、异常 finally 恢复 active requests 且禁止高基数 attributes
- [x] 3.3 定义 moderation worker tick count、duration、lock outcome 和 failure instruments，并验证 telemetry 不会为生成指标增加 PostgreSQL/Redis 查询
- [x] 3.4 检查 queue drain 是否能自然返回 processed jobs 数量；若可以则增加和测试 counter，若不可以则记录首期省略结论且不改变业务读取路径
- [x] 3.5 为 API 与 worker 启用 Node.js CPU、内存、event loop 和 GC runtime metrics，并验证两个角色通过 `service.name` 区分且无逐请求 attributes

## 4. Feature-Complete Collector 与部署

- [x] 4.1 扩展 `docs/deployment/otel-collector.yaml`，增加有界 logs 和 metrics pipelines、日志二次清理及 OpenObserve exporter，并保持 receiver 不发布宿主端口
- [x] 4.2 为 Collector 配置增加静态验证 fixture，确认禁止日志属性被删除、安全关联字段保留且 metrics 不从采样 traces 推导
- [x] 4.3 更新 `docs/deployment/docker-compose.yml` 和 `env.production.example` 的内部 OTLP base endpoint 与三信号开关，确认应用不读取 OpenObserve ingestion 凭据
- [x] 4.4 使用安全 example 执行 Compose 只读 render，验证 API/worker/Collector 网络、配置覆盖和独立信号回滚，不启动 Docker Compose 服务

## 5. 文档与验证

- [x] 5.1 按 `cnode-docs` 更新 `docs/arch/architecture.md` 的三信号流、resource identity、采样关联、低基数和敏感数据边界，并检查 Mermaid 图与最终设计一致
- [x] 5.2 按 `cnode-docs` 更新 `docs/deployment/deployment.md` 的三信号启用、验证、故障降级和独立回滚，合并或删除被替代的 traces-only 说明
- [x] 5.3 检查文档权威 owner、过时路径和所有新增 example，确认没有真实 endpoint、凭据、用户数据或私有拓扑，并运行 `pnpm secrets:scan`
- [x] 5.4 运行 API targeted tests、`pnpm lint`、`pnpm typecheck`、`pnpm test` 和可行时的 `pnpm verify`，确认普通验证不会启动 Docker Compose
- [x] 5.5 审计 diff，确认 `packages/db/src/schema/`、Drizzle migrations、seed/bootstrap、Web 和公开 OpenAPI asset 没有本 change 引入的修改
- [x] 5.6 运行 `openspec validate add-api-logs-metrics --strict`，核对实现、测试、架构图和部署说明满足全部 scenarios 后再进入 archive
