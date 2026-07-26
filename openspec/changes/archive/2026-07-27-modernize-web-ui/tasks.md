## 1. 主题 token 系统(web-ui-theme)

- [x] 1.1 安装 tailwind-merge、clsx,创建 `apps/web/app/lib/utils.ts` 导出 `cn()` 工具
- [x] 1.2 用 `@theme inline` + `:root` + `.dark` 重写 `apps/web/app/styles/global.css`,声明完整语义 token(background/foreground/primary/primary-foreground/secondary/secondary-foreground/muted/muted-foreground/accent/accent-foreground/destructive/destructive-foreground/border/input/ring/card/card-foreground/popover/popover-foreground/radius)
- [x] 1.3 初始化 shadcn(`pnpm dlx shadcn@latest init`),生成 `components.json`,指向 `app/components/ui` 与 `app/lib/utils`,确认 Tailwind v4 CSS-first 配置生效
- [x] 1.4 在 `app/styles/global.css` 内补 highlight.js 主题(light/dark 各一份,基于 token 而非固定色值)
- [x] 1.5 验证:grep `#[0-9a-fA-F]{3,6}`、`bg-white dark:`、`dark:bg-\[#` 在 `apps/web/app` 下应仅在 `global.css` 与 `tailwind` 内置层出现

## 2. shadcn/ui 原子组件层(web-ui-components)

- [x] 2.1 复制基础原子组件:`pnpm dlx shadcn@latest add button input label card badge avatar`
- [x] 2.2 复制交互原子组件:`pnpm dlx shadcn@latest add dropdown-menu dialog sheet tabs tooltip`
- [x] 2.3 复制数据/反馈原子组件:`pnpm dlx shadcn@latest add table skeleton sonner form`
- [x] 2.4 安装 `lucide-react`,在 `root.tsx` 引入 `<Toaster />`(sonner),保留 FOUC inline script
- [x] 2.5 验证:`apps/web/app/components/ui/` 下存在 15 个 `.tsx` 文件,每个是完整组件源码
- [x] 2.6 验证:启动 `pnpm dev`,访问首页与登录页,原子组件渲染正常(视觉无破坏即可,此时尚未替换 route)

## 3. zustand 全局状态(web-ui-state)

- [x] 3.1 安装 `zustand`,创建 `apps/web/app/lib/stores/` 目录
- [x] 3.2 实现 `theme-store.ts`:persist + `skipHydration: true`,三态 toggle,matchMedia listener 监听 system 变化
- [x] 3.3 实现 `auth-store.ts`:state `user`/`unreadCount`,actions `setUser`/`clear`/`fetchUnread`,提供 `hydrateFromLoader(user)` 注入方法
- [x] 3.4 实现 `ui-store.ts`:`mobileNavOpen` 等 UI 开关,无 persist
- [x] 3.5 改造 `Layout.tsx` 的 `HeaderUserArea`:删除 `useEffect + apiFetch("/auth/me")`,改读 `useAuthStore`
- [x] 3.6 在根路由(或 `root.tsx` 出口)从 loader 注入 `loaderData.user` 到 `useAuthStore`(客户端 mount 后调用 hydrate)
- [x] 3.7 验证:登录 → 导航首页 → 话题详情 → 设置,DevTools 网络面板只出现一次 `/auth/me`

## 4. 用 revalidate 替换 reload(web-ui-state 续)

- [x] 4.1 grep `window.location.reload` 在 `apps/web/app/routes/` 下,列出全部位置
- [x] 4.2 改造 `routes/topic.$tid.tsx` 回复提交:成功后调 `useRevalidator().revalidate()` + 清空编辑器,不再 reload
- [x] 4.3 改造 `routes/admin/users.tsx` 封禁/解禁/删言/重置密码:成功后 `revalidate()` + `toast`,不再 reload
- [x] 4.4 改造其余 admin route 中的 reload 点(bans/reports/keywords/topics/mod)
- [x] 4.5 改造 `routes/reply.$id.edit.tsx`:保存成功后 `navigate` 回话题页 + `revalidate()`,不再 reload
- [x] 4.6 改造 `routes/my.messages.tsx` 标记已读:成功后 `revalidate()`,不再 reload
- [x] 4.7 验证:grep `window.location.reload` 在 `apps/web/app/routes/` 下无匹配

