# Base registry 组件审查

审查日期：2026-08-02。仅执行预览，未应用 registry 输出、未安装依赖。

## 环境与方法

- 工作目录：`apps/web`
- 固定 CLI：`pnpm exec shadcn --version` -> `4.16.1`
- `pnpm exec shadcn info --json`：React Router、Tailwind CSS v4、`style: new-york`，但 legacy 配置被解析为 `base: radix`。
- `base-new-york` registry 不存在；为避免普通组件名回落到 Radix，本次显式审查 `https://ui.shadcn.com/r/styles/base-nova/<component>.json`。
- 每项均运行 `pnpm exec shadcn add "<URL>" --dry-run` 与 `pnpm exec shadcn add "<URL>" --diff`。`command` 的完整 diff 只显示 5/6 个文件，因此另运行 `--diff app/components/ui/command.tsx`。
- CNode 保留基线：语义 token、`bg-card`、`rounded-xl/2xl`、`border-cnode-green/*`、`shadow-card/floating/brand`、绿色 hover、统一 `h-9` 与 focus ring、中文无障碍文案，以及既有 Base UI `render`、overlay focus/Viewport 契约。

## select

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/select.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/select.json" --diff
```

- 结果：仅创建 `app/components/ui/select.tsx`；CLI 未提出新增包。源码使用现有 `@base-ui/react/select`、`lucide-react` 和 `~/lib/utils`，无 Radix、无无关覆盖。
- 必须保留/合并：将 registry 的 `h-8/h-7`、`rounded-lg`、透明背景、通用 `shadow-md/ring` 调整到 CNode 的 `h-9`、`rounded-xl`、`bg-card`、品牌边框/阴影与绿色 hover；保留 Base UI `Positioner/Popup`、`data-open/data-closed` 和错误/禁用语义。
- 结论：可作为手工品牌化基线，不可原样应用。

## native-select

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/native-select.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/native-select.json" --diff
```

- 结果：仅创建 `app/components/ui/native-select.tsx`；CLI 未提出新增包。源码仅使用原生 `select`、现有 `lucide-react` 和 utils，无 Radix、无无关覆盖。
- 必须保留/合并：默认 `w-fit h-8 rounded-lg bg-transparent` 与 CNode 表单的 `w-full h-9 rounded-xl bg-card shadow-sm`、绿色 hover 边框不同；后台紧凑 `sm` 密度应显式保留，`Canvas/CanvasText` 原生 option 配色可保留。
- 结论：可手工品牌化引入。

## textarea

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/textarea.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/textarea.json" --diff
```

- 结果：仅创建 `app/components/ui/textarea.tsx`；CLI 未提出新增包，仅使用 React 与 utils，无 Radix、无无关覆盖。
- 必须保留/合并：registry 为 `rounded-lg bg-transparent`、无品牌 hover/阴影；应与 CNode Input 的 `rounded-xl bg-card shadow-sm hover:border-cnode-green/35 focus-visible:ring-2` 对齐，并按场景保留合理最小高度与 resize 行为。
- 结论：可手工品牌化引入。

## alert-dialog

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/alert-dialog.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/alert-dialog.json" --diff
```

- 结果：创建 `app/components/ui/alert-dialog.tsx`，同时覆盖 `app/components/ui/button.tsx`；CLI 提出新增 `radix-ui`。AlertDialog 本体使用 `@base-ui/react/alert-dialog`，但嵌套 `button` 依赖按 legacy 配置解析为 Radix Slot/`asChild`。
- 拒绝项：重新引入 Radix；覆盖已经迁移到 Base UI 的 Button；删除 `inverse` variant 和 CNode 圆角、颜色、阴影、active/focus 差异。
- 必须保留/合并：现有 Dialog 的 `bg-cnode-ink/70`、品牌边框、`rounded-2xl`、`shadow-floating`、`100dvh` 可滚动 Viewport、safe-area/final-focus/pending close 契约；取消按钮作为安全默认焦点，只有最终确认使用 destructive。
- 结论：拒绝直接应用，后续只手工摘取 Base AlertDialog anatomy。

## alert

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/alert.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/alert.json" --diff
```

- 结果：仅创建 `app/components/ui/alert.tsx`；CLI 未提出新增包，使用现有 CVA 和 utils，无 Radix、无无关覆盖。
- 必须保留/合并：registry 的紧凑 `rounded-lg border bg-card` 需映射 CNode 的 `rounded-xl`、品牌边框/状态 surface；不能让所有信息都固定为打断式 `role="alert"`，普通说明、pending/success 应允许 `status`，错误才使用 `alert`。
- 结论：结构可用，但需品牌化并修正播报接口后引入。

## pagination

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/pagination.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/pagination.json" --diff
```

