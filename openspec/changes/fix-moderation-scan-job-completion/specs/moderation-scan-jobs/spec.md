## MODIFIED Requirements

### Requirement: 巡检扫描任务

系统 MUST 使用持久化任务记录执行历史和定时内容巡检，任务状态、进度游标、扫描范围和资源限制必须可查询和恢复。任务被 worker 领取后 MUST 执行到 `done`、`failed` 或管理员暂停，不能因为达到单轮批次数限制永久停留在 `running`。

#### Scenario: 创建历史扫描任务
- **WHEN** 管理员新增敏感词或手动发起历史扫描
- **THEN** 系统 MUST 创建巡检扫描任务
- **AND** 任务 MUST 记录扫描范围、触发原因、敏感词范围、批大小、限速配置和初始游标
- **AND** HTTP 请求 MUST 在任务创建后返回，不等待全库扫描完成

#### Scenario: 任务状态流转
- **WHEN** worker 开始处理扫描任务
- **THEN** 任务状态 MUST 从 `pending` 变为 `running`
- **AND** worker MUST 在每批完成后更新游标、已扫描数量和命中数量
- **AND** 任务完成后 MUST 标记为 `done`
- **AND** 任务失败时 MUST 标记为 `failed` 并保存错误信息
- **AND** worker 达到单轮批次数限制时 MUST 继续处理到完成，或将未完成任务恢复为后续 worker 可领取的状态

#### Scenario: 暂停和恢复任务
- **WHEN** 管理员暂停正在执行的扫描任务
- **THEN** worker MUST 在当前批次结束后停止继续扫描
- **AND** 任务 MUST 保留最后成功游标
- **WHEN** 管理员恢复该任务
- **THEN** worker MUST 从最后成功游标继续扫描

#### Scenario: 恢复悬挂任务
- **WHEN** worker 重启或上一 worker 崩溃后存在未完成的 `running` 巡检任务
- **THEN** 后续 worker MUST 能从最后成功游标继续执行该任务
- **AND** 同一时间 MUST 只有一个 worker 继续执行该任务

### Requirement: 低资源批量扫描

系统 MUST 按固定大小批次扫描话题和回复，避免单次数据库查询加载大量数据。批次限制和批间休眠 MUST 控制每批资源占用，但不能破坏巡检任务最终完成或可恢复的语义。

#### Scenario: 按游标扫描话题
- **WHEN** worker 扫描话题内容
- **THEN** 增量任务每批 MUST 使用主键游标读取 `id > cursor` 的话题
- **AND** 历史任务每批 MUST 从最新话题开始按 `id` 倒序扫描
- **AND** 每批 MUST 只读取扫描所需字段
- **AND** 每批处理完成后 MUST 立即写入命中结果并更新任务游标

#### Scenario: 按游标扫描回复
- **WHEN** worker 扫描回复内容
- **THEN** 增量任务每批 MUST 使用主键游标读取 `id > cursor` 的回复
- **AND** 历史任务每批 MUST 从最新回复开始按 `id` 倒序扫描
- **AND** 每批 MUST 排除已删除回复
- **AND** 每批处理完成后 MUST 立即写入命中结果并更新任务游标

#### Scenario: 扫描限速
- **WHEN** worker 完成一个扫描批次
- **THEN** worker MUST 按任务配置或环境变量休眠指定时间
- **AND** worker MUST 控制单批处理规模，避免一次性占用大量 CPU 和数据库连接

#### Scenario: 超过单轮批次数的数据集
- **WHEN** 巡检任务的数据量超过 `maxBatchesPerRun * batchSize`
- **THEN** 系统 MUST 保留已完成批次的游标和计数
- **AND** 任务 MUST 继续执行到 `done` 或保持后续 worker 可继续领取和执行
- **AND** 任务 MUST NOT 永久停留在没有 worker 会继续处理的 `running` 状态
