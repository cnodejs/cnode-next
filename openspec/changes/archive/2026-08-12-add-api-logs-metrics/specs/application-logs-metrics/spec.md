## ADDED Requirements

### Requirement: API 必须为每个 HTTP 请求记录一条结构化 access log

API SHALL 为包括 `/health` 在内的每个完成的 HTTP 请求生成且仅生成一条结构化 completion access log。记录 MUST 包含稳定事件名、HTTP method、匹配的路由模板、response status、请求耗时和服务端生成的 Request ID，并在有效 active span context 存在时包含 trace ID、span ID 与 sampled 状态。

#### Scenario: 成功请求完成

- **WHEN** API 完成一个匹配 Hono 路由的成功请求
- **THEN** 系统 MUST 记录一条 `http.request.completed` access log
- **AND** `http.route` MUST 使用路由模板而不是实际路径或原始 URL
- **AND** 记录 MUST 包含 method、status、duration 和服务端 Request ID

#### Scenario: 请求以错误状态完成

- **WHEN** API 请求返回 4xx 或 5xx response
- **THEN** 系统 MUST 仍只记录一条 completion access log
- **AND** access log MUST 使用结构化 status 字段而不是把 response body 写入日志

#### Scenario: 请求 trace 未被采样

- **WHEN** 请求存在有效 trace context 但 sampler 不导出该 trace
- **THEN** access log MUST 明确记录 sampled 状态
- **AND** 系统 MUST NOT 声称该 trace ID 在后端必然可检索

### Requirement: 应用运行日志必须结构化且具有稳定事件语义

API 与 moderation worker SHALL 通过共同的应用日志接口记录启动、关闭、telemetry 降级和未处理错误；worker SHALL 为每个 moderation scan tick 记录一条 completion 结果日志。生产运行路径 MUST NOT 依赖自由格式 `console.*` 作为结构化日志来源，且日志在 OTLP logs 禁用或不可用时 MUST 继续写入 stdout 供本地运维读取。

#### Scenario: 应用启动和关闭

- **WHEN** API 或 worker 成功启动或收到正常关闭信号
- **THEN** 系统 MUST 写入带稳定 event name、severity 和 `service.name` 的结构化生命周期日志
- **AND** 日志 MUST NOT 包含环境变量值或 OTLP endpoint

#### Scenario: API 发生未处理请求错误

- **WHEN** Hono route 或 middleware 抛出错误
- **THEN** 系统 MUST 写入结构化错误日志并关联 Request ID 和可用 trace context
- **AND** 错误字段 MUST 限于经过 allowlist 的 `error.type`

#### Scenario: worker 完成一次 tick

- **WHEN** moderation worker 完成、跳过或失败一次 scan tick
- **THEN** worker MUST 写入一条 tick completion 日志
- **AND** 记录 MUST 使用有限 outcome 枚举和 duration
- **AND** 记录 MUST NOT 包含 job ID、lock owner、敏感词或扫描内容

### Requirement: API 指标必须全量聚合且保持低基数

API SHALL 独立于 trace sampling 记录 HTTP 请求量、请求耗时、并发请求和错误指标。Metric attributes MUST 仅使用有限的 HTTP method、路由模板、response status 或 status class 以及 allowlist error type，MUST NOT 使用 Request ID、trace ID、实际 URL、用户或业务实体标识。

#### Scenario: 请求 trace 未被采样

- **WHEN** sampler 不记录一个完成的 API 请求
- **THEN** 该请求 MUST 仍计入 HTTP request count 和 duration 聚合
- **AND** 指标值 MUST NOT 从已导出的 spans 推导

#### Scenario: 动态路由收到多个请求

- **WHEN** 多个不同 topic ID 的请求匹配同一路由模板
- **THEN** HTTP metrics MUST 聚合到相同 `http.route` attribute value
- **AND** 指标 MUST NOT 包含实际 topic ID 或 Request ID

#### Scenario: 请求执行期间

- **WHEN** API 开始处理请求并最终结束或抛出错误
- **THEN** active request 指标 MUST 在开始时增加并在 finally 路径减少
- **AND** 发生错误后该指标 MUST NOT 永久保持增加状态

