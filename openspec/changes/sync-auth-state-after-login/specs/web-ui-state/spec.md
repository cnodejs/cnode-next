## MODIFIED Requirements

### Requirement: useAuthStore 管理 user 与 unreadCount

`auth-store.ts` SHALL 暴露 `user: User | null`、`unreadCount: number`、`setUser(user)`、`clear()`、`fetchUnread()`、`hydrateFromLoader(user)`。store 在客户端初始化时 SHALL 从 React Router root loader 注入的 `loaderData.user` 通过 `hydrateFromLoader` 读初始值，之后 SHALL 在 root loader 返回不同认证用户时通过同一注入点同步。组件 SHALL 只从 store 读 user，MUST NOT 同时从 `useRouteLoaderData("root")` 读 ssrUser 做兜底。`hydrateFromLoader` SHALL 是 loader user 数据的唯一注入点。

#### Scenario: Layout 不再每次导航拉 auth

- **WHEN** 用户在站内导航（首页 → 话题详情 → 设置）且认证状态未变化
- **THEN** `Layout` 组件从 `useAuthStore` 读 user，不自行重复拉 `/auth/me`

#### Scenario: HeaderUserArea 单一数据源

- **WHEN** `HeaderUserArea` 渲染
- **THEN** 仅从 `useAuthStore` 读 user
- **AND** 不调用 `useRouteLoaderData("root")` 获取 ssrUser
- **AND** 不存在 `effectiveUser = user || ssrUser` 模式

#### Scenario: 登录后同步 store

- **WHEN** store 已用匿名 loader 数据完成首次水合，登录成功后 root loader 返回当前用户
- **THEN** `hydrateFromLoader` SHALL 用当前用户替换匿名状态
- **AND** Header SHALL 无需整页刷新即可显示已登录用户

#### Scenario: 登出清空 store

- **WHEN** 用户点退出登录
- **THEN** 调 `useAuthStore.getState().clear()`，且 `navigate("/")`

### Requirement: Mutation 后用 revalidate 替换 reload

所有 mutation（创建、编辑、删除、封禁、标记已读、重置密码和登录）成功后 MUST 调用 React Router v7 的 `useRevalidator().revalidate()` 重跑相关路由 loader，或调 store action 更新全局态，或二者结合。认证 mutation 在 Session Cookie 改变后 MUST 重新验证 root loader。MUST NOT 使用 `window.location.reload()`。

#### Scenario: 回复成功后局部刷新

- **WHEN** 用户在话题详情页提交回复成功
- **THEN** 调 `revalidate()` 重跑 `topic.$tid` loader，新回复出现在列表，滚动位置不丢，不触发整页 reload

#### Scenario: 封禁用户后局部刷新

- **WHEN** 管理员在 admin/users 点禁言并成功
- **THEN** 调 `revalidate()` 重跑 admin/users loader，用户状态列更新为“禁言”

#### Scenario: 登录成功后刷新认证数据

- **WHEN** 本地登录或 Web 内完成的 GitHub 登录 mutation 成功写入 Session Cookie
- **THEN** 客户端重新验证 root loader 并取得当前用户
- **AND** 导航首页后 Header 不显示过期的匿名状态
