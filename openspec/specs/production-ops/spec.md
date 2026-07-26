# production-ops Specification

## Purpose

定义 cnode-next 作为 nodeclub 线上行为完全替代品之前必须通过的 URL、API、写入副作用和生产 smoke 验收矩阵。

## Requirements

### Requirement: nodeclub 线上替代验收矩阵

系统 SHALL 在切换线上流量前通过 nodeclub online replacement 验收矩阵，证明公开 URL、API 契约、业务副作用和生产周边行为均可替代旧站。

#### Scenario: URL parity smoke

- **WHEN** 运行 URL parity smoke
- **THEN** smoke 覆盖 `nodeclub/web_router.js` 中所有公开 GET 路由
- **AND** 每个 URL 标记为等价页面、兼容 redirect 或显式废弃
- **AND** 不存在未分类 legacy URL

#### Scenario: API contract smoke

- **WHEN** 运行 API contract smoke
- **THEN** smoke 覆盖 `nodeclub/api_router_v1.js` 中所有 API 路由
- **AND** 校验成功响应 shape、失败响应 shape、认证方式和关键字段

#### Scenario: authenticated write smoke

- **WHEN** 运行认证写入 smoke
- **THEN** smoke 验证发帖、编辑话题、回帖、编辑回复、删除回复、收藏、取消收藏、点赞、取消点赞、消息已读、token 刷新
- **AND** 每个写入操作必须验证 PostgreSQL 中的真实状态变化
- **AND** smoke 必须能恢复或清理临时写入数据

#### Scenario: side effect audit

- **WHEN** 运行业务副作用审计
- **THEN** 审计验证 score、topic_count、reply_count、collect_topic_count、reply_count、message count 与操作结果一致
- **AND** 验证 Redis 限流 key 和 headers 可观测
- **AND** 验证邮件发送路径可在测试 SMTP 或 stub transporter 下观测
