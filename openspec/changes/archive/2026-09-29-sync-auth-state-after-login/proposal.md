## Why

用户通过本地账号或 GitHub 账号登录成功并返回首页后，Header 仍保留首次加载时的匿名状态，只有刷新页面才显示已登录用户。Session Cookie 和服务端认证已经生效，但客户端未在登录 mutation 后重新同步 root loader 与全局 auth store。

## What Changes

- 登录成功后重新验证 React Router root loader，使客户端立即取得当前用户。
- 允许 root loader 后续返回的认证结果同步到 `useAuthStore`，而不是只接受首次水合值。
- 本地登录和需要在 Web 页面完成的 GitHub 登录使用相同的认证状态同步行为。
- 增加回归测试，验证无需刷新页面即可从匿名 Header 切换为已登录 Header。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `web-ui-state`: 明确认证 mutation 后 root loader 与 `useAuthStore` 的持续同步要求。

## Impact

### Scope

- 范围内：`apps/web/app/root.tsx`、`apps/web/app/lib/stores/auth-store.ts`、本地登录与 GitHub 登录完成页面及相应 Web 测试。
- 范围外：API 登录响应、Session Cookie 格式和属性、GitHub OAuth callback、数据库、路由布局及视觉设计。
- 受影响系统：React Router loader revalidation、Zustand auth 状态和公共 Header 用户区域。
- 高风险类别：认证状态一致性；不涉及权限模型、凭据存储或安全边界变更。

受影响路由属于 account archetype，并通过共享 `Layout`/`HeaderUserArea` 展示结果。响应式布局、键盘行为、ARIA 和 shadcn/Base UI primitives 均不改变；适用 Skill 为 `cnode-web-design`，仅需验证现有 Header 在各断点继续使用同一状态树。

## Non-goals

- 不改变登录、登出或 OAuth 的服务端协议。
- 不引入新的客户端认证请求缓存或状态库。
- 不重构全部 auth store 调用方。
- 不以整页刷新替代 SPA 状态同步。

## Documentation Impact

本次修复不改变长期架构、业务规则、部署配置、治理规则、app README 或生成的 Web API reference，因此无需修改 `docs/arch`、`docs/biz`、`docs/deployment`、根治理文件、app README 或 OpenAPI 输出。
