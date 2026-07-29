## MODIFIED Requirements

### Requirement: zustand 作为全局状态库

`apps/web/app/lib/stores/` SHALL 包含两个 zustand store：`auth-store.ts`、`theme-store.ts`。`ui-store.ts` SHALL 被删除。store MUST 是无 Provider 的全局单例，直接 `import { useXStore } from "~/lib/stores/x-store"` 使用。

#### Scenario: 跨路由共享 auth 状态

- **WHEN** 用户在话题详情页登录后导航到设置页
- **THEN** 设置页直接从 `useAuthStore` 读 user，不重新拉 `/api/v1/auth/me`

#### Scenario: stores/index.ts 不再导出 ui-store

- **WHEN** 检查 `apps/web/app/lib/stores/index.ts`
- **THEN** 仅导出 `useAuthStore` 和 `useThemeStore`
- **AND** `ui-store.ts` 文件不存在

### Requirement: useAuthStore 管理 user 与 unreadCount

`auth-store.ts` SHALL 暴露 `user: User | null`、`unreadCount: number`、`setUser(user)`、`clear()`、`fetchUnread()`、`hydrateFromLoader(user)`。store 在客户端初始化时 SHALL 从 React Router root loader 注入的 `loaderData.user` 通过 `hydrateFromLoader` 读初始值，之后跨路由共享。组件 SHALL 只从 store 读 user，MUST NOT 同时从 `useRouteLoaderData("root")` 读 ssrUser 做兜底。`hydrateFromLoader` SHALL 是 user 数据的唯一注入点。

#### Scenario: Layout 不再每次导航拉 auth

- **WHEN** 用户在站内导航（首页 → 话题详情 → 设置）
- **THEN** `Layout` 组件从 `useAuthStore` 读 user，只发一次 `/auth/me` 请求（或由 loader 注入），不重复拉

#### Scenario: HeaderUserArea 单一数据源

- **WHEN** `HeaderUserArea` 渲染
- **THEN** 仅从 `useAuthStore` 读 user
- **AND** 不调用 `useRouteLoaderData("root")` 获取 ssrUser
- **AND** 不存在 `effectiveUser = user || ssrUser` 模式

#### Scenario: 登出清空 store

- **WHEN** 用户点退出登录
- **THEN** 调 `useAuthStore.getState().clear()`，且 `navigate("/")`

### Requirement: 首屏数据仍由 loader 负责

SSR 首屏数据 SHALL 由 React Router loader 拉取并通过 `loaderData` 注入组件，zustand store 不负责首屏数据。store 只负责跨路由共享的客户端态（user/theme）。原本用 `useEffect + apiFetch` 的页面（search、my.messages、admin/users、reply.$id.edit）SHALL 改为 loader 模式或保留客户端拉取但加 Skeleton + store。

#### Scenario: admin/users 首屏 SSR

- **WHEN** 直接访问 /admin/users
- **THEN** 首屏 HTML 由 loader 拉好数据返回，不出现客户端 useEffect 拉数据的白屏期

## ADDED Requirements

### Requirement: apiFetch 结构化错误返回

`apps/web/app/lib/api-client.ts` 的 `apiFetch` 在 JSON 解析失败时 SHALL 返回 `{ success: false, error_msg: "响应解析失败" }` 而非 `null`。当 HTTP 状态码为非 2xx 时，SHALL 尝试解析响应体获取错误信息；解析失败则返回 `{ success: false, error_msg: "请求失败 (HTTP {status})" }`。`apiFetch` MUST NOT 返回 `null` 或 `undefined`。

#### Scenario: JSON 解析失败不返回 null

- **WHEN** API 返回非 JSON 响应（如 HTML 错误页）
- **THEN** `apiFetch` 返回 `{ success: false, error_msg: "响应解析失败" }`
- **AND** 调用方 `res.success` 不抛 TypeError

#### Scenario: HTTP 500 返回结构化错误

- **WHEN** API 返回 HTTP 500 且响应体为 JSON `{ error_msg: "内部错误" }`
- **THEN** `apiFetch` 返回该错误体
- **AND** 调用方可正常读取 `res.success` 和 `res.error_msg`

#### Scenario: HTTP 502 且响应体非 JSON

- **WHEN** API 返回 HTTP 502 且响应体为 HTML
- **THEN** `apiFetch` 返回 `{ success: false, error_msg: "请求失败 (HTTP 502)" }`

### Requirement: 客户端 fetch 竞态防护

`apps/web/app/routes/search.tsx` 的客户端搜索请求 SHALL 使用 AbortController 取消前一个未完成请求，并使用请求序号（`useRef` 递增）丢弃过期响应。

#### Scenario: 快速输入不产生竞态

- **WHEN** 用户快速连续输入 "n"、"no"、"nod"、"node"
- **THEN** 只有 "node" 的搜索结果被渲染
- **AND** 前三个请求被 abort 或响应被丢弃

#### Scenario: 组件卸载时取消请求

- **WHEN** 搜索请求进行中用户导航离开 search 页
- **THEN** 请求被 abort，不触发 `setResults`（避免 React state update on unmounted component）