### Requirement: Worker 必须提供有限且低基数的运行指标

Moderation worker SHALL 记录 scan tick 数量、耗时、有限 outcome、锁获取结果和失败数量。仅当 drain 操作能直接返回可靠处理结果时，系统 SHALL 记录 processed jobs 数量；系统 MUST NOT 为生成指标额外查询 PostgreSQL 或 Redis。

#### Scenario: worker 未获得执行锁

- **WHEN** moderation scan tick 未获得 worker lock
- **THEN** tick count MUST 增加并记录有限的 lock-unavailable outcome
- **AND** 指标 MUST NOT 包含 lock owner 或 lock key value

#### Scenario: worker tick 失败

- **WHEN** scan tick 抛出错误
- **THEN** failure count 和 tick duration MUST 被记录
- **AND** attributes MUST NOT 包含异常 message、stack、job ID 或内容标识

#### Scenario: 无可靠 processed jobs 结果

- **WHEN** queue drain 不返回已处理 job 数量
- **THEN** telemetry MUST NOT 通过额外数据查询推断该数量
- **AND** tick count、duration 和 outcome MUST 仍可记录

### Requirement: API 与 worker 必须导出 Node.js runtime 指标

API 与 moderation worker SHALL 导出 CPU、内存、event loop 和 GC 的 Node.js runtime 指标，并通过各自稳定的 `service.name` 区分运行角色。Runtime metrics MUST NOT 增加逐请求或逐业务实体 attributes。

#### Scenario: 两个运行角色导出 runtime metrics

- **WHEN** API 与 worker 同时运行并导出 runtime metrics
- **THEN** API metric resource MUST 使用 `service.name=cnode-api`
- **AND** worker metric resource MUST 使用 `service.name=cnode-moderation-worker`
- **AND** 系统 MUST NOT 通过重复的逐数据点 role attribute 区分服务

### Requirement: 应用日志必须执行敏感信息 allowlist

应用 SHALL 在日志创建时仅接受明确定义的字段，并在 export 前再次清理禁止属性。日志 MUST NOT 包含 Authorization、cookie、session/token/password、IP、User-Agent、用户身份、邮件地址或主题、用户内容、请求/响应 body、原始 URL query、SQL、数据库凭据、原始 exception message 或 stack。

#### Scenario: 邮件发送失败

- **WHEN** API 记录邮件发送失败
- **THEN** 日志 MAY 记录稳定事件名、attempt、outcome 和 allowlist error type
- **AND** 日志 MUST NOT 包含收件地址、邮件主题、正文、SMTP 凭据或原始错误详情

#### Scenario: 请求携带认证与用户内容

- **WHEN** API 为包含 cookie、Authorization、query 或正文的请求生成 access/error log
- **THEN** 导出的日志 MUST NOT 包含这些值
- **AND** 允许的 route template、method、status、duration、Request ID 和 trace correlation 字段 MUST 保留

### Requirement: 三种 telemetry 信号必须独立启停与降级

应用 SHALL 允许 traces、logs 和 metrics 在共同总开关下独立启停。任一信号配置无效、初始化失败、export 超时或后端不可用 MUST NOT 禁用其他已正确配置的信号，也 MUST NOT 阻止 API/worker 启动或改变业务结果。

#### Scenario: metrics 初始化失败

- **WHEN** metrics SDK 或 exporter 初始化失败而 traces 与 logs 配置有效
- **THEN** metrics MUST 降级为 no-op
- **AND** traces、stdout logs 与业务入口 MUST 继续运行

#### Scenario: logs OTLP 导出被禁用

- **WHEN** logs signal 被独立禁用
- **THEN** 应用 MUST 停止创建或导出 OTLP log records
- **AND** 结构化运行日志和 access log MUST 继续写入 stdout

#### Scenario: 应用关闭

- **WHEN** API 或 worker 收到关闭信号
- **THEN** 所有已启用信号 MUST 尝试有界 flush/shutdown
- **AND** 单个信号超时或失败 MUST NOT 导致进程无限等待
