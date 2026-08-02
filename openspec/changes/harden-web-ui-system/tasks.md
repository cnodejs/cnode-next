## 1. MVP：shadcn 4、Base UI 迁移与主题基础

- [x] 1.1 锁定兼容 React 19、Tailwind CSS v4 和 React Router SSR 的 shadcn 4、Vite 7 与 `@base-ui/react` 精确版本，修复 `shadcn info` 的 Zod/MCP 解析失败，并记录 legacy `new-york` 到 Base registry 的引入策略。
- [x] 1.2 为现有 Radix 行为建立迁移基线测试，覆盖 Button/Link 组合、菜单指针与键盘动作、受控 overlay 关闭与焦点归还、Checkbox 表单行为、Tabs 激活和 SSR 首屏结构。
- [x] 1.3 将 Label 改为原生语义，将 Button 与 FormControl 从 Radix Slot/`asChild` 迁移到 Base UI `render` 契约，并迁移全部消费者且不产生嵌套交互元素。
- [x] 1.4 将 Avatar、Checkbox 和 Tabs wrapper 及消费者迁移到 Base UI，映射 checked/active 状态并明确保留或调整 Tabs `activateOnFocus` 行为。
- [x] 1.5 将 Dialog 和 Sheet wrapper 及消费者迁移到 Base UI Backdrop/Viewport/Popup 结构，统一 modal、滚动锁定、pending close cancellation 和 trigger/final focus 恢复。
- [x] 1.6 将 Tooltip 和 DropdownMenu wrapper 及消费者迁移到 Base UI Positioner/Popup/Menu 契约，将菜单链接改为 LinkItem、`onSelect` 改为 `onClick`，并验证 submenu、disabled、键盘和焦点行为。
- [x] 1.7 移除 Web 源码中的 `@radix-ui/*`、`radix-ui`、`asChild`、失效 `data-[state]`/`--radix-*` 使用和 Web 直接 Radix dependencies；保留 cmdk、sonner 等非 Radix 库并生成逐组件 `.migration/*.md` 报告。
- [x] 1.8 在 Base UI 底座下分别对 `select`、`native-select`、`textarea`、`alert-dialog`、`alert`、`pagination`、`empty`、`command`、`radio-group` 执行 registry `--dry-run`/`--diff` 审查，记录依赖、目标文件和必须保留的 CNode 品牌差异，拒绝重新引入 Radix 或覆盖无关文件。
- [x] 1.9 重构 light/dark 语义 token，消除 `text-cnode-ink` 等暗色低对比组合，为正文、链接、muted、状态、边框和 focus 建立可验证的 WCAG AA 配对。
- [x] 1.10 让主题初始化、`color-scheme` 和 `theme-color` 在 light/dark/system 下同步，确保 SSR 首屏不读取浏览器 API 且 system 主题变化可实时反映。
- [x] 1.11 接入 Tailwind CSS v4 兼容的动画支持，以 Base UI open/closed/starting/ending 状态驱动 overlay，移除共享组件中的 `transition-all`，并为 CSS 动画、平滑滚动和程序化滚动增加 reduced-motion 降级。

## 2. MVP：共享 UI primitives

- [x] 2.1 基于 Base UI 引入并品牌化 `Select`，同时引入 `NativeSelect` 和 `Textarea`，统一高度、Label/description/error 关联、disabled、focus 和前后台密度行为。
- [x] 2.2 基于 Base UI 引入并品牌化 `AlertDialog`，同时引入 `Alert`，定义安全默认焦点、destructive 最终确认、pending 禁止关闭以及 status/alert 播报行为。
- [x] 2.3 引入并品牌化 `Pagination` 和 `Empty`，让领域 Pagination 保留 URL 生成职责，同时提供 nav、`aria-current`、不可用状态和筛选空结果恢复入口。
- [x] 2.4 引入并品牌化 `Command` 和 Base UI `RadioGroup`，覆盖方向键/Enter/Escape、焦点归还、空结果、组名和单选状态语义。
- [x] 2.5 统一 Base UI Dialog、AlertDialog、Sheet、DropdownMenu 和 Command overlay 的 Backdrop/Viewport/Positioner/Popup、滚动锁定、移动端 max-height、overscroll containment、`100dvh`、safe-area 和 final focus 默认值。
- [x] 2.6 增加共享 primitive 测试，覆盖亮暗主题 class、Base 状态属性、键盘、focus、disabled/pending、reduced motion、长 overlay、移动端安全区域及迁移前后行为等价性。

## 3. MVP：表单与编辑状态

