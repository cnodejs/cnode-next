## Why

OpenObserve 当前依赖上游 3650 天默认保留期，应用 logs、metrics 和 traces 持续写入后会长期占用生产磁盘。生产单节点观测服务需要明确的 30 天全局保留边界，以限制存储增长并保持运维行为可预测。

## What Changes

- 为 OpenObserve Compose service 配置 `ZO_COMPACT_DATA_RETENTION_DAYS=30`。
- 在生产 dotenv example 中记录同一安全默认值，并在部署说明中说明该值适用于 logs、metrics 和 traces，旧数据由 compactor 异步清理。
- 增加部署配置测试，防止保留期退回 OpenObserve 上游默认值。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `openobserve-compose-service`: OpenObserve 生产服务必须将全局数据保留期显式限制为 30 天。

## Impact

- 受影响文件：`docs/deployment/docker-compose.yml`、`docs/deployment/env.production.example`、`docs/deployment/deployment.md` 和 telemetry deployment 配置测试。
- 受影响系统：生产 OpenObserve compactor 及其本地持久化数据卷。
- 高风险类别：数据保留与自动删除；配置生效后，超过 30 天的观测数据将进入异步清理流程。
- 不涉及应用 API、PostgreSQL schema、业务数据或 Web UI。

## Scope

- 范围内：OpenObserve 全局观测数据保留期、Compose/env 示例、部署说明和配置验证。
- 范围外：按 stream 设置不同保留期、历史数据导出、OpenObserve 版本固定、容量告警和对象存储迁移。

## Non-goals

- 不为 logs、metrics、traces 设置不同的 retention policy。
- 不立即强制删除历史数据，也不修改 OpenObserve 数据卷内容。

## Documentation Impact

- 更新 `docs/deployment/deployment.md` 和部署示例，作为生产保留策略的权威说明。
- `docs/arch/`、`docs/biz/`、根治理文件、app README 和生成的 Web API reference 不受影响。
- 适用 Skill：`cnode-docs`，确保部署说明仅包含安全、可复用的配置值。
