# moderation-scan-jobs Specification

## Purpose
TBD - created by syncing change add-low-impact-moderation-scans. Update Purpose after archive.
## Requirements
### Requirement: 巡检扫描任务

系统 MUST 使用持久化任务记录执行历史和定时内容巡检，任务状态、进度游标、扫描范围和资源限制必须可查询和恢复。

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

#### Scenario: 暂停和恢复任务
- **WHEN** 管理员暂停正在执行的扫描任务
- **THEN** worker MUST 在当前批次结束后停止继续扫描
- **AND** 任务 MUST 保留最后成功游标
- **WHEN** 管理员恢复该任务
- **THEN** worker MUST 从最后成功游标继续扫描

### Requirement: 低资源批量扫描

系统 MUST 按固定大小批次扫描话题和回复，避免单次任务加载大量数据或长时间占用数据库连接。

#### Scenario: 按游标扫描话题
- **WHEN** worker 扫描话题内容
- **THEN** 每批 MUST 使用主键游标读取 `id > cursor` 的话题
- **AND** 每批 MUST 只读取扫描所需字段
- **AND** 每批处理完成后 MUST 立即写入命中结果并更新任务游标

#### Scenario: 按游标扫描回复
- **WHEN** worker 扫描回复内容
- **THEN** 每批 MUST 使用主键游标读取 `id > cursor` 的回复
- **AND** 每批 MUST 排除已删除回复
- **AND** 每批处理完成后 MUST 立即写入命中结果并更新任务游标

#### Scenario: 扫描限速
- **WHEN** worker 完成一个扫描批次
- **THEN** worker MUST 按任务配置或环境变量休眠指定时间
- **AND** worker MUST 限制每轮处理批次数，避免长期占用 CPU 和数据库连接

### Requirement: 定时增量扫描

系统 MUST 支持定时创建增量巡检任务，用于检查最近新增或更新的已发布内容。

#### Scenario: 定时任务触发
- **WHEN** 到达配置的巡检周期
- **THEN** worker MUST 创建或执行增量扫描任务
- **AND** 任务 MUST 只扫描上次完成后新增或更新的内容
- **AND** 若已有同类扫描任务未完成，系统 MUST 避免创建重复任务

#### Scenario: 单实例执行
- **WHEN** 多个 worker 进程同时运行
- **THEN** 同一时间 MUST 只有一个 worker 执行同一个扫描任务
- **AND** 锁失效或 worker 崩溃后，任务 MUST 能被后续 worker 接管
