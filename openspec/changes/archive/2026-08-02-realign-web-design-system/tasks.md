## 1. 基线与审计准备

- [x] 1.1 记录 commit `b81d012` 的 primitive、theme、公共页面和后台页面截图基线及可回滚说明
- [x] 1.2 生成 `components/ui/` 已安装组件、直接消费者、视觉 `className` 覆写和 raw CNode color 使用清单
- [x] 1.3 建立 feed、reading、compose、account、directory、dashboard、data-list、workflow 的 route 映射表
- [x] 1.4 确认锁定 shadcn CLI 与 `@base-ui/react` 版本可读取 `base-nova` registry，并记录每个目标 primitive 的 dry-run/diff 命令
- [x] 1.5 在隔离目录生成同版本 Base Nova 组件基线，保存文件清单和允许的 alias/composition 差异

## 2. Base Nova 原子组件基线

- [x] 2.1 将 `apps/web/components.json` 迁移为 `base-nova` 并验证 shadcn info 不再报告 Radix `new-york`
- [x] 2.2 对齐 Button、Input、Textarea、Label、NativeSelect 和 Checkbox 到 Base Nova，移除 CNode variant 与视觉定制
- [x] 2.3 对齐 Select、RadioGroup、Tabs、Toggle/ToggleGroup 和相关 group composition 到 Base Nova
- [x] 2.4 对齐 Card family，补齐 `size`、CardAction 和 `--card-spacing`，删除旧 hard-coded spacing API
- [x] 2.5 对齐 Badge、Alert、Empty、Skeleton、Separator、Item 和 feedback primitives 到 Base Nova
- [x] 2.6 对齐 Table/Data Table、Pagination、Command 和 DropdownMenu 到 Base Nova
- [x] 2.7 对齐 Dialog、AlertDialog、Sheet、Tooltip 和 overlay structure，验证 Base UI 状态 selector、scroll lock、safe-area 与 final focus
- [x] 2.8 引入并对齐 Base Nova Field、FieldGroup、FieldSet、InputGroup、Sidebar 及其必要依赖
- [x] 2.9 清理 primitive 中的 `cnode-*`、`surface-*`、品牌 shadow、项目专属 variant、Radix state 和手工 icon 尺寸
- [x] 2.10 更新 primitive 行为测试，覆盖 render composition、ARIA、keyboard、disabled、invalid、overlay focus 和 SSR

## 3. CNode Semantic Theme

- [x] 3.1 以用户提供的 Base theme token inventory 和锁定 Base Nova 输出建立 core、sidebar、chart、radius 的结构基线
- [x] 3.2 建立现有 CNode 色值到 OKLCH core、sidebar、chart 和 exceptional brand roles 的 light/dark 映射表
- [x] 3.3 在 `global.css` 中实现 Base Nova core semantic tokens，并保持 surface/foreground 配对、dark alpha 边界、theme-color、color-scheme 与 system theme 同步
- [x] 3.4 增加可辨识的 `sidebar-*` 与 `chart-*` light/dark tokens，移除示例无关蓝色和无法区分系列的单色 chart 值
- [x] 3.5 采用锁定 Base Nova preset 的 radius 基线，删除 route/primitive 的独立圆角补偿
- [x] 3.6 删除 `@theme` 暴露的 raw `cnode-*` utilities，仅保留无法由标准角色表达的最小 brand tokens
- [x] 3.7 按 selected、muted、info、navigation、marketing 用途迁移共享组件中的 raw CNode color，不执行机械字符串替换
- [x] 3.8 校验正文、muted text、controls、focus、destructive、sidebar 和 chart tokens 在 light/dark 下的对比度
- [x] 3.9 更新 theme token、FOUC、system mode 和 reduced-motion 测试

## 4. Application Blocks 与表单体系

