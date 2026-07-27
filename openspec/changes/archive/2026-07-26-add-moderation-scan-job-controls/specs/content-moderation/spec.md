## ADDED Requirements

### Requirement: 管理员可控制巡检队列执行

巡检命中队列依赖扫描任务生成，系统 SHALL 提供管理员可操作的任务执行控制，避免任务因轮询间隔或误创建而长期堆积。

#### Scenario: 管理员立即推进巡检队列
- **WHEN** 管理员发现巡检任务处于 pending 或 paused
- **THEN** 管理员 MUST 能触发立即执行
- **AND** 系统 MUST 尽快开始或恢复扫描

#### Scenario: 管理员取消误创建任务
- **WHEN** 管理员发现巡检任务范围或触发原因错误
- **THEN** 管理员 MUST 能取消未完成任务
- **AND** 取消任务 MUST 不再继续产生命中记录
