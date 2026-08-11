## Context

生产 OpenObserve 使用单节点、本地持久卷和 `latest` 镜像。当前部署未显式设置数据保留期，因此继承上游 `ZO_COMPACT_DATA_RETENTION_DAYS=3650`。应用现已持续导出 traces、logs 和 metrics，需要在 OpenObserve 进程边界设置统一、可审计的磁盘保留上限。

## Goals / Non-Goals

**Goals:**

- 将生产 OpenObserve 的全局默认数据保留期固定为 30 天。
- 让 Compose、dotenv example、部署说明和自动化测试表达同一配置。
- 通过重建 OpenObserve 使配置生效，并验证容器健康。

**Non-Goals:**

- 不配置 stream-level retention 或不同信号的独立期限。
- 不同步删除数据卷文件，不承诺配置生效后立即释放磁盘。
- 不修改应用 telemetry exporter 或 Collector pipeline。

## Decisions

### 使用 OpenObserve 全局 compactor retention 变量

在 OpenObserve service environment 中传入 `ZO_COMPACT_DATA_RETENTION_DAYS`，Compose 默认值为 `30`，并在生产 dotenv example 中显式声明 `30`。官方将该变量定义为全局数据保留天数，最小值为 3，适用于 compactor 自动清理。

备选方案是在 UI 中逐 stream 配置 retention。该方案容易遗漏新建 stream，且生产状态无法由仓库配置审计，因此不采用。

### 允许 dotenv 覆盖但默认保持 30 天

Compose 使用 `${ZO_COMPACT_DATA_RETENTION_DAYS:-30}`，使标准部署无需额外配置即可获得 30 天边界，同时保留紧急容量调整能力。部署说明要求任何覆盖都经过明确运维评估。

备选方案是直接写死 `30`。该方案无法在不改 Compose 文件的情况下处理临时容量策略，因此不采用。

### 依赖 compactor 异步清理

配置仅通过 OpenObserve 支持的 retention 机制生效，不直接操作 `openobserve-data`。超过 30 天的数据由 compactor 后台删除，磁盘释放存在延迟。

备选方案是运行文件级删除命令。该方案可能破坏 OpenObserve metadata 与数据文件一致性，因此禁止。

## Risks / Trade-offs

- [超过 30 天的数据不可恢复] → 部署说明明确这是观测数据策略，并在缩短期限前确认无需长期审计数据。
- [compactor 清理不是即时发生] → 验证配置注入和容器健康，不以立即减少卷大小作为发布成功条件。
- [`latest` 行为变化] → 保留既有镜像漂移审计和恢复点要求。
- [stream-level retention 覆盖全局值] → 本 change 只定义全局默认；后续若引入 stream override，必须另行规范并审计。

## Migration Plan

1. 更新仓库 Compose、dotenv example、部署说明和配置测试。
2. 在生产 dotenv 中设置 `ZO_COMPACT_DATA_RETENTION_DAYS=30`。
3. 执行只读 `docker compose config` 预检，不输出环境值。
4. 重建 OpenObserve service 并等待 healthcheck 通过。
5. 回滚时恢复上一 retention 配置并重建服务；已经被 compactor 删除的数据不能通过配置回滚恢复。

## Database Change Audit

- PostgreSQL schema、Drizzle migration、seed、索引、约束和业务数据均不变。
- 本 change 的 data retention 仅作用于 OpenObserve 的观测数据卷，不得运行 PostgreSQL migration 或数据清理命令。

## Open Questions

无。
