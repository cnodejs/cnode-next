## ADDED Requirements

### Requirement: 巡检任务立即执行

系统 MUST 允许 admin 对未完成的巡检任务执行立即执行操作，使任务不必等待 worker 的下一次固定轮询。

#### Scenario: 立即执行 pending 任务
- **WHEN** admin 对 pending 巡检任务点击立即执行
- **THEN** 系统 MUST 触发 worker 尽快 claim 该任务
- **AND** HTTP 请求 MUST 在触发成功后返回，不等待扫描完成
- **AND** 后端 MUST 写入审计日志

#### Scenario: 立即执行 paused 任务
- **WHEN** admin 对 paused 巡检任务点击立即执行
- **THEN** 系统 MUST 将任务恢复为可执行状态
- **AND** worker MUST 从最后成功游标继续扫描

#### Scenario: 立即执行 running 任务
- **WHEN** admin 对 running 巡检任务点击立即执行
- **THEN** 系统 MUST 不创建重复扫描实例
- **AND** 若 worker 已在处理该任务，系统 MUST 返回成功或当前运行状态

### Requirement: 巡检任务取消

系统 MUST 允许 admin 取消 pending、paused 或 running 巡检任务。取消后的任务 MUST 进入 `cancelled` 终态，并且不得继续被 worker claim 或继续扫描。

#### Scenario: 取消 pending 任务
- **WHEN** admin 取消 pending 巡检任务
- **THEN** 任务状态 MUST 变为 `cancelled`
- **AND** worker MUST 不再 claim 该任务
- **AND** 后端 MUST 写入审计日志

#### Scenario: 取消 running 任务
- **WHEN** admin 取消 running 巡检任务
- **THEN** worker MUST 在当前 batch 结束后停止继续扫描
- **AND** 任务状态 MUST 保持 `cancelled`
- **AND** 取消后 MUST 不再新增该任务的扫描命中

#### Scenario: 取消已完成任务
- **WHEN** admin 尝试取消 done、failed 或 cancelled 任务
- **THEN** 系统 MUST 返回失败或幂等响应
- **AND** 不得改变任务终态和扫描结果

### Requirement: 巡检任务列表展示控制状态

系统 SHALL 在后台任务列表展示立即执行和取消所需状态，并防止普通用户调用任务控制接口。

#### Scenario: 任务列表展示操作按钮
- **WHEN** admin 查看巡检任务列表
- **THEN** pending、paused 和 running 任务 MUST 展示取消入口
- **AND** pending 或 paused 任务 MUST 展示立即执行入口
- **AND** done、failed、cancelled 任务 MUST NOT 展示会改变状态的执行入口

#### Scenario: 非管理员不可控制任务
- **WHEN** 非 admin 用户调用立即执行或取消接口
- **THEN** 系统 MUST 返回权限错误
- **AND** 目标任务状态保持不变
