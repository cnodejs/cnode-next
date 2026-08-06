## Context

apps/web 基于 React Router v7 framework mode（SSR），数据获取分三层：

1. **SSR loader**：绝大多数页面的首屏数据（`_index`、`topic.$tid`、`zone.jobs`、`admin/*` 等）
2. **客户端 useEffect fetch**：少数组件（`Sidebar`、`search`、`topic.$tid.edit`）
3. **手写 mutation 状态**：约 15 个路由文件各自 `useState(false)` 管理 pending

当前问题：

- 客户端导航（翻页、切 tab）期间无任何视觉反馈，`useNavigation` 全仓库零使用
- mutation pending 状态风格不统一，部分操作（`my.messages` 标记已读）完全无反馈
- `apiFetch` 的 `res.json().catch(() => null)` 导致调用方对 `null` 解引用
- `search.tsx` 无 AbortController，快速输入时旧响应覆盖新结果
- `ui-store.ts` 是死代码（`useUIStore` 零消费），`auth-store` 与 root loader 存在 `effectiveUser = user || ssrUser` 双数据源

## Goals / Non-Goals

**Goals:**

- 客户端导航期间提供统一的进度条 + 内容过渡反馈
- 全量统一 mutation 的 pending / 防重复 / 错误处理模式
- 修复 `apiFetch` 错误吞没和 `search.tsx` 竞态
- 清理 zustand 死代码，收敛 auth 双数据源

**Non-Goals:**

- 不引入 TanStack Query 或 SWR 等数据获取库
- 不改造 SSR loader 取数逻辑（KV 缓存策略、apiFetch 调用链）
- 不改变 `theme-store` 行为
- 不新增路由、页面或 API 端点
- 不改变 `useRevalidator` 的使用模式（mutation 成功后 revalidate 仍保留）

## Decisions

### D1: NavProgress 基于 useNavigation 而非全局 fetch 拦截

**决定**：在 `root.tsx` 的 `Layout` 中新增 `<NavProgress />`，监听 `useNavigation().state`。`state === "loading"` 时展示顶部进度条（CSS transition 模拟，不引入 nprogress 依赖），同时给 `<main>` 内容区加 `opacity-60 transition-opacity` 过渡。

**否决方案**：

- 拦截全局 `fetch` 做 loading 计数：侵入性强，无法区分导航 fetch 和 mutation fetch，且与 SSR loader 的 fetch 冲突
- 引入 nprogress 库：增加依赖，CSS 进度条用 Tailwind 即可实现，效果等价

**进度条行为**：

- 导航开始 150ms 后才显示（避免快速导航闪烁），用 `setTimeout` + 清理
- 导航结束时进度条快速走完并 fade out
- 进度条固定在 viewport 顶部，`z-50`，高度 2px，使用 `--color-primary` 变量

### D2: useAsyncAction 统一 mutation 模式

**决定**：新增 `apps/web/app/hooks/use-async-action.ts`，封装 `useState(false)` + `try/catch/finally` + `toast.error` 模式。

```typescript
function useAsyncAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  opts?: {
    successMessage?: string | ((result: TResult) => string);
    errorMessage?: string | ((error: unknown) => string);
    onSuccess?: (result: TResult) => void;
    onError?: (error: unknown) => void;
  },
): {
  run: (...args: TArgs) => void;
  pending: boolean;
};
```

**设计要点**：

- `pending` 为 true 时重复调用 `run` 直接 return（防重复点击）
- 错误自动 `toast.error`，调用方可通过 `errorMessage` 自定义
- 不替代 `useRevalidator`——调用方在 `onSuccess` 里自行决定是否 revalidate
- 不替代 `useFetcher`——当前项目无 `<Form>` 提交模式，mutation 全是命令式 `apiFetch`，`useAsyncAction` 与之匹配

**否决方案**：

- 全量改 `useFetcher` + `<Form>`：改动面过大（需重写所有 mutation 为 form action），且项目已接近完成，收益不抵风险
- 每个组件继续手写：当前问题根源，不可接受

**替换范围**（全量）：

