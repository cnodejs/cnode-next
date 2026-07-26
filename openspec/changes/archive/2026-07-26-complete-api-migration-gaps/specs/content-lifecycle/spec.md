## ADDED Requirements

### Requirement: 已有话题编辑必须持久化

作者和管理员 SHALL 能通过 Web 编辑页使用的 legacy-compatible API 编辑已有话题。

#### Scenario: 作者编辑话题

- **WHEN** 话题作者向 `POST /api/v1/topics/update` 提交合法 title、tab、content
- **THEN** API 更新已有话题记录
- **AND** 下一次请求话题详情时返回编辑后的值

#### Scenario: 未授权话题编辑被拒绝

- **WHEN** 非作者且非管理员用户尝试编辑话题
- **THEN** API 返回权限错误
- **AND** 原话题记录保持不变

### Requirement: 已有回复编辑必须持久化

作者和管理员 SHALL 能通过与现有 Web 回复编辑页匹配的 API 路由编辑已有回复。

#### Scenario: 回复编辑页加载回复

- **WHEN** 登录用户打开 `/reply/:id/edit`
- **THEN** `GET /api/v1/reply/:id` 返回表单所需的回复内容和关联话题标识数据
- **AND** 缺失或未授权的回复返回错误，而不是伪造空成功响应

#### Scenario: 作者编辑回复

- **WHEN** 回复作者向 `POST /api/v1/reply/:id/edit` 提交合法内容
- **THEN** API 更新回复内容和更新时间
- **AND** 下一次请求话题详情时返回编辑后的回复
