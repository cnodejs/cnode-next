## Why

`apps/web` 已采用 shadcn/ui 源码所有权模式，但现有 wrapper 仍分散依赖 8 个 Radix packages，并混用 `asChild`、`data-state`、overlay 和菜单事件契约；基础组件版本、语义 token、表单关联、危险操作确认、导航状态和页面组合也存在系统性漂移。需要先把源码层迁移到 Base UI 并锁定统一契约，再按独立 capability 收束前台与后台交互，避免继续复制两套 primitive 行为和不一致页面控件。

## What Changes

- 明确 `components.json` 与 `apps/web/app/components/ui/` 为现有 shadcn/ui 源码层，将 Button、Form、Avatar、Checkbox、Tabs、Dialog、Sheet、Tooltip 和 DropdownMenu 从 Radix 迁移到 Base UI，并建立通过 CLI `--dry-run`、`--diff` 引入或更新单个 Base registry component 的治理方式。
- 将 `asChild` 组合迁移为 Base UI `render`，将菜单事件、positioner、状态属性和受控 overlay 焦点恢复迁移到 Base UI 契约；最终移除 Web 直接 Radix 依赖和源码 import。
- 修复亮暗主题下的语义颜色对比度、缺失动画支持、focus、reduced motion、Dialog/Sheet 滚动与移动端 safe area 等共享基础行为，并使用 Base UI open/closed/starting/ending 状态驱动动画。
- 增加并品牌化 `Select`、`NativeSelect`、`Textarea`、`AlertDialog`、`Alert`、`Pagination`、`Empty`、`Command`、`RadioGroup` 等必要 primitives；不执行 `add --all` 或整体覆盖现有组件。
- 前台发布与编辑话题的分类使用 shadcn `Select`；后台 GET 筛选和高密度简单筛选使用 `NativeSelect`。补齐 Label 关联、autocomplete、字段错误和异步状态播报。
- 将话题详情的置顶、高亮和删除收进单一“管理”菜单；作者编辑保持直接可见，管理员编辑他人话题进入管理菜单，举报继续作为普通登录用户动作，删除保留二次确认。
- 统一后台 block/mute、删除、批量治理等高风险操作的确认或可撤销策略，不改变既有后端权限和审计语义。
- 为公共与后台 shell 增加 skip link、正确 heading、`aria-current`、URL-backed tabs；将 CommandPalette 改为可用方向键操作的 command interface，并修复 SSR render 阶段读取浏览器状态的问题。
- 增加共享组件、权限矩阵、键盘、移动端、亮暗主题、SSR/hydration 和危险操作回归测试。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `web-ui-components`: 完成 shadcn 源码治理、Radix 到 Base UI 的全 Web primitive 迁移、必要 primitives、语义 token、动画、overlay、Pagination 和 Empty 组件约束。
- `web-ui-forms`: 规定 `Select`/`NativeSelect` 使用边界、Label 关联、Textarea、autocomplete、字段错误与选择组语义。
- `web-ui-theme`: 修复主题对比度、浏览器 color scheme/theme color 与 reduced motion 行为。
- `web-ui-state`: 约束 URL-backed UI、SSR/hydration 安全和未保存编辑状态。
- `navigation-shell`: 为公共与后台 shell 增加 skip navigation、active state 和移动端安全布局。
- `feedback-command-system`: 将 CommandPalette 与异步反馈收束为可访问的 command/live-region 模型。
- `topic-detail-experience`: 重组普通动作、作者编辑和管理员/版主管理菜单的视觉与交互层级。
- `admin-dashboard`: 统一后台高风险与批量治理动作的确认、反馈和上下文保留。
- `user-management`: 为后台 block/mute 等独立用户治理动作增加与风险相称的确认要求。

## Impact

**In scope**：`apps/web/components.json`、Web 依赖与 lockfile、`apps/web/app/components/ui/`、所有受 primitive API 影响的消费者、全局 CSS/theme、公共与后台 Layout、CommandPalette、Pagination、表单与筛选控件、发布/编辑话题、话题详情管理动作及后台治理入口；对应迁移报告、Web 测试与 OpenSpec specs。

**Out of scope / Non-goals**：不重新设计 CNode 品牌；不使用 `add --all` 或整体覆盖现有 shadcn 源码；不为迁移保留长期 Radix 兼容层；不修改 API、后端权限、审计、PostgreSQL schema 或数据；不在本次处理全部低优先级文案、图片尺寸和大列表虚拟化；不恢复 `../nodeclub/` 的 EJS 控件外观，只保留其内容治理权限与动作语义作为参考。

**Affected systems**：React Router SSR、Vite、Tailwind CSS v4、shadcn/Base UI primitives、主题初始化、前后台表单和 mutation 反馈。高风险类别为 composition API、菜单和 overlay/focus 行为、共享颜色 token 的全站影响、SSR hydration、危险操作确认和角色权限下的入口可见性。

## Documentation Impact

更新 OpenSpec 中 UI 组件、表单、主题、状态、导航和治理交互要求。同步 `docs/development.md` 或 `docs/conventions.md` 中的 shadcn/Base UI 精确版本、registry 审查、`render` 组合和禁止整体覆盖约定；`wiki/` 不记录前端组件实现细节，无需更新。
