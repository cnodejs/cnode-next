## Why

巡检扫描任务在 worker 重启后从 `pending` 进入 `running`，但达到 `maxBatchesPerRun` 后仍停留在 `running`，后续 tick 只领取 `pending` 任务，导致该任务不会继续执行也不会完成。这个问题会让管理员手动创建的内容巡检队列看似在执行，实际永久悬挂，无法替代 legacy `nodeclub` 中管理员触发后可完成的内容治理流程。

## What Changes

- 修正巡检扫描任务的完成性语义：worker 领取任务后 MUST 持续处理到 `done`、`failed` 或被管理员暂停。
- 修正 `maxBatchesPerRun` 的含义，资源限制不能把任务永久留在不可领取的 `running` 状态。
- 明确 `running` 任务在 worker 崩溃、重启或达到一轮处理边界后必须可恢复。
- 增加验证覆盖，确保大于单轮批次数上限的数据集不会让任务卡在 `running`。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `moderation-scan-jobs`: 明确巡检扫描任务必须执行到完成或可恢复，不能因每轮批次数上限永久停留在 `running`。

## Impact

- 影响 `apps/api/src/worker/moderation-scan.ts` 的任务处理循环和 tick 行为。
- 影响 `apps/api/src/lib/moderation-scan.ts` 的任务状态恢复或释放逻辑。
- 影响 `scripts/verify-moderation-scan-runtime.ts` 或新增等价验证脚本。
- 影响生产环境 `worker` 服务的运行语义，但不改变 HTTP 管理 API 路由和数据库表结构。

## Non-goals

- 不重写敏感词匹配算法，不改变命中去重规则。
- 不迁移或兼容 legacy `nodeclub` 的旧数据库巡检任务数据；当前问题只发生在 cnode-next 的 PostgreSQL 巡检任务队列。
- 不引入新的队列系统、消息中间件或后台任务框架。
- 不调整 GitHub Actions、容器构建或部署流程。
