## ADDED Requirements

### Requirement: 应用 logs 与 metrics 必须经 Collector 发送到 OpenObserve

生产 logs 与 metrics SHALL 复用“应用 -> OpenTelemetry Collector -> OpenObserve”链路；API 与 worker MUST 通过内部 OTLP/HTTP receiver 发送，并且应用 MUST NOT 直接调用 OpenObserve ingestion API 或持有 ingestion 凭据。

#### Scenario: 渲染三信号生产拓扑

- **WHEN** 运维使用安全占位配置渲染生产 Compose
- **THEN** API 与 worker 的 traces、logs 和 metrics endpoint MUST 指向 Collector service DNS
- **AND** Collector MUST 为三种信号配置 OpenObserve exporter pipeline
- **AND** 应用 MUST NOT 引用 OpenObserve ingestion URL、root password 或 ingestion token

### Requirement: Collector logs 与 metrics pipeline 必须有界

Collector SHALL 为 logs 与 metrics pipeline 配置 `memory_limiter` 和 `batch` processors，并复用有界 exporter queue、发送超时和 retry。Logs pipeline SHALL 在 export 前执行敏感属性清理；metrics pipeline SHALL 保留低基数 resource 和 data point attributes。

#### Scenario: OpenObserve 暂时不可用

- **WHEN** Collector 无法导出 logs 或 metrics
- **THEN** exporter MUST 进行有界重试
- **AND** queue 或内存达到限制时 MUST 丢弃 telemetry 而不是向 API/worker 传播背压

#### Scenario: Collector 处理应用日志

- **WHEN** logs pipeline 收到含禁止属性的测试 log record
- **THEN** 禁止属性和值 MUST 在 exporter 前被删除
- **AND** event name、severity、service resource 与安全关联字段 MUST 保留

#### Scenario: Collector 处理应用指标

- **WHEN** metrics pipeline 收到 API 或 worker metrics
- **THEN** `memory_limiter` MUST 在 `batch` 前执行
- **AND** Collector MUST NOT 从采样 traces 推导全量 API 请求指标

### Requirement: 三信号部署必须可独立验证和回滚

部署说明 SHALL 提供 traces、logs 和 metrics 的独立启停、验证和故障降级步骤。关闭 logs 或 metrics MUST NOT 要求修改应用镜像，也 MUST NOT 要求关闭 traces 或停止 Collector。

#### Scenario: 独立关闭 logs ingestion

- **WHEN** 运维因日志量或字段风险关闭 logs signal 并重启 API/worker
- **THEN** traces 与 metrics MUST 能继续发送
- **AND** API 与 worker 的结构化 stdout 日志 MUST 继续可用

#### Scenario: 验证生产三信号

- **WHEN** 新版本完成生产启动
- **THEN** 运维 MUST 验证 `cnode-api` 的 request logs、HTTP metrics 和 traces
- **AND** 运维 MUST 验证 `cnode-moderation-worker` 的运行日志、worker/runtime metrics 和 traces
- **AND** 验证记录 MUST 不包含用户数据、凭据或私有 endpoint

## MODIFIED Requirements

### Requirement: 部署与架构说明必须同步

实施 SHALL 更新 `docs/arch/` 的应用 traces、logs 和 metrics 架构权威说明、`docs/deployment/` 的 Collector 运维说明和适用 dotenv examples，并仅使用安全占位值。

#### Scenario: 审查文档同步

- **WHEN** 维护者完成实现
- **THEN** 架构说明 MUST 覆盖 bootstrap、采样、三信号资源属性、日志/trace 关联、指标低基数和敏感数据边界
- **AND** 部署说明 MUST 覆盖三信号 endpoint、专用 ingestion 身份、独立启停、只读 preflight、故障降级、回滚和 OpenObserve `latest` 兼容风险
- **AND** 文档 MUST NOT 包含真实 secret、用户数据、生产地址或仓库外私有拓扑