## 5. DropdownMenu/Dialog/Sheet/Tabs 替换手写交互(web-ui-components 续)

- [x] 5.1 重写 `Layout.tsx` 的 `HeaderUserArea`:用 `DropdownMenu` 包头像,修 outside-click 与 Escape
- [x] 5.2 重写 `Layout.tsx` 的 `MobileNav`:用 `Sheet`(侧拉或底部),从 `useUIStore` 读开闭
- [x] 5.3 重写 `admin/users.tsx` 的重置密码 Modal 为 `Dialog`
- [x] 5.4 重写 `routes/_index.tsx` 的 Tab 切换为 `Tabs`(或 `TabsList`/`TabsTrigger`)
- [x] 5.5 重写 `routes/admin/settings.tsx` 的 tab 为 `Tabs`
- [x] 5.6 重写所有 admin route 的 `<table>` 为 shadcn `Table` 组件组合
- [x] 5.7 验证:点击 DropdownMenu 外部关闭;Dialog 打开后 Tab 循环在 Dialog 内;Sheet 滑入/滑出动画正常

## 6. lucide-react 图标替换(web-ui-components 续)

- [x] 6.1 grep `🔍|✏️|✉️|👤|🌙|☀️|🖥️|📋|👁|💬|⭐|🚩|👍|📊|📝|🚫|📛|⚙️|🔔` 在 `apps/web/app/` 下,列出全部位置
- [x] 6.2 改造 `ThemeToggle.tsx`:用 `<Sun>`/`<Moon>`/`<Monitor>` 替换 emoji,改读 `useThemeStore`
- [x] 6.3 改造 `Layout.tsx` Header 与 MobileNav 的所有 emoji
- [x] 6.4 改造 `AdminLayout.tsx` 侧边栏导航的 9 个 emoji
- [x] 6.5 改造 `TopicList.tsx` 的 💬/👁,改用 `<MessageSquare>`/`<Eye>`
- [x] 6.6 改造 `topic.$tid.tsx` 的 ⭐/🚩/👍,改用 `<Star>`/`<Flag>`/`<ThumbsUp>`
- [x] 6.7 改造其余 route 内零散 emoji(搜索/消息/设置等)
- [x] 6.8 验证:grep emoji 范围在 `apps/web/app/` 下无匹配(文本内容中如帖子正文保留 emoji 不算)

## 7. 域组件用原子组合重写(web-ui-components 续)

- [x] 7.1 重写 `TagBadge.tsx` 与 `StatusBadge.tsx` 为 `Badge` 变体调用,删除手写颜色 map
- [x] 7.2 重写 `TopicList.tsx` 的 `TopicListItem`:用 `<Avatar>`/`<Badge>`/`<Link>` 组合,替换裸 `<img>` 与 `<span>`
- [x] 7.3 抽取 `ReplyItem` 组件(从 `topic.$tid.tsx` 内联抽出),用原子组合
- [x] 7.4 抽取 `UserCard` 组件(从 `user.$name.tsx` 内联抽出),用 `<Avatar>`/`<Card>` 组合
- [x] 7.5 重写 `Sidebar.tsx` 的三个卡片(社区信息/无人回复/友情社区)用 `<Card>`
- [x] 7.6 重写 `AdminLayout.tsx` 用 shadcn 组件 + lucide 图标
- [x] 7.7 重写 `EmptyState.tsx` 为基于 token 的实现(无字面量色值)
- [x] 7.8 验证:每个域组件渲染正常,无视觉回归

## 8. 表单标准化(web-ui-forms)