- 结果：创建 `app/components/ui/pagination.tsx`，同时覆盖 `app/components/ui/button.tsx`；CLI 提出新增 `radix-ui`。
- 拒绝项：嵌套 Button 回落到 Radix Slot/`asChild` 并覆盖品牌 Button。生成的 Pagination 又向 Button 传入 Base API `nativeButton={false}` 和 `render`，与同次预览生成的 Radix Button 接口不一致。
- 必须保留/合并：领域 `app/components/Pagination.tsx` 继续拥有 URL/query 生成；UI primitive 保留中文“上一页/下一页”、`aria-current="page"`、不可用状态、窄屏无溢出，以及 CNode `rounded-xl`、`bg-card`、品牌 active/hover 样式。
- 结论：拒绝直接应用；手工组合现有 Base Button，禁止覆盖领域 Pagination。

## empty

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/empty.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/empty.json" --diff
```

- 结果：仅创建 `app/components/ui/empty.tsx`；CLI 未提出新增包，使用现有 CVA 和 utils，无 Radix、无无关覆盖。
- 必须保留/合并：registry 的中性 `rounded-xl`、小号 muted icon 未体现 CNode 绿色 surface/边框；按页面保留品牌 Empty 容器、中文标题/说明及清除筛选、返回列表或创建入口。registry 根节点只有 `border-dashed` 而无 `border`，不能假定会显示边框。
- 结论：可作为组合结构，需品牌化后引入。

## command

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/command.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/command.json" --diff
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/command.json" --diff app/components/ui/command.tsx
```

- 结果：创建 `textarea.tsx`、`input-group.tsx`、`command.tsx`；覆盖 `dialog.tsx`、`button.tsx`、`input.tsx`；CLI 提出新增 `cmdk` 与 `radix-ui`。
- 拒绝项：Dialog 被改回 Radix `data-state/asChild`，丢失 Base Backdrop/Viewport/Popup、focus restore 和 pending close；Button 回到 Radix Slot；Input 丢失 CNode 圆角、card 背景、绿色 hover 和阴影。以上均为任务外覆盖，且 `radix-ui` 不允许重新引入。
- 必须保留/合并：`cmdk` 是允许保留的非 Radix command 引擎，但应单独评估安装；保留现有 CommandPalette 的中文标题/说明/关闭文案、`border-cnode-green/20`、`shadow-floating`、权限过滤和 final focus。补齐方向键/Enter/Escape、空结果、移动端 `100dvh`/safe-area/overscroll，不直接采用默认英文文案和 `max-h-72`。
- 结论：拒绝整个 registry 变更集；后续仅手工摘取 `command.tsx`/必要 InputGroup 结构并复用现有 Base Dialog、Button、Input、Textarea。

## radio-group

```bash
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/radio-group.json" --dry-run
pnpm exec shadcn add "https://ui.shadcn.com/r/styles/base-nova/radio-group.json" --diff
```

- 结果：仅创建 `app/components/ui/radio-group.tsx`；CLI 未提出新增包。源码使用现有 `@base-ui/react/radio`、`@base-ui/react/radio-group` 和 utils，无 Radix、无无关覆盖。
- 必须保留/合并：保留 Base `data-checked`、disabled、invalid 与方向键行为；focus、边框和选中颜色需与 CNode token 对齐。组名和每项可见 Label 由消费方提供，不能只渲染无名称圆点。
- 结论：可手工品牌化引入。

## 总结与阻塞

- 可进入后续手工品牌化：`select`、`native-select`、`textarea`、`alert`、`empty`、`radio-group`。
- 必须拒绝当前完整输出：`alert-dialog`、`pagination`、`command`，因为会新增 `radix-ui` 并覆盖无关或已迁移的品牌组件。
- 阻塞根因：legacy `components.json` 被 CLI 解析为 `base: radix`；即使顶层使用显式 `base-nova` URL，未限定地址的嵌套 registry dependency 仍按 Radix style 解析。后续实现必须逐文件手工合并，不能直接运行无预览的 `add`。
- `command` 另需决定是否在后续实现任务中显式加入 `cmdk`；本次未安装任何依赖。
