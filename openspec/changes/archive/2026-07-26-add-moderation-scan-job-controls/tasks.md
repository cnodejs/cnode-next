## 1. 任务状态与后端能力

- [x] 1.1 扩展巡检任务状态类型，支持 `cancelled` 终态，并确认列表、claim 和统计查询不会遗漏该状态。
- [x] 1.2 设计取消元信息存储方式，优先支持 `cancelled_at` 和 `cancelled_by`，若不新增字段则确保 audit log 足够追踪。
- [x] 1.3 更新 `claimNextScanJob()`，确保 cancelled/done/failed 任务不会被 worker claim。
- [x] 1.4 更新 `processScanBatch()` 或 worker loop，使 running 任务被取消后在当前 batch 结束后停止，且不会覆盖 cancelled 状态。

## 2. Admin API

- [x] 2.1 新增 `POST /api/v1/admin/moderation/jobs/:id/run` 或等价立即执行接口，仅 admin 可调用并写审计日志。
- [x] 2.2 新增 `POST /api/v1/admin/moderation/jobs/:id/cancel` 或等价取消接口，仅 admin 可调用并写审计日志。
- [x] 2.3 立即执行 pending/paused 任务时触发 worker 尽快 drain，HTTP 请求不得等待全库扫描完成。
- [x] 2.4 立即执行 running 任务时不得创建重复扫描实例，必须返回当前运行状态或幂等成功。
- [x] 2.5 取消 done/failed/cancelled 任务时返回失败或幂等响应，且不改变终态。

## 3. Worker 唤醒与取消检测

- [x] 3.1 实现 worker 唤醒机制或缩短可中断等待，确保立即执行不依赖 1 小时固定 sleep。
- [x] 3.2 保持 Redis worker lock 语义，避免多个 worker 同时处理同一任务。
- [x] 3.3 在每批扫描前后检查任务状态，取消后停止继续扫描并不再新增该任务命中。
- [x] 3.4 确保 pending 队列仍会被 drain，不因为单个 cancelled 任务阻塞后续任务。

## 4. Web 管理界面

- [x] 4.1 在巡检任务列表展示 `cancelled` 状态。
- [x] 4.2 为 pending/paused 任务显示“立即执行”入口，为 pending/paused/running 任务显示“取消”入口。
- [x] 4.3 对取消操作使用应用内 Dialog 确认，不使用 `window.confirm()`。
- [x] 4.4 操作成功后 toast 反馈并刷新任务列表，失败时显示后端错误。

## 5. 验证与部署

- [x] 5.1 扩展 `scripts/verify-moderation-scan-runtime.ts` 或新增脚本，覆盖立即执行 pending、立即执行 running 幂等、取消 pending、取消 running。
- [x] 5.2 增加验证：cancelled 任务不会被 claim，取消 running 后不再新增命中。
- [x] 5.3 运行 `pnpm typecheck` 并确认通过。
- [x] 5.4 部署 API/Web/Worker 后确认 worker 使用最新镜像。
- [x] 5.5 生产 smoke：创建测试巡检任务后可立即执行，可取消未完成任务，任务列表状态刷新正确。
