## Why

生产 API 镜像未携带 `apps/api/tsconfig.json`，却通过 `tsx` 直接执行包含 JSX 的邮件模板源码，导致账号激活和密码找回在模板渲染时抛出 `React is not defined`。注册在异常前已写入未激活用户，而系统没有重发激活邮件入口，使用户进入“注册失败但账号已占用且无法登录”的不可恢复状态。

## What Changes

- 保证最终 API 镜像按 `react-jsx` 语义执行邮件模板，并在镜像边界验证四类邮件可以脱离 SMTP 完成渲染。
- 为未激活本地账号提供可限流、不可枚举账号的激活邮件重发能力，并在注册、登录页面提供明确恢复入口。
- 明确注册已落库但邮件构建或发送失败时的响应和恢复语义，避免把账号创建结果展示为普通注册失败。
- 统一本地登录、GitHub 关联和后续 Session 对 `active` 状态的处理，防止未激活账号通过第三方关联绕过激活要求。
- 增加关键邮件渲染、发送失败、重发、并发注册和未激活 GitHub 关联的 API 与生产镜像回归验证。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `auth`: 增加未激活账号的激活邮件重发与失败恢复要求，并统一本地登录和 GitHub 关联的账号激活语义。
- `container-image-delivery`: 要求最终 API 镜像包含执行 TSX/JSX 源码所需的编译配置或改为执行已编译产物，并验证邮件模板运行时。
- `production-ops`: 将关键账号邮件的模板渲染失败纳入生产邮件失败语义、可观测性和恢复验收。

## Impact

- **In scope**: `apps/api/src/routes/auth.ts`、邮件模板与发送边界、认证中间件、`apps/api/Dockerfile`、认证 API 契约和测试；`apps/web/app/routes/signup.tsx`、`signin.tsx` 及未激活账号恢复交互；最终 API 镜像 smoke。
- **Affected systems**: PostgreSQL 用户激活状态和 retrieve key、SMTP 投递、GitHub 账号关联、Session、API 镜像发布、Web 认证表单。
- **High-risk categories**: 账号认证、账号枚举防护、邮件投递、已有未激活用户恢复、容器运行时。
- **Applicable Skills**: 实现阶段 Web 认证表单使用 `cnode-web-design`；认证、容器和 OpenAPI 变更按项目验证与文档治理执行。

## Non-goals

- 不引入消息队列、通用邮件 outbox 或更换 SMTP 服务商。
- 不改变品牌邮件视觉、正文和现有社区通知偏好。
- 不自动激活、删除或合并历史未激活账号，也不执行数据修复。
- 不修改 bcrypt、retrieve key 存储模型或 GitHub OAuth 提供方。

## Documentation Impact

- 认证 API 路由变化后重新生成 `apps/web/public/openapi.json`。
- 若最终镜像启动策略或 smoke 命令变化，更新 `docs/deployment/` 中对应生产验证说明；不新增 README 或索引文档。
- 预计无需修改 `docs/arch/`、`docs/biz/`、根治理文件或 app README；若实现引入新的持久化投递架构，再单独评估架构文档。
