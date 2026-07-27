## ADDED Requirements

### Requirement: 搜索接口必须与页面声明和前端 DTO 对齐
搜索 API SHALL 返回前端列表组件可消费的稳定 DTO，并且查询范围必须与搜索页文案一致。

#### Scenario: 搜索标题和内容
- **WHEN** 搜索页声明可搜索话题标题和内容
- **THEN** `/api/v1/search?engine=local&q=<keyword>` MUST 查询公开可见话题的标题和内容
- **AND** 已删除、内部 tab 或 block 作者内容 MUST 不出现在搜索结果中

#### Scenario: 搜索返回 TopicDTO 兼容字段
- **WHEN** 前端调用 local search API
- **THEN** 返回的每条结果 MUST 包含 `id`、`title`、`tab`、`reply_count`、`visit_count`、`last_reply_at` 和 `author`
- **AND** `author` MUST 包含 `loginname` 和 `avatar_url`
- **AND** 前端不得依赖数据库 raw column 名称渲染搜索结果

#### Scenario: 不支持内容搜索时文案必须降级
- **WHEN** 系统暂不支持内容搜索
- **THEN** 搜索页文案 MUST 明确只搜索标题
- **AND** spec 不得声明内容搜索已完成
