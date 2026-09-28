## ADDED Requirements

### Requirement: Web 消息目标链接触发单条已读

`/my/messages` MUST 在用户打开未读通知的关联话题链接时启动该消息的单条标记已读请求，同时 MUST 不阻塞目标链接导航。作者资料链接和已经标记为已读的通知链接 MUST 保持纯导航行为。

#### Scenario: 打开未读消息关联话题

- **WHEN** 用户点击“新消息”分组中一条未读消息的关联话题链接
- **THEN** Web 启动该消息的 `POST /api/v1/message/mark_one/:msg_id` 请求
- **AND** React Router 继续导航到该消息关联的话题和回复锚点

#### Scenario: 查看未读消息作者资料

- **WHEN** 用户点击未读消息的作者头像或用户名链接
- **THEN** React Router 导航到作者资料页
- **AND** Web 不因该点击调用单条标记已读 API

#### Scenario: 打开已读消息关联话题

- **WHEN** 用户点击“过往消息”分组中一条已读消息的关联话题链接
- **THEN** React Router 继续导航到关联话题和回复锚点
- **AND** Web 不重复调用单条标记已读 API
