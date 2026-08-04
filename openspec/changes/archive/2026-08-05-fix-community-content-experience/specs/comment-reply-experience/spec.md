## MODIFIED Requirements

### Requirement: 线性评论流

评论 SHALL 按 `create_at` 升序渲染为稳定的线性流，并以稳定唯一标识作为同一时间戳下的次级升序条件；评论 SHALL NOT 渲染嵌套评论树。楼层编号 MUST 由该稳定顺序生成。

#### Scenario: 回复评论仍保持线性

- **WHEN** 用户回复评论 `#2`
- **THEN** 新评论按时间顺序出现在同一列表中
- **AND** 它不会作为评论 `#2` 的嵌套子项出现。

#### Scenario: 迁移回复与新回复顺序稳定

- **WHEN** 同一话题同时包含迁移的历史回复和 PostgreSQL 新增回复
- **THEN** API 按 `create_at` 升序返回所有未删除回复
- **AND** 相同 `create_at` 的回复按稳定唯一标识升序返回
- **AND** 多次请求生成相同楼层顺序。
