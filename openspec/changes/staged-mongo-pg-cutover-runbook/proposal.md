## Why

当前迁移讨论已明确采用"Mongo 作为唯一真相源 + 并行期新站仅内测 + 切换日停写后全量重跑"策略，但仓库内还缺少一份可执行、可验收、可复盘的标准化变更文档。若没有统一的迁移与部署契约，切换当天容易出现指令顺序错误、对账遗漏或停机窗口超时，直接影响下线旧站的成功率。

## What Changes

- 新增一套分阶段迁移能力：预同步、并行验证、停机全量重跑、切流下线。
- 新增 docker-compose 场景下的数据库初始化与建表执行规范（在 compose 网络内执行）。
- 新增"本地连接远程现网主机"演练模式：在正式切换前从本地跑通完整迁移与功能测试流程。
- 新增迁移验收闸门：数据对账、功能烟测、窗口耗时记录。
- 明确切换日策略：旧站停写后执行最终全量迁移，不设计回滚流程。
- 将上述流程固化为 OpenSpec 规格和任务，指导后续实现 `scripts/migrate-mongo-to-pg.ts` 与运维手册。

## Non-goals

- 不在本变更中实现双向实时同步或冲突合并。
- 不在本变更中修改应用业务逻辑（仅定义迁移与上线流程）。
- 不在本变更中替代 legacy 代码行为；`nodeclub/` 与 `egg-cnode/` 仍作为业务对照参考。
- 不在本变更中要求将线上 Mongo/Redis 直接暴露到公网。

## Capabilities

### New Capabilities
- `staged-mongo-pg-cutover`: 定义双阶段迁移与停机切换的行为契约和验收门槛。
- `compose-migration-operations`: 定义 docker-compose 环境中的建表、迁移执行、验证与切流操作规范。
- `local-remote-migration-rehearsal`: 定义本地连接远程主机进行迁移彩排和功能验证的安全边界与流程。

### Modified Capabilities
- 无。

## Impact

- OpenSpec: 新增两份 capability 规格与一份执行任务清单。
- 代码实现将受本提案约束：`scripts/migrate-mongo-to-pg.ts`、部署编排文件、迁移验证脚本。
- 运维流程将从"口头步骤"升级为"可审计清单"，减少切换日操作不确定性。
- 演练流程将支持"开发机发起 + 远程现网资源参与"，提前暴露网络、权限和性能问题。
