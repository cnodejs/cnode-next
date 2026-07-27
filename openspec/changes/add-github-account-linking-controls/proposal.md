## Why

当前 `/setting` 只以两行文本展示 GitHub 绑定状态，已绑定账号没有安全解绑入口，且再次以 `intent=bind` 发起 OAuth 可能覆盖原绑定；数据库也没有约束 `github_id` 唯一。legacy `nodeclub/controllers/github.js` 仅实现 GitHub 登录，同样没有覆盖账号关联的完整生命周期，因此 cnode-next 需要明确绑定、防换绑和解绑契约。

## What Changes

- 已登录用户绑定 GitHub 时，校验目标 GitHub 身份未被其他用户占用；重复绑定同一身份按幂等成功处理，绑定不同身份时拒绝覆盖。
- 增加安全解绑接口：要求当前登录态和当前 CNode 密码，先撤销已保存的 GitHub OAuth token，再清空 GitHub 身份与 token 字段；无法提供当前密码的用户须先使用现有密码重置流程。
- 在数据库层为 nullable `users.github_id` 增加唯一约束，防止并发请求把同一 GitHub 身份绑定到多个用户。
- 统一设置页“账号身份”UI：邮箱与 GitHub 使用一致的身份列表行，展示图标、账号值、状态 Badge 和右侧操作；已绑定和未绑定状态在桌面与移动端保持一致层级。
- 对绑定、拒绝覆盖和解绑行为增加测试与不泄露 token 的日志约束。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `auth`: 补充 GitHub 绑定幂等、防覆盖、身份唯一、安全解绑、OAuth token 撤销及密码确认要求。
- `web-ui-forms`: 补充设置页账号身份统一展示和解绑确认表单要求。

## Non-goals

- 不实现 TOTP、短信或其他 2FA。
- 不提供一步式 GitHub 换绑；用户必须先安全解绑，再重新绑定。
- 不修改本地账号密码 hash、legacy bcrypt 兼容和现有 Session 生命周期。
- 不恢复 legacy `nodeclub/controllers/github.js` 以外不存在的解绑兼容行为。
- 不在解绑时删除用户头像、邮箱、内容、积分或当前登录 Session。

## Impact

- Web：`apps/web/app/routes/setting.tsx` 及 OAuth 错误反馈与共享表单 schema。
- API：`apps/api/src/routes/auth.ts`、GitHub OAuth client 调用、用户查询和审计日志。
- 数据库：`packages/db/src/schema/user.ts` 及 PostgreSQL migration；上线前校验现有 `github_id` 无重复值。
- 测试与验证：覆盖绑定状态机、密码确认、远端 token 撤销失败、数据库并发唯一性、响应与日志不泄露 `github_access_token`。