- [x] 4.1 建立统一 PageHeader/Breadcrumb/Action composition，区分普通应用标题与少量品牌 marketing Hero
- [x] 4.2 建立 feed、reading、compose、account 和 directory 的 shell/content-width blocks
- [x] 4.3 建立共享后台 shell、navigation model、容器内 desktop navigation Card 和 mobile Sheet
- [x] 4.4 建立 dashboard、data-list 和 workflow 的 page header、filter、toolbar、record、pagination composition
- [x] 4.5 将 AdminPanel/AdminToolbar 的职责迁移到 Card、CardAction、Card spacing 和标准 application blocks
- [x] 4.6 建立 FieldGroup、Field、FieldSet 和 InputGroup 的 React Hook Form 集成示例与错误状态基线
- [x] 4.7 迁移 account 代表性表单，验证 label、autocomplete、invalid、pending 和 mobile orientation
- [x] 4.8 迁移 compose 代表性表单，验证 Select、Markdown editor、Turnstile 和 action footer composition
- [x] 4.9 迁移后台 GET filters 与内联编辑基线，保持 NativeSelect、URL state 和紧凑标准尺寸
- [x] 4.10 增加 application blocks 和 Field composition 的结构/可访问性测试

## 5. Markdown Typeset

- [x] 5.1 从 `https://ui.shadcn.com/typeset.css` 下载上游文件到 `apps/web/app/styles/typeset.css`，并在 Tailwind import 后导入
- [x] 5.2 安装并导入 `@fontsource-variable/roboto`，定义 `--font-roboto: 'Roboto Variable', sans-serif`
- [x] 5.3 定义唯一 `.typeset-docs` preset，设置 Roboto body/heading/mono、14px size、1.75 leading 和 1.25em flow
- [x] 5.4 复核 Markdown/rich-content 候选清单，确认 MarkdownView 是唯一应用入口且 Swagger UI/About 不纳入 Typeset
- [x] 5.5 将全部 MarkdownView 根容器改为 `typeset typeset-docs`，保持 sanitize 与 highlight pipeline
- [x] 5.6 让 MarkdownEditor preview/split 复用相同 MarkdownView 和 `.typeset-docs`，不增加编辑器专属 typography
- [x] 5.7 清理与 Typeset 冲突的 `.markdown-body` element styles，仅保留 Typeset 未覆盖的最小 syntax highlight 规则
- [x] 5.8 修复 unordered、ordered、nested、mixed、task 和 loose list 的 marker、序号、缩进与 block spacing
- [x] 5.9 处理列表内 paragraph、blockquote、code、wide table、image、长 URL 和中英文混排的响应式边界
- [x] 5.10 为不应继承正文样式的嵌入组件增加 `not-typeset` 或 `data-not-typeset` 隔离
- [x] 5.11 将 split view 限制在有足够内容宽度的断点，375px 与 768px 使用 edit/preview 切换
- [x] 5.12 增加固定 Markdown fixture 与 renderer/editor 测试，覆盖 light/dark、复杂列表和预览/最终一致性

## 6. 公共页面原型迁移

- [x] 6.1 迁移首页和 TopicList 到 feed 原型，统一 header、filter/tabs、list item、sidebar 与 pagination composition
- [x] 6.2 迁移 search、stars、collections、user topics/replies 到 feed/directory 原型并统一 empty/error/loading 状态
- [x] 6.3 迁移 topic detail 到 reading 原型，统一正文、TOC、context rail、actions、reply list 和 editor spacing
- [x] 6.4 迁移 topic/reply create/edit 到 compose 原型，移除页面级 Card/Input/Button 视觉覆写
- [x] 6.5 迁移 signin、signup、GitHub auth、password recovery 和 setting 到 account 原型及 Field family
- [x] 6.6 迁移 user profile、top users、jobs 和相关资源页面到 directory 原型及标准 Item/Card grid
- [x] 6.7 迁移 about、API 和 Footer 内容 block，保留必要品牌语义并移除普通 surface 的 raw CNode class
- [x] 6.8 审计公共 Header、mobile menu、CommandPalette、Sheet 和 overlay 在四个 viewport 的导航、focus 与 safe-area
- [x] 6.9 清理公共 route 中的 `space-y-*`、primitive visual class、手写 Badge/Alert/Empty 和无语义 Card
- [x] 6.10 更新公共页面行为与结构测试，确认业务动作、URL、权限和 SSR 结果不变

## 7. 后台页面原型迁移