| 文件                                 | 当前模式                             | 替换为                       |
| ------------------------------------ | ------------------------------------ | ---------------------------- |
| `topic.create.tsx`                   | `saving` useState                    | `useAsyncAction`             |
| `topic.$tid.tsx`                     | `collecting`、`adminAction` useState | `useAsyncAction`（多个实例） |
| `topic.$tid.edit.tsx`                | `saving` useState                    | `useAsyncAction`             |
| `my.messages.tsx`                    | 无 pending 状态                      | `useAsyncAction`             |
| `setting.tsx`                        | 多处手写                             | `useAsyncAction`             |
| `reply.$id.edit.tsx`                 | `saving` useState                    | `useAsyncAction`             |
| `user.$name.tsx`                     | 手写 follow/unfollow                 | `useAsyncAction`             |
| `signin.tsx` / `signup.tsx`          | 手写                                 | `useAsyncAction`             |
| `reset_pass.tsx` / `search_pass.tsx` | 手写                                 | `useAsyncAction`             |
| `auth.github.new.tsx`                | 手写                                 | `useAsyncAction`             |
| `admin/mod.tsx`                      | 多处手写                             | `useAsyncAction`             |
| `admin/bans.tsx`                     | 多处手写                             | `useAsyncAction`             |
| `admin/keywords.tsx`                 | 多处手写                             | `useAsyncAction`             |
| `admin/reports.tsx`                  | 手写                                 | `useAsyncAction`             |
| `admin/settings.tsx`                 | 手写                                 | `useAsyncAction`             |
| `admin/topics.tsx`                   | 手写                                 | `useAsyncAction`             |
| `admin/users.tsx`                    | 手写                                 | `useAsyncAction`             |

### D3: apiFetch 错误处理修复

**决定**：`res.json()` 失败时返回 `{ success: false, error_msg: "响应解析失败" }` 而非 `null`。同时检查 `res.ok`，非 2xx 时尝试解析错误体，解析失败则返回结构化错误。

**否决方案**：

- 抛异常让调用方 catch：调用方太多，逐个加 try/catch 不现实，且当前调用方都假设返回值非 null
- 引入 zod 校验响应：过度设计，当前阶段只需保证不返回 null

### D4: search.tsx 竞态修复

**决定**：使用 `useRef` 存请求序号，每次新请求递增，响应回来时比对序号，过期则丢弃。同时用 `AbortController` 取消前一个未完成请求。

**否决方案**：

- 改用 loader + `useSearchParams` 驱动：search 页当前无 loader，改为 loader 模式需要处理 SSR 空搜索的情况，改动面大且搜索是纯客户端行为，不值得
- 用 `useDeferredValue`：React 并发特性，但无法取消已发出的网络请求

### D5: 删除 ui-store，收敛 auth-store

**决定**：

- 删除 `ui-store.ts` 及 `stores/index.ts` 中的 re-export。移动导航已由 `<Sheet>` 组件内部状态管理，⌘K 命令面板由 `Layout` 的 `useState` 管理，均无需全局 store。
- `auth-store` 的 `hydrateFromLoader` 改为接收 `user` 后直接 set，`HeaderUserArea` 和 `MobileNavTrigger` 删除 `useRouteLoaderData("root")` 的 ssrUser 兜底，统一从 store 读。`root.tsx` 的 `useEffect(() => hydrateFromLoader(user))` 保持不变，作为唯一注入点。

**否决方案**：

- 保留 ui-store 改为管理 ⌘K 状态：⌘K 只在 `Layout` 内部使用，`CommandPalette` 通过 props 接收 `open/onOpenChange`，无跨组件需求，不值得用全局 store
- auth-store 完全删除改为只读 loader data：`my.messages` 的 `setUnreadCount` 需要跨组件更新 header 角标，纯 loader data 做不到（除非每次 revalidate root）

## Risks / Trade-offs

- **[全量替换 mutation 模式改动面大]** → 逐文件替换，每个文件改完立即 typecheck；`useAsyncAction` 接口简单，替换是机械性的
- **[NavProgress 150ms 延迟可能在慢网络下感知不到]** → 150ms 是业界常用阈值（NProgress 默认 0ms 但 React Router 社区推荐 100-200ms），可后续微调
- **[apiFetch 返回结构化错误后，部分调用方可能依赖 null 判断]** → grep 确认无调用方用 `=== null` 判断 apiFetch 返回值
- **[auth-store 收敛后 SSR 首帧 header 可能闪烁]** → `root.tsx` 的 `useEffect` 在 hydrate 后立即执行，且 `HeaderUserArea` 已有 `mounted` 状态守卫，首帧不渲染用户区
