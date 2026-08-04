## 1. 数据模型与基础能力

- [x] 1.1 在 `packages/db` 增加 `moderation_scan_jobs` schema，包含状态、扫描范围、触发原因、敏感词范围、游标、批大小、限速、统计、错误和时间字段
- [x] 1.2 在 `packages/db` 增加 `moderation_hits` schema，包含目标类型、目标 ID、所属话题、作者、命中词、上下文预览、状态、处理人、处理时间和扫描任务 ID
- [x] 1.3 为巡检任务和命中队列添加 PostgreSQL 索引，覆盖待处理列表、任务领取、目标去重和按时间查询
- [x] 1.4 扩展 `apps/api/src/lib/moderation.ts`，提供加载敏感词、匹配内容、生成上下文预览、命中去重键等纯逻辑
- [x] 1.5 为敏感词匹配和上下文预览添加单元测试，覆盖大小写不敏感、多个命中词、topic/reply 字段命中
- [x] 1.6 在数据库 seed 中加入默认敏感词，覆盖科学上网/VPN/机场/翻墙分类

## 2. 扫描任务与 Worker MVP

- [x] 2.1 新增巡检任务 repository/service，支持创建任务、领取任务、更新游标、记录失败、暂停、恢复和完成
- [x] 2.2 实现 topic 批量扫描，使用 `id > cursor ORDER BY id LIMIT batch_size` 读取必要字段
- [x] 2.3 实现 reply 批量扫描，使用 `id > cursor ORDER BY id LIMIT batch_size` 读取必要字段并排除已删除回复
- [x] 2.4 实现命中写入和去重，确保同一目标同一敏感词不会反复生成待处理记录
- [x] 2.5 新增 worker 入口脚本，按任务状态循环处理批次，并支持 `MODERATION_SCAN_BATCH_SIZE`、`MODERATION_SCAN_THROTTLE_MS`、`MODERATION_SCAN_MAX_BATCHES_PER_RUN`
- [x] 2.6 为 worker 增加单实例锁，避免多 worker 重复执行同一任务
- [x] 2.7 在 `deployment/docker-compose.yml` 增加可独立启动的 worker service，不影响 api/web 服务

## 3. 管理 API

- [x] 3.1 扩展敏感词新增接口，新增敏感词成功后创建针对新增词的历史扫描任务
- [x] 3.2 新增扫描任务列表 API，返回任务状态、范围、进度、命中数、错误和时间字段
- [x] 3.3 新增手动创建扫描任务 API，支持选择 topics、replies 或 all，以及全量或增量扫描
- [x] 3.4 新增暂停和恢复扫描任务 API，并写入审计日志
- [x] 3.5 将 `/api/v1/admin/moderation` 改为读取待处理 `moderation_hits`，同时支持 topic 和 reply 命中
- [x] 3.6 实现巡检命中处理 API：确认删除、标记误报、忽略/恢复，并复用现有 topic/reply 删除逻辑
- [x] 3.7 确保所有巡检处理动作写入审计日志，包含命中 ID、目标类型、目标 ID 和所属话题 ID

## 4. 管理后台 UI

- [x] 4.1 更新 `/admin/moderation` 页面，展示命中类型、目标、作者、命中词、上下文预览、扫描时间和处理按钮
- [x] 4.2 支持从巡检命中跳转到原始话题或回复所在话题
- [x] 4.3 增加扫描任务状态展示，包括 pending/running/paused/done/failed、进度和错误信息
- [x] 4.4 增加手动创建扫描任务入口，支持选择扫描范围
- [x] 4.5 增加暂停和恢复扫描任务操作，并显示操作结果
- [x] 4.6 更新管理概览页的巡检命中待处理数，改为来自 `moderation_hits.status = pending`

## 5. 定时增量扫描

- [x] 5.1 设计并实现定时调度逻辑，按配置周期创建或执行增量扫描任务
- [x] 5.2 记录定时扫描的上次完成时间或增量游标，避免每次全量扫描
- [x] 5.3 当同类定时扫描任务未完成时，避免创建重复任务
- [x] 5.4 添加环境变量文档，说明如何关闭定时扫描、调整批大小和限速

## 6. 验证与运行手册

- [x] 6.1 添加脚本或测试验证：创建敏感词后生成历史扫描任务
- [x] 6.2 添加脚本或测试验证：扫描任务分批处理 topics/replies，并生成命中记录
- [x] 6.3 添加脚本或测试验证：暂停后恢复任务从游标继续扫描
- [x] 6.4 添加脚本或测试验证：管理员确认删除 topic/reply 命中后内容状态正确且审计日志存在
- [x] 6.5 添加脚本或测试验证：定时增量扫描不会重复创建未完成任务
- [x] 6.6 更新部署文档，说明 worker service、资源限速配置和生产排障方式
- [x] 6.7 运行 `openspec validate add-low-impact-moderation-scans --strict`
