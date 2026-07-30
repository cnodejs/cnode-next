# web-ui-components Specification

## Purpose

定义 Web UI 原子组件、shadcn/ui 组件源码、按钮变体、菜单、Dialog、领域组件组合、图标和 toast 反馈的统一使用要求。
## Requirements
### Requirement: shadcn/ui 原子组件层

`apps/web/app/components/ui/` SHALL 包含以下 shadcn/ui 原子组件,源码复制进来(非 npm 依赖):`button`、`input`、`label`、`card`、`badge`、`avatar`、`dropdown-menu`、`dialog`、`sheet`、`tabs`、`table`、`tooltip`、`skeleton`、`sonner`、`form`。每个组件 MUST 用 `cn()` 工具合并 class,且引用语义 token(如 `bg-background`)。

#### Scenario: 新建页面使用原子组件

- **WHEN** 开发者在 `routes/` 下新建页面
- **THEN** 页面内的按钮、输入框、卡片等 MUST 从 `~/components/ui/` 导入,不得手写 `<button className="bg-blue-600 ...">` 等裸 Tailwind 字符串

#### Scenario: 组件源码进仓库

- **WHEN** 查看 `apps/web/app/components/ui/`
- **THEN** 存在 `button.tsx`、`input.tsx` 等 15 个文件,每个文件是完整的组件源码(非 re-export)

### Requirement: Button 变体覆盖现有用法

Button 组件 MUST 支持 `variants`: `default`(主蓝)、`secondary`、`destructive`、`outline`、`ghost`、`link`,且支持 `size`: `default`、`sm`、`lg`、`icon`。现有所有 `bg-blue-600 text-white hover:bg-blue-700` 按钮统一替换为 `<Button>`,`border border-gray-300` 按钮替换为 `<Button variant="outline">`。

#### Scenario: 主按钮替换

- **WHEN** 渲染登录表单的提交按钮
- **THEN** 使用 `<Button>` 默认 variant,不再是 `<button className="bg-blue-600 ...">`

#### Scenario: 次级按钮替换

- **WHEN** 渲染取消按钮
- **THEN** 使用 `<Button variant="outline">`,不再是 `<button className="border border-gray-300 ...">`

### Requirement: DropdownMenu 修复 outside-click

用户头像菜单 MUST 用 `DropdownMenu` 组件,自动处理 outside-click 关闭、Escape 关闭、focus trap。现状 `Layout.tsx:93` 手写的 `<button onClick={() => setDropdownOpen(!dropdownOpen)}>` MUST 被删除。

#### Scenario: 点击菜单外区域关闭

- **WHEN** 菜单打开且用户点击菜单外任意位置
- **THEN** 菜单立即关闭,无需额外点击

#### Scenario: Escape 关闭并归还焦点

- **WHEN** 菜单打开且按 Escape
- **THEN** 菜单关闭且焦点回到触发按钮

### Requirement: Dialog 替换手写 Modal

现状 `admin/users.tsx:71` 手写的 `<div className="fixed inset-0 bg-black/50 ...">` Modal MUST 用 `Dialog` 组件替换,获得 focus trap、Escape 关闭、滚动锁定、a11y(role/aria-modal)。

#### Scenario: Dialog 打开时焦点被捕获

- **WHEN** 重置密码 Dialog 打开
- **THEN** Tab 键在 Dialog 内循环,不跳到背景元素

### Requirement: 域组件用原子组合重写

`TopicListItem`、`ReplyItem`、`UserCard`、`Sidebar`、`Header`、`AdminLayout` MUST 用 `Avatar`/`Badge`/`Card`/`Button`/`Link` 等原子组件组合而成,不再写裸 `<img className="w-10 h-10 rounded-full">` 或裸 `<span className="bg-blue-100 ...">`。

#### Scenario: 头像统一用 Avatar

- **WHEN** 渲染话题列表项的作者头像
- **THEN** 使用 `<Avatar>` 组件,而非裸 `<img>`

### Requirement: TagBadge 与 StatusBadge 统一到 Badge 变体

`TagBadge` 和 `StatusBadge` MUST 改为调用 shadcn `Badge` 组件,通过 `variant` 区分(`secondary`/`default`/`destructive`/`outline`),或通过 `className` 传语义 token,不再各自手写颜色 map。

#### Scenario: 问答标签

- **WHEN** 渲染 `tab=ask` 的 TagBadge
- **THEN** 输出为 `<Badge variant="secondary">问答</Badge>`,不再有 `bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300` 字符串

### Requirement: 图标统一用 lucide-react

`apps/web/app/` 下所有 `.tsx` 文件 MUST NOT 在 JSX 文本节点中使用 Emoji 表情字符作为功能图标(如 `🔍`、`✏️`、`✉️`、`👤`、`🌙`、`☀️`、`🖥️`、`📋`、`👁`、`💬`、`⭐`、`🚩`、`👍`、`📊`、`📝`、`🔍`、`👤`、`🚫`、`🚩`、`📛`、`📋`、`⚙️`)。MUST 改用 `lucide-react` 对应图标组件。