- [x] 7.1 迁移 `/admin` 到 dashboard 原型，只展示真实摘要、列表和有数据来源的 chart
- [x] 7.2 迁移 `/admin/users` 与 `/admin/bans` 到 data-list 原型，统一 filters、Table/Item、status、actions 和 pagination
- [x] 7.3 迁移 `/admin/topics` 到 data-list 原型，统一多维筛选、指标、批量操作和高密度表格
- [x] 7.4 迁移 `/admin/tabs`、`/admin/zones` 和 `/admin/keywords` 到紧凑 data-list/inline-edit composition
- [x] 7.5 迁移 `/admin/reports` 与 `/admin/moderation` 到 workflow 原型，统一 queue summary、records 和 destructive actions
- [x] 7.6 迁移 `/admin/audit` 到 responsive workflow/event composition，不让横向表格成为移动端主要体验
- [x] 7.7 迁移 `/admin/settings` 到 FieldGroup/FieldSet 表单 composition，并限制宽屏输入 measure
- [x] 7.8 为每个后台 data-list 决定 responsive Item 或 scrollable Table，并记录关键字段和操作优先级
- [x] 7.9 清理后台 route 中的固定 primitive 高度、Card padding、raw CNode color、重复 surface 和手写 status block
- [x] 7.10 更新后台导航、URL filters、权限、确认对话框和 mutation 反馈测试

## 8. 防漂移门禁与视觉验收

- [x] 8.1 增加检查 `components.json` Base Nova 基线和 primitive 禁止 CNode/legacy/Radix 样式的静态门禁
- [x] 8.2 增加检查 route raw color、`space-y-*`、primitive 视觉 class 覆写和手写已有语义组件的静态门禁与窄白名单
- [x] 8.3 使用 Playwright MCP 建立可重复的浏览器视觉证据流程，冻结时间、动画和 fixture 数据
- [x] 8.4 为八个页面原型建立 375px、768px、1280px、1440px 的 light/dark 代表性视觉 baseline
- [x] 8.5 覆盖 default、focus、selected、disabled、pending、error、empty、long-content 和 overlay 中适用的关键状态
- [x] 8.6 审计除明确 Table/code scroll container 外的 viewport 水平溢出和主要操作可达性
- [x] 8.7 运行 primitive、route、SSR、accessibility 和 Playwright MCP visual audit，并为每个 baseline 更新记录设计原因

## 9. 文档与发布准备

- [x] 9.1 新增 `docs/design-system.md`，记录 Base Nova、semantic theme、组件选择、spacing/size、页面原型、responsive 和 Markdown 规则
- [x] 9.2 更新 `docs/conventions.md`，删除保留 legacy `new-york`/CNode primitive 定制的旧规则并链接设计系统文档
- [x] 9.3 复核 proposal、specs、design Mermaid 图和实际实现一致，确认无需同步 `wiki/` 且数据库审计仍为无变更
- [x] 9.4 运行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 和 OpenSpec strict validation
- [x] 9.5 按 agent-owned UI acceptance route matrix 完成真实浏览器 smoke，记录 viewport、theme、console、a11y 和 residual risks
- [x] 9.6 运行 `pnpm verify`，确认 secrets、OpenSpec、构建和全部 release gates 通过后再标记 tasks 完成

## 10. Corrective visual review

- [x] 10.1 将首页恢复为说明型 Hero，并统一 compact/marketing PageHeader 的品牌 surface anatomy
- [x] 10.2 重组 About 内容层级，移除重复 PageHeader 与无结构 Card 矩阵
- [x] 10.3 修复招聘筛选宽度、Footer CTA 对比度与用户设置 horizontal Field
- [x] 10.4 恢复后台顶部栏与容器内导航布局，并建立 desktop navigation Card 与完整 PageHeader 的单一顶部基线
- [x] 10.5 修复审计记录长目标/detail 的 Item 内容溢出
- [x] 10.6 修复首页满宽左对齐 Tabs、TopicList metadata icon，以及 topic/reply reading header、metadata 与 actions 分组
- [x] 10.7 重跑 Web tests、四 viewport 浏览器复核和 `pnpm verify`
- [x] 10.8 将首页 rail 首卡改为社区合作入口，并让积分榜紧邻最新回复
- [x] 10.9 删除隐藏的 `/app/download` route，将第三方客户端说明与链接并入 About
- [x] 10.10 统一非首页 numbered pagination 的五页窗口、筛选 query、测试和响应式验收
- [x] 10.11 修复审计 filters/records 视觉叠压并复核后台左右栏顶部基线
