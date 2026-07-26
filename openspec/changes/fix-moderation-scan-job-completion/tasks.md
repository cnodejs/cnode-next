## 1. 状态机修复

- [x] 1.1 调整 `apps/api/src/worker/moderation-scan.ts` 的 `processJob()`，确保 worker 领取手动巡检任务后持续处理到 `done`、`failed` 或管理员暂停。
- [x] 1.2 明确 `maxBatchesPerRun` 的处理语义：若保留单轮切片，达到上限但未完成时必须将任务恢复为后续 worker 可领取的状态。
- [x] 1.3 确保暂停任务时 worker 在当前批次结束后停止继续扫描，并保留最后成功游标。
- [x] 1.4 调整历史巡检游标方向，使话题和回复都从最新内容开始扫描。

## 2. 悬挂任务恢复

- [x] 2.1 调整任务领取逻辑，使 worker 在持有 Redis lock 后能恢复未完成的 `running` 任务，避免 worker 崩溃或重启后任务永久悬挂。
- [x] 2.2 确保同一时间只有一个 worker 处理同一个巡检任务，保留现有 Redis lock 的单实例执行约束。
- [x] 2.3 确保已有生产环境中停留在 `running` 且未完成的任务能在发布后继续从游标执行。

## 3. 验证覆盖

- [x] 3.1 扩展 `scripts/verify-moderation-scan-runtime.ts` 或新增验证脚本，覆盖数据量超过 `maxBatchesPerRun * batchSize` 的任务不会卡在 `running`。
- [x] 3.2 增加恢复 `running` 悬挂任务的验证，确认 worker 能从最后游标继续执行。
- [x] 3.3 增加历史话题和历史回复最新优先扫描的验证。
- [x] 3.4 运行 `pnpm verify:moderation-scan:runtime` 并确认通过。
- [x] 3.5 运行 `pnpm typecheck` 并确认通过。

## 4. 生产检查

- [x] 4.1 发布修复后重启远程 `worker` 服务。
- [x] 4.2 在远程 PostgreSQL 查询 `moderation_scan_jobs`，确认当前任务从 `running` 继续推进并最终进入 `done` 或 `failed`。
- [x] 4.3 查询 `moderation_hits`，确认命中记录按扫描结果产生且无重复错误。
