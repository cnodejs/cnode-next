## MODIFIED Requirements

### Requirement: 应用 tracing 必须可禁用且 fail-open

Telemetry SDK SHALL 支持总开关以及 traces、logs 和 metrics 的独立开关；缺少或无效的单信号配置、SDK 初始化失败、Collector 不可用或 OpenObserve 不可用 MUST NOT 阻止 API/worker 启动，也 MUST NOT 阻断或改变业务请求结果。单个信号失败 MUST NOT 禁用其他已正确配置的信号。

#### Scenario: SDK 被整体禁用

- **WHEN** `CNODE_OTEL_ENABLED` 未启用
- **THEN** API MUST 启动并响应 `/health`
- **AND** moderation worker MUST 能进入其正常工作循环
- **AND** 应用结构化日志 MUST 继续写入 stdout

#### Scenario: 单个信号配置错误

- **WHEN** logs 或 metrics 配置无效而其他信号配置有效
- **THEN** bootstrap MUST 只将无效信号降级为 no-op 并继续加载业务入口
- **AND** 其他有效信号 MUST 继续运行
- **AND** 诊断信息 MUST NOT 输出 endpoint 值、凭据或其他 secret

#### Scenario: 遥测后端不可用

- **WHEN** Collector 或 OpenObserve 在 API 处理请求时不可连接
- **THEN** API MUST 在不等待遥测恢复的情况下返回业务响应
- **AND** exporter retry、flush 或 shutdown MUST 使用有界资源与等待时间

### Requirement: API 与 worker 必须具有稳定且可区分的资源属性

应用 traces、logs 和 metrics SHALL 共享低基数 OpenTelemetry resource attributes；API 的 `service.name` MUST 为 `cnode-api`，moderation worker 的 `service.name` MUST 为 `cnode-moderation-worker`，并包含可用的 `service.version`、commit revision 和 `deployment.environment`。

#### Scenario: 导出 API 与 worker telemetry

- **WHEN** 测试 exporter 分别接收 API 和 worker 的 spans、logs 或 metrics
- **THEN** 两个运行角色 MUST 使用不同且预期的 `service.name`
- **AND** 同一运行角色的三种信号 MUST 使用一致的 version、commit 与 deployment environment
- **AND** resource attributes MUST NOT 包含 Request ID、trace ID、user ID、topic ID 或其他逐请求值

### Requirement: MVP 日志范围必须保持有限

应用 SHALL 以固定结构的 access log、运行事件和错误事件替换生产运行路径中的自由格式日志；日志范围 MUST 限于 API 每请求一条 completion access log、API/worker 生命周期、telemetry 诊断、API 未处理错误和 worker tick 结果。日志关联 MUST 使用 `request_id` 以及可用的 `trace_id`、`span_id` 和 sampled 状态，并遵守与 spans 相同或更严格的敏感信息限制。

#### Scenario: 验收三信号范围

- **WHEN** 维护者检查实现范围
- **THEN** traces、logs 和 metrics MUST 可分别启停和验收
- **AND** 日志 MUST NOT 扩展为用户行为、业务内容、SQL 或邮件内容记录
- **AND** 未采样请求的日志 MUST NOT 被宣称必然具有可检索 trace
