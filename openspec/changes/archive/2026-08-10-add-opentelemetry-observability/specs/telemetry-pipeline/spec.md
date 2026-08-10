## ADDED Requirements

### Requirement: 应用 traces 必须经 Collector 发送到 OpenObserve

生产遥测链路 SHALL 使用“应用 -> OpenTelemetry Collector -> OpenObserve”；API 与 worker MUST 通过 OTLP/HTTP 发送到 Collector，MUST NOT 直接调用 OpenObserve ingestion API。

#### Scenario: 渲染生产遥测拓扑
- **WHEN** 运维使用安全占位配置渲染生产 Compose
- **THEN** API 与 worker OTLP endpoint MUST 指向 Collector service DNS
- **AND** Collector exporter MUST 使用部署环境提供的 OpenObserve OTLP endpoint
- **AND** Collector MUST 发送 Basic authorization header 与 `stream-name: default`
- **AND** Hono 应用 MUST NOT 持有 OpenObserve ingestion URL 或凭据

### Requirement: Collector 必须限制在 Compose 内部网络

Collector Compose 服务 SHALL 仅加入 `cnode-internal`，其 OTLP receiver MUST NOT 发布任何宿主端口。

#### Scenario: 检查 Collector 网络和端口
- **WHEN** 维护者只读渲染 Compose 配置
- **THEN** Collector MUST 连接 `cnode-internal`
- **AND** Collector MUST NOT 声明 `ports`
- **AND** OpenObserve MUST 通过 `openobserve` service DNS 访问

### Requirement: Collector traces pipeline 必须有界并可重试

Collector SHALL 为 traces pipeline 配置 `memory_limiter`、敏感属性删除和 `batch` processors，并为 OpenObserve exporter 配置有界 queue、发送超时和 retry，使临时后端故障不会向应用请求传播背压。

#### Scenario: OpenObserve 临时不可用
- **WHEN** Collector 无法连接 OpenObserve
- **THEN** exporter MUST 按配置进行有界重试
- **AND** queue 或内存达到限制时 MUST 丢弃 telemetry 而不是阻断 API/worker 请求

#### Scenario: Collector 处理 spans
- **WHEN** Collector 接收应用 traces
- **THEN** `memory_limiter` MUST 在 `batch` 前执行
- **AND** 敏感属性删除 MUST 在 exporter 前执行
- **AND** batch MUST 合并发送而不是要求每个 span 单独同步写入 OpenObserve

### Requirement: OpenObserve ingestion 凭据必须最小权限隔离

Collector SHALL 使用专用 Basic ingestion token 写入 OpenObserve。Compose SHALL 保持现有单一 dotenv 运维方式；API、worker 和 Web 的 telemetry 配置与应用代码 MUST NOT 引用、读取或使用 `ZO_ROOT_USER_PASSWORD` 或专用 ingestion secret。

#### Scenario: 配置 Collector 认证
- **WHEN** 运维为 Collector 提供 OpenObserve OTLP endpoint 与认证 token
- **THEN** 受版本控制的配置 MUST 只引用环境变量占位符
- **AND** 真实 endpoint 与 ingestion token MUST 仅存在于忽略或外部 dotenv/secret 管理边界
- **AND** 部署输出 MUST NOT 打印凭据值

#### Scenario: 检查应用 telemetry 配置
- **WHEN** 维护者检查 API、worker 和 Web 的配置引用与应用代码
- **THEN** 这些应用 MUST NOT 使用 `ZO_ROOT_USER_PASSWORD`
- **AND** 这些应用 MUST NOT 使用 OpenObserve ingestion password 或直接调用 OpenObserve

### Requirement: Collector 必须执行纵深敏感属性删除

Collector SHALL 在 export 前删除 cookie、Authorization、session/token、body、邮件或用户内容、数据库凭据、连接串、SQL statement 和 SQL parameters 对应的已知 attributes，作为应用侧清理后的第二道防线。

#### Scenario: Collector 收到含禁止属性的测试 span
- **WHEN** 测试 fixture 向 Collector pipeline 提供禁止属性
- **THEN** exporter 输出 MUST 不包含该属性和值
- **AND** 允许的低基数 resource 与 span 属性 MUST 保留

### Requirement: 部署配置必须依赖既有 OpenObserve Compose 前提

本 capability SHALL 依赖 `simplify-compose-operations` 提供的 OpenObserve service 基线，并由部署环境提供实际 OTLP endpoint，MUST NOT 修改该 change 或替换其 OpenObserve 镜像选择。

#### Scenario: 前置 OpenObserve 基线不存在
- **WHEN** 部署环境尚未满足 `simplify-compose-operations` 的 OpenObserve Compose 要求
- **THEN** 运维 MUST 先完成或确认该前置 change
- **AND** MUST NOT 通过记录私有替代地址绕过该前提

#### Scenario: OpenObserve 使用 latest
- **WHEN** 部署前检查 OpenObserve 与 Collector 兼容性
- **THEN** 运维 MUST 记录实际 OpenObserve image ID 或 digest 并验证 OTLP ingestion 兼容性
- **AND** 本 change MUST NOT 把 `latest` 改为其他 tag 或 digest

### Requirement: 验证不得隐式启动 Docker Compose

普通 repository verification SHALL 通过单元/集成测试、静态 Collector 配置检查和 Compose 只读 render 验证本能力，`pnpm verify` MUST NOT 启动 Docker Compose。

#### Scenario: 运行普通 pnpm verify
- **WHEN** CI 或开发者运行 `pnpm verify`
- **THEN** 命令 MUST NOT 执行 `docker compose up`、创建容器或连接真实 OpenObserve
- **AND** 测试 MUST NOT 需要真实 ingestion credentials

#### Scenario: 执行部署 preflight
- **WHEN** 运维在部署阶段验证 Compose
- **THEN** preflight MAY 使用安全占位值执行只读 `docker compose config`
- **AND** preflight MUST NOT 打印真实 dotenv 值或启动服务

### Requirement: 部署与架构说明必须同步

实施 SHALL 更新 `docs/arch/` 的 tracing 架构权威说明、`docs/deployment/` 的 Collector 运维说明和适用 dotenv examples，并仅使用安全占位值。

#### Scenario: 审查文档同步
- **WHEN** 维护者完成实现
- **THEN** 架构说明 MUST 覆盖 bootstrap、采样、资源属性和敏感数据边界
- **AND** 部署说明 MUST 覆盖专用 ingestion 身份、只读 preflight、故障降级、回滚和 OpenObserve `latest` 兼容风险
- **AND** 文档 MUST NOT 包含真实 secret、用户数据、生产地址或仓库外私有拓扑

### Requirement: 遥测部署不得改变 PostgreSQL 数据面

Collector、SDK 和 instrumentation 的实施 SHALL NOT 修改 PostgreSQL schema、数据、Drizzle migration、seed/bootstrap 或字段语义。

#### Scenario: 执行 Database Change Audit
- **WHEN** 维护者审查本 change 的实现 diff
- **THEN** `packages/db/src/schema/`、Drizzle migration 和 seed 文件 MUST 无本 change 引入的修改
- **AND** 遥测验证 MUST NOT 写入、迁移、清理或修复真实 PostgreSQL 数据