#### Scenario: 主题切换用 lucide 图标

- **WHEN** 渲染 ThemeToggle
- **THEN** 使用 `<Sun>`/`<Moon>`/`<Monitor>` 图标,不再用 `☀️`/`🌙`/`🖥️`

#### Scenario: 管理后台导航用 lucide 图标

- **WHEN** 渲染 AdminLayout 侧边栏
- **THEN** 使用 `<LayoutDashboard>`/`<FileText>`/`<Search>`/`<Users>`/`<Ban>`/`<Flag>`/`<BadgeAlert>`/`<ScrollText>`/`<Settings>`,不再用 emoji

### Requirement: Toast 通知替换 alert()

所有 `alert()` 调用 MUST 替换为 `sonner` 的 `toast.success()`/`toast.error()`/`toast()`。`root.tsx` MUST 引入 `<Toaster />` 一次。Mutation 成功/失败 MUST 通过 toast 反馈,不弹原生 alert。

#### Scenario: 重置密码成功

- **WHEN** 管理员点重置密码并成功
- **THEN** 弹出 `toast.success("密码已重置")`,且新密码通过 `toast()` 展示(可复制),不弹 `alert()`

### Requirement: 表格用 shadcn Table

管理后台页面(`admin/users`、`admin/bans`、`admin/reports`、`admin/keywords`、`admin/audit`、`admin/topics`)的 `<table>` MUST 替换为 shadcn `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell` 组合,获得统一间距与语义化。

#### Scenario: 用户管理表格

- **WHEN** 渲染 admin/users 列表
- **THEN** 使用 `Table` 组件,每行用 `TableRow`,表头用 `TableHeader`/`TableHead`,不再是裸 `<table><thead><tr>...`

### Requirement: Skeleton 用于 loading 态

所有客户端拉数据(useEffect 或 store fetch)的组件 MUST 在 loading 态渲染 `<Skeleton>`,不渲染空内容或闪烁。SSR loader 数据的首屏不要求 Skeleton。

#### Scenario: Sidebar 无人回复话题加载中

- **WHEN** Sidebar 的 NoReplyTopics 在拉取数据期间
- **THEN** 渲染 5 条 `<Skeleton className="h-4 w-full" />`,而非空白或 "加载中" 文字

### Requirement: 前台和后台控件密度档

Web UI SHALL 定义前台默认控件、后台筛选控件和后台表格内联控件的密度档，并在手写 `select`、`textarea` 和局部筛选条中遵守这些密度档。

#### Scenario: 前台默认控件密度

- **WHEN** 前台页面渲染普通 `Input`、`select` 或主表单控件
- **THEN** 控件高度 SHALL 与基础 `Input` 的 `h-9` 对齐
- **AND** 圆角和背景 SHALL 与品牌控件一致，不使用孤立的 `rounded-md` 大表单样式。

#### Scenario: 后台表格内联控件密度

- **WHEN** 后台表格单元格内渲染可编辑输入控件
- **THEN** 控件 MAY 使用 `h-8` 和更紧凑的圆角
- **AND** 不得撑高整行导致表格难以扫描。

#### Scenario: 手写 select 样式收敛

- **WHEN** 页面需要渲染原生 `select`
- **THEN** `select` SHALL 使用与相邻 `Input` 一致的高度、边框、圆角、背景和 focus 样式
- **AND** 不得在同一表单中出现 `Input rounded-xl` 与 `select rounded-md` 的视觉断层。

### Requirement: 首页轻量分页模式

分页组件 SHALL 支持轻量模式，供首页 topic feed 仅展示上一页和下一页；数字页码模式 SHALL 继续供后台、用户页和管理列表使用。

#### Scenario: 首页不展示总页数

- **WHEN** 用户访问首页 topic feed 且存在多页数据
- **THEN** 分页区域只展示可用的“上一页”和“下一页”入口
- **AND** 不展示 `1 2 3 ... <totalPages>` 或总页数数字。

#### Scenario: 非首页保留数字分页

- **WHEN** 后台列表、用户聚合页或招聘专区渲染分页
- **THEN** 分页控件继续允许访问上一页、下一页和附近页码
- **AND** 翻页时保留当前搜索或筛选参数。

### Requirement: 长页面回到顶部入口

Web UI SHALL 在主站和后台长页面滚动较深时提供轻量 floating “回到顶部”入口，短页面和首屏不得常驻显示该入口。

#### Scenario: 滚动较深时显示回到顶部

- **WHEN** 用户在主站或后台页面向下滚动超过首屏后的阈值
- **THEN** 页面右下角展示“回到顶部”浮动按钮
- **AND** 按钮不遮挡主要表单提交按钮或移动端安全区域。

#### Scenario: 点击回到顶部

- **WHEN** 用户点击“回到顶部”按钮
- **THEN** 页面平滑滚动到顶部
- **AND** 按钮在回到顶部后隐藏。
