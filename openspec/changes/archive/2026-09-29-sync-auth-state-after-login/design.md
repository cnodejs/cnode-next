## Context

`root.loader` 在 SSR 和客户端 revalidation 时通过 `/api/v1/auth/me` 取得当前用户，`App` 再调用 `hydrateFromLoader` 将其注入 `useAuthStore`。当前 store 在第一次注入后永久忽略后续 loader 值，而 `/signin` 和 `/auth/github/new` 登录成功后仅调用 `navigate("/")`；因此 Session Cookie 已写入，但 Header 使用的 store 仍保持匿名状态。

```mermaid
flowchart LR
  A[登录 mutation 成功] --> B[重新验证 root loader]
  B --> C[/auth/me 返回当前用户]
  C --> D[App 监听 loader user]
  D --> E[hydrateFromLoader 同步 useAuthStore]
  E --> F[HeaderUserArea 显示用户菜单]
  B --> G[导航至首页]
```

## Goals / Non-Goals

**Goals:**

- 本地登录和 Web 内完成的 GitHub 登录成功后，无需整页刷新即可更新 Header。
- 保持 root loader 为服务端认证结果来源，保持 `useAuthStore` 为组件读取认证状态的单一来源。
- 保留 account route archetype、共享 `Layout`、响应式结构和无障碍行为。

**Non-Goals:**

- 不修改 API、Cookie、OAuth callback 或权限计算。
- 不引入新 store、Provider 或视觉组件。
- 不改变登录失败和未激活账号流程。

## Decisions

### 登录成功后显式 revalidate

本地登录和 `/auth/github/new` 成功后调用 React Router `revalidate()`，随后导航首页。这样认证状态仍由 `/auth/me` 确认，而不是根据登录响应推测。

备选方案：使用 `window.location.href`。该方案能工作，但会丢失 SPA 导航优势，并违背现有 mutation 优先使用 revalidation 的状态契约，因此不采用。

备选方案：让登录 API 返回完整用户并直接 `setUser`。该方案增加 API contract 变更，并形成登录响应与 `/auth/me` 两套用户投影，因此不采用。

### loader 结果可持续同步到 store

`hydrateFromLoader` 不再把 `hydrated` 解释为永久锁；每当 root loader 的 `user` 变化时，它都同步 `user` 和 `hydrated`。未读消息只在首次得到用户或用户身份发生变化时拉取，避免无关 revalidation 重复请求。

备选方案：Header 同时读取 loader data 作为 store 的兜底。该方案产生双数据源，并违反现有 `HeaderUserArea` 单一数据源要求，因此不采用。

### 测试覆盖状态边界

回归测试覆盖匿名初始水合后再次注入已登录用户，以及成功登录触发 revalidation。现有 Header 静态渲染测试继续验证展示结构；不新增仅为测试服务的生产抽象。

## Risks / Trade-offs

- [revalidation 与导航同时发生可能产生竞态] → 等待 revalidation 完成后再导航，并用集成测试验证结果。
- [后续 loader revalidation 覆盖客户端临时状态] → auth 用户以服务端 Session 为权威来源；覆盖是预期行为。
- [重复拉取未读数] → 仅在首次认证或用户身份变化时调用 `fetchUnread`。

## Migration Plan

直接发布 Web 代码，无数据迁移和配置变更。若发生回归，可回滚 Web 变更；Session Cookie 与 API 不受影响。

## Open Questions

无。
