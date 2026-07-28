# production-ops Specification

## Purpose

定义 cnode-next 作为 nodeclub 线上行为完全替代品之前必须通过的 URL、API、写入副作用、生产 smoke、不可变镜像和 D 级发布准入验收矩阵。

## Requirements
### Requirement: nodeclub 线上替代验收矩阵

系统 SHALL 在切换线上流量前通过 nodeclub online replacement 验收矩阵，证明公开 URL、API 契约、业务副作用、生产周边行为和容器运行方式均可替代旧站。由于 legacy `../nodeclub/`、MongoDB、Redis 和 cnode-next 服务同机运行，生产验收 MUST 确认 cnode-next 部署不会在服务器上执行镜像构建，并且生产运行的 API、Web 和 worker 必须来自已通过 release verification gate 的不可变镜像发布物。

#### Scenario: URL parity smoke

- **WHEN** 运行 URL parity smoke
- **THEN** smoke 覆盖 `../nodeclub/web_router.js` 中所有公开 GET 路由
- **AND** 每个 URL 标记为等价页面、兼容 redirect 或显式废弃
- **AND** 不存在未分类 legacy URL

#### Scenario: API contract smoke

- **WHEN** 运行 API contract smoke
- **THEN** smoke 覆盖 `../nodeclub/api_router_v1.js` 中所有 API 路由
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
- **THEN** `api`、`web` 和 `worker` MUST 运行来自 `ghcr.io/cnodejs/*` 的 SHA tag 或 digest 镜像
- **AND** `docker-compose.prod.yml` MUST NOT 为生产服务定义 `build:`
- **AND** 部署命令 MUST 使用 `docker compose pull` 和 `docker compose up -d --no-build`
- **AND** 部署记录 MUST 能从运行镜像反查 Git commit

#### Scenario: runtime API configuration audit

- **WHEN** 运维验证 Web 容器生产配置
- **THEN** SSR API 请求 MUST 使用 `.env` 或 compose environment 提供的 `APP_API_INTERNAL_BASE_URL`
- **AND** 浏览器侧 API 请求 MUST 使用 `.env` 提供的 `APP_API_BASE_URL`
- **AND** Web 镜像 MUST NOT 因 API 域名变化而重新构建

### Requirement: D 级发布准入必须全绿
生产部署 SHALL 只允许使用通过 release verification gate 的镜像发布物。

#### Scenario: release gate 失败
- **WHEN** lint、typecheck、test、build、OpenSpec strict validate 或 secret scan 任一项失败
- **THEN** CI MUST NOT 发布生产镜像
- **AND** 运维 MUST NOT 将该 commit 部署到生产

#### Scenario: release gate 成功
- **WHEN** release verification gate 全部通过
- **THEN** CI MAY 发布 API 和 Web 生产镜像
- **AND** 发布记录 MUST 绑定 Git commit、image tag 或 digest

### Requirement: 生产邮件路径不得假成功
生产环境中的账号激活、密码找回、回复通知和 @ 通知邮件 SHALL 在 SMTP 缺失或发送失败时可观测，并且关键账号邮件不得返回误导性的成功响应。

#### Scenario: 生产缺少 SMTP 配置
- **WHEN** 非 development 环境缺少 `SMTP_HOST`
- **THEN** 账号激活和密码找回邮件发送 MUST 返回失败或阻止对应请求成功
- **AND** 系统 MUST 记录可观测错误日志
- **AND** 用户不得看到“邮件已发送”的假成功提示

#### Scenario: SMTP 发送失败
- **WHEN** SMTP 已配置但发送账号激活或密码找回邮件最终失败
- **THEN** API MUST 返回失败响应
- **AND** 用户资料和 retrieve key 状态 MUST 保持可重试或明确可恢复

#### Scenario: development 允许跳过邮件
- **WHEN** `APP_ENV=development` 且未配置 SMTP
- **THEN** 系统 MAY 跳过真实发送
- **AND** 必须在日志中明确标记邮件被跳过

### Requirement: Turnstile 生产配置必须完整
生产环境 SHALL 配置 Cloudflare Turnstile 所需的站点 key 和 secret key，并确保 secret 不暴露到浏览器。

#### Scenario: Turnstile site key 注入前端
- **WHEN** Web 渲染注册、找回密码或高风险写入表单
- **THEN** 页面 MUST 能读取公开的 Turnstile site key
- **AND** site key MAY 暴露给浏览器

#### Scenario: Turnstile secret 仅服务端使用
- **WHEN** API 校验 Turnstile token
- **THEN** API MUST 使用服务端环境变量中的 Turnstile secret 调用 siteverify
- **AND** secret MUST NOT 注入到 Web HTML、前端 bundle 或公开配置

#### Scenario: 缺少 Turnstile 配置时生产拒绝启动或拒绝风险请求
- **WHEN** 非 development 环境缺少 Turnstile 必需配置
- **THEN** 系统 MUST 拒绝依赖 Turnstile 的请求或在启动/健康检查中明确失败
- **AND** 不得绕过人机验证继续接受高风险请求
