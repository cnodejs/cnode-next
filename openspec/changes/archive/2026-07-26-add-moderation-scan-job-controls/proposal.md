## Why

当前巡检任务依赖 worker 周期轮询，管理员创建任务后可能要等到下一轮才执行；任务误建或堆积时也缺少取消入口，导致队列不可控。需要为管理员提供“立即执行”和“取消”能力，让内容治理操作可预期、可中止。

## What Changes

- 在巡检任务后台增加“立即执行”操作，管理员点击后应唤醒或触发 worker 尽快处理指定 pending/running/paused 任务，而不是等待 1 小时轮询。
- 在巡检任务后台增加“取消”操作，允许管理员取消尚未完成的 pending/running/paused 任务。
- 扩展任务状态流转，增加 `cancelled` 终态；取消 running 任务时 worker 必须在当前批次后停止，不再继续扫描。
- 任务列表和 API 返回取消状态、取消时间、取消人或审计记录，方便追踪。
- 验证立即执行不会并发重复处理同一个任务，取消任务不会继续产生新命中。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `moderation-scan-jobs`: 增加巡检任务立即执行、取消和 `cancelled` 状态流转要求。
- `content-moderation`: 增加管理员对巡检任务队列的执行控制要求，确保巡检命中队列可运营。

## Impact

- 影响 API：`apps/api/src/routes/admin.ts` 中巡检任务管理接口。
- 影响 worker：`apps/api/src/worker/moderation-scan.ts` 和 `apps/api/src/lib/moderation-scan.ts` 的任务 claim、取消检测、锁和唤醒逻辑。
- 影响 Web：`apps/web/app/routes/admin/mod.tsx` 或巡检任务列表组件，新增立即执行和取消按钮。
- 影响验证：扩展 `scripts/verify-moderation-scan-runtime.ts` 或新增脚本覆盖 immediate run、cancel pending、cancel running。

## Non-goals

- 不新增复杂任务优先级队列；立即执行只要求尽快触发指定任务或触发 worker drain。
- 不删除已存在的命中记录；取消只阻止后续扫描继续产生命中。
- 不改变敏感词匹配规则或命中处理规则。
