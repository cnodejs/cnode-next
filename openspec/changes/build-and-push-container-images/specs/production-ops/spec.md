## MODIFIED Requirements

### Requirement: nodeclub 线上替代验收矩阵

系统 SHALL 在切换线上流量前通过 nodeclub online replacement 验收矩阵，证明公开 URL、API 契约、业务副作用、生产周边行为和容器运行方式均可替代旧站。由于 legacy `nodeclub/`、MongoDB、Redis 和 cnode-next 服务同机运行，生产验收 MUST 确认 cnode-next 部署不会在服务器上执行镜像构建。

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

#### Scenario: production image source audit

- **WHEN** 运维执行生产部署验收
- **THEN** `api`、`web` 和 `worker` MUST 运行来自 `ghcr.io/cnodejs/*:latest` 的镜像
- **AND** `docker-compose.prod.yml` MUST NOT 为生产服务定义 `build:`
- **AND** 部署命令 MUST 使用 `docker compose pull` 和 `docker compose up -d --no-build`

#### Scenario: runtime API configuration audit

- **WHEN** 运维验证 Web 容器生产配置
- **THEN** SSR API 请求 MUST 使用 `.env` 或 compose environment 提供的 `APP_API_INTERNAL_BASE_URL`
- **AND** 浏览器侧 API 请求 MUST 使用 `.env` 提供的 `APP_API_BASE_URL`
- **AND** Web 镜像 MUST NOT 因 API 域名变化而重新构建
