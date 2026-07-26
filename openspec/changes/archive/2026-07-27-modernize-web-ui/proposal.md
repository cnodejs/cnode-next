## Why

`apps/web` 当前 UI 层停留在"能跑"而非"能用":设计 token 只有 2 个 CSS 变量,所有颜色在组件里字面量硬编码并双倍写(`border-gray-200 dark:border-gray-800` 重复 15+ 次,`#0d1117`/`#161b22` 散落 10+ 处);没有原子组件层,Button/Input/Card/Badge 等全由 33 个 route 各自手写裸 Tailwind 字符串拼装,重复 20+ 次;Dropdown 缺 outside-click(`Layout.tsx:93`),Modal 在 `admin/users.tsx` 手写且无 focus 管理;Mutation 后一律 `window.location.reload()` 丢失 SPA 体验;核心功能 `MarkdownView` 是 TODO 桩(`components/MarkdownView.tsx:8`),话题/回复正文不渲染 Markdown;Emoji 当图标(`🔍 ✏️ ✉️ 👤`)跨平台渲染不一致且无 a11y。

`AGENTS.md` 技术栈明确写了 `shadcn/ui` 但实际未集成。这次一次性落地,把 UI 层从"手写裸 Tailwind + emoji"升级到"语义 token + 原子组件 + 表单 + Markdown + 受控状态",为后续所有页面迭代提供统一地基。

## What Changes

- **引入 shadcn/ui**:Tailwind-native 原子组件,复制源码进 `apps/web/app/components/ui/`,底层 Radix UI,零 runtime 依赖、零 Provider 包裹。替换所有手写交互组件。
- **BREAKING**: 扩展 `styles/global.css` 从 2 个 token 到完整语义层(primary/secondary/muted/accent/destructive/border/input/ring/card/popover/radius),采用 Tailwind v4 CSS-first `@theme` 配置。组件改用语义 class(`bg-background`/`text-foreground`),消除所有字面量色值(`#0d1117`/`#161b22`)和 `dark:` 双份写法。
- **新增原子组件库** `components/ui/`:Button、Input、Label、Card、Badge、Avatar、DropdownMenu、Dialog、Sheet、Tabs、Table、Tooltip、Skeleton、Sonner(吐司)、Form。
- **图标统一**:引入 lucide-react,替换全部 Emoji 图标(导航/状态/管理后台/主题切换/计数)。
- **BREAKING**: 引入 zustand 全局状态管理。新增 `useAuthStore`(user + unreadCount,跨路由共享,消除 `Layout.tsx` 每次导航拉 `/auth/me`)、`useThemeStore`(light/dark/system + persist + matchMedia listener)、`useUIStore`(mobileNav 等纯 UI 开关)。Mutation 后用 React Router v7 `useRevalidator().revalidate()` 替换 `window.location.reload()`。
- **表单标准化**:引入 react-hook-form + @hookform/resolvers + zod,复用 `packages/shared` 已有 Zod schemas。shadcn Form 组件统一登录/注册/发帖/回复编辑/设置/管理后台表单。
- **Markdown 渲染落地**:引入 react-markdown + remark-gfm + rehype-sanitize + rehype-highlight,重写 `MarkdownView`(当前是 TODO 桩)和 `MarkdownEditor` 预览分支。XSS 防护为硬性要求。
- **域组件重写**:`TopicListItem`/`ReplyItem`/`UserCard`/`Sidebar`/`Header`/`AdminLayout` 等用原子组件组合重写,移动端导航改用 Sheet。

## Capabilities

### New Capabilities

- `web-ui-theme`: Tailwind v4 CSS-first 语义 token 系统,完整 light/dark 配色,主题切换含 system 模式与 matchMedia 监听
- `web-ui-components`: shadcn/ui 原子组件层,域组件约定,图标统一用 lucide-react
- `web-ui-state`: zustand 全局状态(auth/theme/ui),mutation 后 revalidate 替换 reload 的约定
- `web-ui-forms`: react-hook-form + zod 表单标准,复用 shared schemas,统一错误提示与校验
- `web-ui-markdown`: Markdown 渲染与编辑器,含 GFM、XSS 防护、代码高亮、主题适配

### Modified Capabilities

(无 — 当前 `openspec/specs/` 下无现有 spec,均属新建)

## Impact

**代码**:

- `apps/web/app/styles/global.css` — 扩展为完整 token 系统
- `apps/web/app/components/` — 新增 `ui/` 子目录(原子组件),重写 11 个现有域组件
- `apps/web/app/routes/` — 全部 33 个 route 改用语义 class + 原子组件 + 表单组件 + revalidate
- `apps/web/app/root.tsx` — 引入 Sonner Toaster,保留 theme FOUC 防闪 inline script
- `apps/web/app/lib/` — 新增 stores 目录(`auth-store.ts`/`theme-store.ts`/`ui-store.ts`)

**依赖**(apps/web/package.json):

- 新增:`@radix-ui/*`(随 shadcn 按需)、`lucide-react`、`clsx`、`tailwind-merge`、`react-hook-form`、`@hookform/resolvers`、`sonner`、`zustand`、`react-markdown`、`remark-gfm`、`rehype-sanitize`、`rehype-highlight`
- 删除:无

**预算**(CF Workers bundle):

- 新增增量 < 150KB gz,在 Workers 10MB 预算内
- shadcn 复制源码不计 runtime 体积;@radix-ui 按需;react-markdown pipeline ~30KB gz;zustand ~3KB gz

**迁移参考**:对照 `nodeclub/views/`(EJS 模板)和 `egg-cnode/app/view/`(未完成)的视觉结构,但实现完全用新栈,不复用其 HTML/CSS。
