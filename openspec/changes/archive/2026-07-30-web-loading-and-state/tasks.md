## 1. 基础设施

- [x] 1.1 修复 `apps/web/app/lib/api-client.ts` 的 `apiFetch`：JSON 解析失败返回 `{ success: false, error_msg: "响应解析失败" }`，非 2xx 状态码返回结构化错误，确保永不返回 `null`
- [x] 1.2 新增 `apps/web/app/hooks/use-async-action.ts`，实现 `useAsyncAction` hook（pending 状态、防重复调用、自动 toast、onSuccess/onError 回调）
- [x] 1.3 验证：`pnpm typecheck` 通过，`useAsyncAction` 类型签名正确

## 2. 导航进度条

- [x] 2.1 新增 `apps/web/app/components/NavProgress.tsx`：监听 `useNavigation().state`，150ms 延迟显示顶部进度条，导航结束 fade out
- [x] 2.2 在 `apps/web/app/root.tsx` 的 `Layout` 中挂载 `<NavProgress />`，给 `<main>` 内容区添加导航期间 `opacity-60 transition-opacity` 过渡
- [x] 2.3 验证：`pnpm dev` 启动后翻页、切 tab 可见进度条和内容渐隐，快速导航不闪烁，SSR 首屏不触发

## 3. zustand 清理

- [x] 3.1 删除 `apps/web/app/lib/stores/ui-store.ts`，移除 `stores/index.ts` 中的 re-export
- [x] 3.2 收敛 auth-store 双数据源：`HeaderUserArea` 和 `MobileNavTrigger` 删除 `useRouteLoaderData("root")` 的 ssrUser 兜底，统一从 `useAuthStore` 读 user
- [x] 3.3 验证：`pnpm typecheck` 通过，grep 确认 `useUIStore` 和 `effectiveUser = user || ssrUser` 模式零匹配

## 4. 搜索竞态修复

- [x] 4.1 修复 `apps/web/app/routes/search.tsx`：添加 AbortController 取消前一个请求，useRef 请求序号丢弃过期响应，组件卸载时 abort
- [x] 4.2 验证：快速连续输入搜索词，只有最后一次结果被渲染

## 5. 全量替换 mutation 状态（主站路由）

- [x] 5.1 替换 `topic.create.tsx`：`saving` useState → `useAsyncAction`
- [x] 5.2 替换 `topic.$tid.tsx`：`collecting`、`adminAction` useState → 多个 `useAsyncAction` 实例（收藏、置顶、高亮、删除）
- [x] 5.3 替换 `topic.$tid.edit.tsx`：`saving` useState → `useAsyncAction`
- [x] 5.4 替换 `my.messages.tsx`：标记已读、全部已读添加 `useAsyncAction`（此前无 pending 状态）
- [x] 5.5 替换 `setting.tsx`：所有 mutation 操作 → `useAsyncAction`
- [x] 5.6 替换 `reply.$id.edit.tsx`：`saving` useState → `useAsyncAction`
- [x] 5.7 替换 `user.$name.tsx`：follow/unfollow 操作 → `useAsyncAction`
- [x] 5.8 替换 `signin.tsx`、`signup.tsx`：提交操作 → `useAsyncAction`
- [x] 5.9 替换 `reset_pass.tsx`、`search_pass.tsx`：提交操作 → `useAsyncAction`
- [x] 5.10 替换 `auth.github.new.tsx`：创建账号操作 → `useAsyncAction`
- [x] 5.11 验证：`pnpm typecheck` 通过，grep 确认主站路由无遗留 mutation 用途的 `useState(false)`

## 6. 全量替换 mutation 状态（admin 路由）

- [x] 6.1 替换 `admin/mod.tsx`：审核操作 → `useAsyncAction`
- [x] 6.2 替换 `admin/bans.tsx`：封禁/解封操作 → `useAsyncAction`
- [x] 6.3 替换 `admin/keywords.tsx`：关键词增删改 → `useAsyncAction`
- [x] 6.4 替换 `admin/reports.tsx`：举报处理 → `useAsyncAction`
- [x] 6.5 替换 `admin/settings.tsx`：设置保存 → `useAsyncAction`
- [x] 6.6 替换 `admin/topics.tsx`：话题管理操作 → `useAsyncAction`
- [x] 6.7 替换 `admin/users.tsx`：用户管理操作 → `useAsyncAction`
- [x] 6.8 验证：`pnpm typecheck` 通过，grep 确认 admin 路由无遗留 mutation 用途的 `useState(false)`

## 7. 最终验证

- [x] 7.1 `pnpm lint` 通过
- [x] 7.2 `pnpm typecheck` 通过
- [x] 7.3 `pnpm test` 通过
- [x] 7.4 `pnpm build` 通过
- [x] 7.5 手动验证：导航进度条、mutation pending 反馈、搜索竞态、auth 状态一致性
