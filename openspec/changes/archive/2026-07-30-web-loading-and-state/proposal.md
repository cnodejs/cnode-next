## Why

apps/web 大量页面在客户端导航（翻页、切 tab、进详情）时无任何 loading 反馈，用户感知为"卡死"；mutation 操作（收藏、标记已读、投票、封禁等）的 pending 状态各自手写 `useState(false)`，风格不统一且容易遗漏错误处理；`apiFetch` 吞掉 JSON 解析错误返回 `null`，调用方对 null 解引用直接 TypeError；`ui-store` 是死代码，`auth-store` 与 root loader 存在双数据源。项目已接近完成，现在是统一体验、收拢状态管理的最后窗口。

## What Changes

- 新增 root 级 `<NavProgress />` 组件，基于 `useNavigation().state` 在客户端导航期间展示顶部进度条 + 内容区 opacity 过渡
- 新增 `useAsyncAction` hook，统一所有 mutation 的 pending / 防重复点击 / 错误 toast 逻辑，全量替换手写 `useState(false)` 模式
- 修复 `apiFetch` 错误处理：JSON 解析失败时返回结构化失败对象而非 `null`
- 修复 `search.tsx` 客户端 fetch 竞态（AbortController + 请求序号）
- 删除死代码 `ui-store.ts` 及其 re-export
- 收敛 `auth-store` 双数据源：将 `ssrUser` 兜底逻辑收入 `hydrateFromLoader` 内部，组件只从 store 读 user

## Non-goals

- 不引入 TanStack Query 或其他数据获取库，保持 React Router loader + zustand 现有架构
- 不改造 SSR loader 本身的取数逻辑（KV 缓存、apiFetch 调用链等）
- 不改变 `theme-store` 行为（已正常工作）
- 不新增路由或页面

## Capabilities

### New Capabilities

- `web-navigation-progress`: 客户端导航期间的进度条与内容过渡反馈
- `web-async-action`: 统一的 mutation pending / 防重复 / 错误处理 hook

### Modified Capabilities

- `web-ui-state`: 删除 ui-store、收敛 auth-store 双数据源、修复 apiFetch 错误处理与 search 竞态

## Impact

- `apps/web/app/root.tsx`: 挂载 NavProgress
- `apps/web/app/components/`: 新增 NavProgress、useAsyncAction
- `apps/web/app/lib/api-client.ts`: 错误处理修复
- `apps/web/app/lib/stores/`: 删除 ui-store.ts，修改 auth-store.ts、index.ts
- `apps/web/app/routes/`: 全量替换手写 mutation 状态（topic.$tid、topic.create、my.messages、setting、reply.$id.edit、user.$name、admin/* 等约 15 个文件）
- `apps/web/app/routes/search.tsx`: 竞态修复
- 无 API 变更、无数据库变更、无依赖变更（zustand 已在 package.json）
