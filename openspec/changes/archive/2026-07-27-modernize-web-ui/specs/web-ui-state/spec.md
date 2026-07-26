## ADDED Requirements

### Requirement: zustand 作为全局状态库

`apps/web/app/lib/stores/` SHALL 包含三个 zustand store:`auth-store.ts`、`theme-store.ts`、`ui-store.ts`。store MUST 是无 Provider 的全局单例,直接 `import { useXStore } from "~/lib/stores/x-store"` 使用。

#### Scenario: 跨路由共享 auth 状态

- **WHEN** 用户在话题详情页登录后导航到设置页
- **THEN** 设置页直接从 `useAuthStore` 读 user,不重新拉 `/api/v1/auth/me`

### Requirement: useAuthStore 管理 user 与 unreadCount

`auth-store.ts` SHALL 暴露 `user: User | null`、`unreadCount: number`、`setUser(user)`、`clear()`、`fetchUnread()`。store 在客户端初始化时 SHALL 从 React Router loader 注入的 `loaderData.user` 读初始值,之后跨路由共享。`Layout.tsx` 当前的 `useEffect(() => apiFetch("/api/v1/auth/me"))` MUST 被删除,改为读 store。

#### Scenario: Layout 不再每次导航拉 auth

- **WHEN** 用户在站内导航(首页 → 话题详情 → 设置)
- **THEN** `Layout` 组件从 `useAuthStore` 读 user,只发一次 `/auth/me` 请求(或由 loader 注入),不重复拉

#### Scenario: 登出清空 store

- **WHEN** 用户点退出登录
- **THEN** 调 `useAuthStore.getState().clear()`,且 `navigate("/")`

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

所有 mutation(创建/编辑/删除/封禁/标记已读/重置密码)成功后 MUST 调用 React Router v8 的 `useRevalidator().revalidate()` 重跑当前路由 loader,或调 store action 更新全局态,或二者结合。MUST NOT 使用 `window.location.reload()`。

#### Scenario: 回复成功后局部刷新

- **WHEN** 用户在话题详情页提交回复成功
- **THEN** 调 `revalidate()` 重跑 `topic.$tid` loader,新回复出现在列表,滚动位置不丢,不触发整页 reload

#### Scenario: 封禁用户后局部刷新

- **WHEN** 管理员在 admin/users 点禁言并成功
- **THEN** 调 `revalidate()` 重跑 admin/users loader,用户状态列更新为"禁言"

### Requirement: 首屏数据仍由 loader 负责

SSR 首屏数据 SHALL 由 React Router loader 拉取并通过 `loaderData` 注入组件,zustand store 不负责首屏数据。store 只负责跨路由共享的客户端态(user/theme/ui)。原本用 `useEffect + apiFetch` 的页面(search、my.messages、admin/users、reply.$id.edit)SHALL 改为 loader 模式或保留客户端拉取但加 Skeleton + store。

#### Scenario: admin/users 首屏 SSR

- **WHEN** 直接访问 /admin/users
- **THEN** 首屏 HTML 由 loader 拉好数据返回,不出现客户端 useEffect 拉数据的白屏期

### Requirement: 删除所有 window.location.reload 调用

`apps/web/app/routes/` 下所有 `.tsx` 文件 MUST NOT 包含 `window.location.reload` 调用。

#### Scenario: grep 检查无 reload

- **WHEN** 在 `apps/web/app/routes` 下搜索 `window.location.reload`
- **THEN** 无匹配项
