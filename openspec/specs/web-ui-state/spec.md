# web-ui-state Specification

## Purpose

定义 Web 前端全局客户端状态、主题状态、UI 开关、路由数据刷新和首屏数据归属要求，确保 React Router loader 与 zustand store 的职责边界清晰。
## Requirements
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

### Requirement: useThemeStore 三态切换与 persist

`theme-store.ts` SHALL 用 zustand `persist` middleware 持久化到 `localStorage`,key 为 `"theme"`,值 `"light"|"dark"|"system"`。store SHALL 暴露 `theme` 与 `toggle()`。system 态下 SHALL 通过 `window.matchMedia("(prefers-color-scheme: dark)")` 监听系统主题变化并实时切换 `<html>` 的 `dark` class。persist MUST 配 `skipHydration: true`,由 root.tsx 的 inline script 负责首屏防 FOUC,store 只在客户端 hydrate 后接管交互。

#### Scenario: store 不与 inline script 冲突

- **WHEN** 页面 SSR 返回并执行 inline script 设好 `dark` class 后,React hydrate
- **THEN** theme store rehydrate 后读到 `theme=dark`,与 DOM 已有 class 一致,不重新触发切换

#### Scenario: system 态跟随系统主题

- **WHEN** theme 为 `system` 且用户在 OS 层面切换深色
- **THEN** 界面立即跟随,无需刷新页面

### Requirement: useUIStore 管理 UI 开关

`ui-store.ts` SHALL 管理纯 UI 状态:`mobileNavOpen`、`userMenuOpen`(如未由 DropdownMenu 托管)。SHALL NOT 持久化(不接 persist middleware)。

#### Scenario: 移动端导航开关

- **WHEN** 用户点汉堡按钮打开移动导航
- **THEN** `useUIStore.getState().setMobileNavOpen(true)`,Sheet 组件读 store 渲染

### Requirement: Mutation 后用 revalidate 替换 reload

所有 mutation(创建/编辑/删除/封禁/标记已读/重置密码)成功后 MUST 调用 React Router v7 的 `useRevalidator().revalidate()` 重跑当前路由 loader,或调 store action 更新全局态,或二者结合。MUST NOT 使用 `window.location.reload()`。

#### Scenario: 回复成功后局部刷新

- **WHEN** 用户在话题详情页提交回复成功
- **THEN** 调 `revalidate()` 重跑 `topic.$tid` loader,新回复出现在列表,滚动位置不丢,不触发整页 reload

#### Scenario: 封禁用户后局部刷新

- **WHEN** 管理员在 admin/users 点禁言并成功
- **THEN** 调 `revalidate()` 重跑 admin/users loader,用户状态列更新为"禁言"

### Requirement: 首屏数据仍由 loader 负责

SSR 首屏数据 SHALL 由 React Router loader 拉取并通过 `loaderData` 注入组件，zustand store 不负责首屏数据。store 只负责跨路由共享的客户端态（user/theme）。原本用 `useEffect + apiFetch` 的页面（search、my.messages、admin/users、reply.$id.edit）SHALL 改为 loader 模式或保留客户端拉取但加 Skeleton + store。

#### Scenario: admin/users 首屏 SSR

- **WHEN** 直接访问 /admin/users
- **THEN** 首屏 HTML 由 loader 拉好数据返回，不出现客户端 useEffect 拉数据的白屏期

### Requirement: 删除所有 window.location.reload 调用

`apps/web/app/routes/` 下所有 `.tsx` 文件 MUST NOT 包含 `window.location.reload` 调用。

#### Scenario: grep 检查无 reload

- **WHEN** 在 `apps/web/app/routes` 下搜索 `window.location.reload`
- **THEN** 无匹配项

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

### Requirement: 可分享 UI 状态由 URL 表示

影响当前数据集或页面视图的 tab、搜索、筛选、排序和分页状态 SHALL 由 URL pathname 或 search parameters 表示，而不是仅保存在组件内存中。打开相同 URL MUST 恢复相同的可分享 UI 状态。

#### Scenario: 切换列表 tab

- **WHEN** 用户在公开页面或后台列表切换 tab
- **THEN** URL MUST 更新为所选 tab
- **AND** 刷新页面后 MUST 继续展示该 tab
- **AND** 浏览器后退 MUST 恢复切换前的 tab 和结果。

#### Scenario: 修改筛选后翻页

- **WHEN** 用户应用筛选、排序或搜索条件后翻页
- **THEN** 下一页 URL MUST 同时保留这些条件
- **AND** 复制该 URL 到新会话 MUST 得到相同筛选和页码状态。

#### Scenario: URL 包含无效 UI 状态

- **WHEN** URL 包含不支持的 tab、筛选值或页码
- **THEN** 页面 MUST 使用明确的安全默认值或展示可理解的无结果状态
- **AND** 不得渲染互相矛盾的选中状态。

### Requirement: SSR 首次渲染不得依赖浏览器专属状态

SSR 页面及其客户端首次 render SHALL 从相同的路由数据、URL 和确定性默认值生成相同结构。组件 MUST NOT 在 render 阶段读取 `window`、`document`、`localStorage`、viewport 或媒体查询来决定首次呈现的分支；浏览器专属增强 MUST 在 hydration 后接管，且不得改变既有业务状态。

#### Scenario: 直接请求含筛选参数的页面

- **WHEN** 用户直接请求带 tab、筛选或分页参数的 URL
- **THEN** SSR HTML MUST 已反映这些 URL 状态
- **AND** hydration 后选中项、结果和分页 MUST 与 SSR HTML 一致
- **AND** 控制台不得出现 hydration mismatch。

#### Scenario: 浏览器专属 UI 偏好

- **WHEN** 某个非关键 UI 偏好只能从浏览器存储或媒体查询获得
- **THEN** SSR 与客户端首次 render MUST 使用相同的确定性默认结构
- **AND** hydration 后应用该偏好时 MUST 不丢失焦点、输入内容或路由状态。

#### Scenario: 无 JavaScript 首屏结构

- **WHEN** 服务端渲染公共或后台页面
- **THEN** 主标题、主要内容和基于 URL 的当前状态 MUST 存在于首屏 HTML
- **AND** 不得以仅客户端占位分支替代这些内容。

### Requirement: 未保存内容离开保护

话题创建、话题编辑、回复编辑及其他会产生长文本草稿的页面 SHALL 在内容相对初始值发生变化且尚未成功保存时保护用户免于意外离开。

#### Scenario: 站内导航离开脏表单

- **WHEN** 用户修改标题、分类或正文后触发站内导航
- **THEN** 页面 MUST 在离开前说明存在未保存内容并要求用户确认
- **AND** 用户取消时 MUST 留在当前页面且输入内容保持不变。

#### Scenario: 刷新或关闭含未保存内容的页面

- **WHEN** 表单存在未保存内容且用户刷新、关闭标签页或离开站点
- **THEN** 浏览器 MUST 展示其支持的离开警告
- **AND** 未确认离开时页面内容 MUST 保持不变。

#### Scenario: 无修改或保存成功后离开

- **WHEN** 表单未发生变化或最近一次提交已成功保存当前内容
- **THEN** 后续导航 MUST 不再显示未保存内容警告。

#### Scenario: 提交进行中触发离开

- **WHEN** 保存请求仍在进行且用户尝试离开
- **THEN** 页面 MUST 将当前内容视为尚未保存
- **AND** 只有收到成功结果后才能解除离开保护。