- [x] 8.1 安装 `react-hook-form`、`@hookform/resolvers`,确认 `packages/shared` 已导出的 Zod schemas 名单(login/signup/createTopic/editTopic/changePass/profile 等)
- [x] 8.2 改造 `routes/signin.tsx`:`useForm` + `zodResolver(loginSchema)` + shadcn Form,删除 useState/手写 error div
- [x] 8.3 改造 `routes/signup.tsx`:扩展 `signupSchema` 加 `confirmPass`,用 hookform
- [x] 8.4 改造 `routes/topic.create.tsx` 用 `createTopicSchema` + hookform + MarkdownEditor
- [x] 8.5 改造 `routes/topic.$tid.edit.tsx` 用 `editTopicSchema` + hookform
- [x] 8.6 改造 `routes/reply.$id.edit.tsx` 用 hookform(如 shared 无对应 schema,在 route 内定义 zod)
- [x] 8.7 改造 `routes/setting.tsx` 两个表单(个人资料/修改密码)用 hookform,扩展 shared schema
- [x] 8.8 改造 `routes/admin/settings.tsx` 表单用 hookform
- [x] 8.9 所有表单的提交反馈从内联 `{success && <div>}` 改为 `toast.success`/`toast.error`
- [x] 8.10 验证:grep `useState.*pass|useState.*name|useState.*error` 在改过的 route 下无匹配;表单空字段提交时 `FormMessage` 显示错误

## 9. Markdown 渲染(web-ui-markdown)

- [x] 9.1 安装 `react-markdown`、`remark-gfm`、`rehype-sanitize`、`rehype-highlight`、`highlight.js`
- [x] 9.2 重写 `components/MarkdownView.tsx`:用 `react-markdown` + 四个插件,`rehype-sanitize` 放行 `class` 属性
- [x] 9.3 在 `styles/global.css` 引入 highlight.js 主题(light/dark 各一份,基于 token)
- [x] 9.4 重写 `MarkdownEditor.tsx` 预览分支:`<MarkdownView content={value} />`
- [x] 9.5 改造 MarkdownView 容器 className:用 `prose prose-headings:text-foreground prose-p:text-muted-foreground prose-code:bg-muted ...`,删 `dark:prose-invert`
- [x] 9.6 验证 XSS 防护:构造话题内容含 `<script>alert(1)</script>` 与 `<img src=x onerror=alert(1)>`,确认不执行
- [x] 9.7 验证 GFM:发一条包含表格/任务列表/删除线/自动链接的话题,确认渲染正确
- [x] 9.8 验证代码高亮:发一条含 ```js 代码块的话题,确认高亮 class 与主题色正确

## 10. 字面量与冗余清理(收尾)

- [x] 10.1 grep `#0d1117|#161b22` 在 `apps/web/app/` 下,逐个替换为 token class(`bg-background`/`bg-card`)
- [x] 10.2 grep `bg-white dark:bg-` 在 `apps/web/app/` 下,逐个替换为 `bg-card` 或 `bg-background`
- [x] 10.3 grep `border-gray-200 dark:border-gray-800` 在 `apps/web/app/` 下,替换为 `border-border`
- [x] 10.4 grep `bg-blue-600 text-white` 在 `apps/web/app/` 下,替换为 `<Button>` 调用(主按钮变体)
- [x] 10.5 grep `bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300` 在 `apps/web/app/` 下,替换为 `toast` 或 `<Badge variant="destructive">`
- [x] 10.6 grep `alert(` 在 `apps/web/app/` 下,逐个替换为 `toast`
- [x] 10.7 grep emoji 图标字符(第 6 组列出的集合)在 `apps/web/app/` 下,确认 0 匹配
- [x] 10.8 grep `window.location.reload` 在 `apps/web/app/routes/` 下,确认 0 匹配

## 11. 端到端验证

- [x] 11.1 运行 `pnpm typecheck` 在 `apps/web` 下通过
- [x] 11.2 运行 `pnpm lint` 在 `apps/web` 下通过
- [x] 11.3 运行 `pnpm build` 确认 Workers bundle 体积增量 < 150KB gz(对比改动前)
- [x] 11.4 手动走查:首页 → Tab 切换 → 话题详情 → 回复 → 登录 → 注册 → 发帖 → 设置 → admin 全部页面,无视觉回归、无控制台错误
- [x] 11.5 手动验证 dark/light/system 三态切换,刷新不闪白
- [x] 11.6 手动验证 XSS 防护:发含 `<script>` 与 `onerror` 的话题,确认被 sanitize
- [x] 11.7 验证 grep 检查全部通过(第 10 组的 8 个 grep 命令)
