## 1. MVP：修复生产邮件运行时

- [x] 1.1 调整 `apps/api/Dockerfile`，让最终源码运行镜像携带 `apps/api/tsconfig.json` 及其基础配置，并确认 `tsx` 使用 `react-jsx` runtime
- [x] 1.2 增加最终 API 镜像内的无网络邮件模板 smoke，覆盖账号激活、密码重置、回复和 @ 提及四类模板
- [x] 1.3 增加模板渲染失败与 SMTP 发送失败的阶段化安全日志，确保不记录邮箱、正文、密码、retrieve key 或 SMTP 凭据
- [x] 1.4 运行 API 邮件模板测试、typecheck、build 和最终镜像 smoke，验证不再出现 `React is not defined`

## 2. MVP：注册部分成功与安全恢复 API

- [x] 2.1 扩展共享认证 schema 和错误 envelope，定义 `account_created_email_failed`、`account_inactive` 及重发请求/响应契约
- [x] 2.2 将注册用户创建与激活 key 初始化收敛为一致的 PostgreSQL 写入边界，并将唯一约束竞争转换为稳定业务响应
- [x] 2.3 在注册邮件构建或发送失败时保留未激活账号和 key，返回 `503` 与 `account_created_email_failed`，且不暴露内部异常
- [x] 2.4 实现 `POST /api/v1/auth/local/resend_activation`，验证用户名或邮箱、bcrypt 密码、`active=false` 和 Turnstile 后原子轮换 key 并发送邮件
- [x] 2.5 为重发接口增加按来源和按账号的限流及通用未知账号/密码错误/已激活响应，日志不包含账号标识或激活凭据
- [x] 2.6 增加注册成功、邮件失败部分成功、并发唯一约束、重发成功、旧 key 失效、无效凭据、已激活账号、发送失败和限流测试

## 3. 功能完整：统一账号激活认证语义

- [x] 3.1 让本地登录返回机器可读的 `account_inactive`，且未激活账号不创建 Session
- [x] 3.2 在 GitHub 关联老账号写入前拒绝未激活用户，清理本次 OAuth 凭据且不建立绑定或 Session
- [x] 3.3 在 GitHub callback 命中已绑定未激活用户时拒绝登录并跳转到稳定恢复状态，不刷新或持久化 GitHub token
- [x] 3.4 在 cookie Session 和 API access token 认证边界拒绝 `active=false` 用户，并覆盖历史 Session/token 场景
- [x] 3.5 增加本地登录、GitHub 关联、GitHub 已绑定登录、cookie Session 和 access token 的未激活账号回归测试

## 4. 功能完整：Web 恢复体验

- [x] 4.1 使用 account route archetype 和现有共享组件创建重发激活邮件页面，包含账号、密码、Turnstile、pending、成功和失败状态
- [x] 4.2 在注册的 `account_created_email_failed` 状态与登录的 `account_inactive` 状态提供明确恢复说明和重发入口
- [x] 4.3 增加 Web 表单和认证状态测试，覆盖可访问标签、键盘提交、disabled/`aria-busy`、`role=status`、错误反馈和输入保留
- [x] 4.4 在 375px、768px、1280px、1440px 的浅色和深色主题验证布局、焦点、长错误文本和无非预期横向滚动，并运行设计系统治理测试

## 5. 契约、文档与发布验证

- [x] 5.1 从认证路由 zod-openapi 声明重新生成 `apps/web/public/openapi.json`，验证重发接口和结构化错误响应
- [x] 5.2 按 `cnode-docs` 检查 `docs/deployment/` 的最终镜像 smoke 说明；仅在现有权威部署文档需要同步时更新，并检查无过时路径或不安全示例值
- [x] 5.3 复核本变更无 PostgreSQL schema、migration、seed、索引、自动 backfill 或数据清理，并确认历史未激活账号仅按请求恢复
- [x] 5.4 运行相关 API/Web 测试、lint、typecheck、build、OpenSpec strict validate、secret scan，并核对设计图、规格与实现状态可归档
