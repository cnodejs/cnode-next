## ADDED Requirements

### Requirement: OpenObserve 观测数据必须默认保留 30 天

生产 Compose SHALL 将 OpenObserve 的全局数据保留期显式配置为 30 天，使 logs、metrics 和 traces 中超过该期限的数据由 OpenObserve compactor 异步清理。部署 MUST NOT 通过直接删除 `openobserve-data` 文件实现 retention。

#### Scenario: 渲染默认生产配置

- **WHEN** 运维使用安全占位环境渲染 `docs/deployment/docker-compose.yml`
- **THEN** `openobserve` service MUST 获得 `ZO_COMPACT_DATA_RETENTION_DAYS=30`
- **AND** `docs/deployment/env.production.example` MUST 声明同一 30 天值

#### Scenario: 30 天前数据进入清理流程

- **WHEN** OpenObserve compactor 在 retention 配置生效后处理超过 30 天的观测数据
- **THEN** 这些数据 MUST 由 OpenObserve 支持的 retention 机制异步清理
- **AND** 部署流程 MUST NOT 假定重建容器后磁盘空间立即释放

#### Scenario: 回滚 retention 配置

- **WHEN** 运维恢复先前的 retention 值并重建 OpenObserve
- **THEN** 新配置 MUST 只影响后续 compactor 行为
- **AND** 运维 MUST NOT 声称配置回滚能够恢复已经删除的数据