- [x] 3.1 将发布话题和编辑话题的分类改为 shadcn `Select`，关联可见 Label，并覆盖当前分类、键盘选择、招聘分类可用/禁用说明及提交值测试。
- [x] 3.2 将后台 topics、audit、reports 等 GET/高密度简单筛选迁移到 `NativeSelect`，补齐 id/Label 或 accessible name，并保证 URL、返回、刷新和分页恢复状态。
- [x] 3.3 将签名、举报说明和后台普通多行字段迁移到 `Textarea`；保留 MarkdownEditor 领域封装并为其 textarea 增加 focus-within 与可见焦点。
- [ ] 3.4 补齐登录、注册、找回/重置密码、设置和招聘表单的 Label、name、type、autocomplete、spellcheck、字段错误关联及首个错误定位。
- [ ] 3.5 为 Turnstile、上传、搜索和表单 mutation 增加可见且可播报的 pending/success/error 状态，防止重复提交并保留失败时输入。
- [ ] 3.6 为话题创建、话题编辑和回复编辑增加 dirty state、站内导航阻断与浏览器离页提示，并验证保存成功或显式放弃后解除保护。

## 4. Feature-complete：Shell、命令与 URL 状态

- [ ] 4.1 为公共和后台 Layout 增加首个可聚焦 skip link、唯一 main target 与稳定 focus，修复 AuthShell 移动端一级标题和 Card section heading 层级。
- [ ] 4.2 为公共导航、后台导航、用户 tabs 和分页增加可见 active state 与 `aria-current`，确保 query 参数变化不破坏当前路由识别。
- [ ] 4.3 将后台 bans/settings 等可分享 tabs 与列表筛选状态写入 URL，保证刷新、复制链接和浏览器前进/后退恢复同一视图。
- [ ] 4.4 移除 `zone.jobs` 等 SSR render 阶段的 `window`/viewport 读取，由 loader URL 或确定默认值生成首屏，并增加 hydration 一致性测试。
- [ ] 4.5 使用 `Command` 重构 CommandPalette 的输入、结果、空状态和关闭控件，覆盖权限过滤、方向键选择、Enter 导航、Escape 和焦点归还。
- [ ] 4.6 将共享 Pagination 与 Empty 迁移到首页以外的数字分页、搜索、用户聚合和后台空结果场景，验证窄屏无横向溢出且筛选参数不丢失。

## 5. Feature-complete：话题动作层级

- [ ] 5.1 建立匿名、普通用户、作者、版主、管理员及角色叠加的 topic action presentation helper，并用表格驱动测试锁定既有权限矩阵。
- [ ] 5.2 重组 TopicActions：收藏/查看回复保持普通动作，举报不进入治理菜单，作者编辑直接可见，管理员编辑他人及置顶/高亮/删除收进单一“管理”菜单。
- [ ] 5.3 将删除帖子改为 `AlertDialog`，明确目标和影响，pending 时阻止重复提交/关闭，并让取消恢复焦点、失败保留状态、成功遵循既有删除后路由。
- [ ] 5.4 增加桌面与移动端话题动作测试，覆盖置顶/取消、高亮/取消、管理菜单键盘操作、safe area、async feedback 和非授权入口不可见。

## 6. Feature-complete：后台与用户治理确认

- [ ] 6.1 盘点后台 topics、mod、keywords、bans、reports、users 的单项/批量 mutation，按不可逆、高影响、可逆三类建立确认矩阵；无可靠 undo 的动作统一要求事前确认。
- [ ] 6.2 将软删除、真实删除、批量删除、确认违规删除、敏感词/IP 规则删除等破坏性动作迁移到 `AlertDialog`，显示目标或数量并区分软删除与物理删除后果。
- [ ] 6.3 为后台 block/unblock、mute/unmute、角色变更、密码重置和删除所有发言增加独立确认文案，确保 block 与 mute 不互相推导且恢复动作名称准确。
- [ ] 6.4 统一后台单项与批量动作的 pending、partial success、error 和可播报反馈，防止重复提交并保留失败对象的可识别/重试范围。
- [ ] 6.5 让用户与内容治理完成后保留 URL 中的 tab、搜索、筛选、排序和分页；删除当前页最后一项时回到最近有效页或明确空状态。
- [ ] 6.6 增加后台和公开用户页治理测试，覆盖取消不发请求、目标/数量文案、安全默认焦点、partial failure、上下文保留和后端 403 反馈。

## 7. 验证与归档准备

- [ ] 7.1 对代表性公共、认证、创作、话题、用户和后台页面执行键盘/焦点/landmark/Label/live-region 自动化检查，并补充缺失回归测试。
- [ ] 7.2 在 light、dark、system、reduced-motion、375px 移动端和大桌面下检查 token 对比度、overlay、Select、Command、分页、safe area 与无横向溢出。
- [ ] 7.3 更新 `docs/development.md` 或 `docs/conventions.md` 中的 shadcn/Base UI 精确版本、legacy style 迁移、`render` 组合、registry dry-run/diff 和禁止整体覆盖约定；确认 `wiki/` 无需同步。
- [ ] 7.4 运行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm verify` 和 `openspec validate harden-web-ui-system --type change --strict --no-interactive`。
- [ ] 7.5 对照 proposal、design、9 份 delta specs 与实现检查 diagram/权限矩阵/Select 边界一致性，确认 `apps/web` 无 Radix import、直接依赖、`asChild` 和失效状态属性，确认 git diff 不含 API、后端权限、数据库 schema、migration、seed 或数据变更并达到归档条件。
