# web-ui-components Specification

## Purpose

定义 Web UI 原子组件、shadcn/ui 组件源码、按钮变体、菜单、Dialog、领域组件组合、图标和 toast 反馈的统一使用要求。

## Requirements

### Requirement: shadcn/ui 原子组件层

`apps/web/app/components/ui/` SHALL 包含仓库拥有源码的 shadcn `base-nova` 原子组件，并 SHALL 以 Base UI 作为交互 primitive 基础，覆盖 `button`、`input`、`label`、`card`、`badge`、`avatar`、`dropdown-menu`、`dialog`、`sheet`、`tabs`、`table`、`tooltip`、`skeleton`、`sonner`、`form`、`select`、`native-select`、`textarea`、`alert-dialog`、`alert`、`pagination`、`empty`、`command` 和 `radio-group`。组件 MUST 使用 `cn()` 和标准 semantic tokens，且其结构、默认 variant、尺寸、间距、圆角、颜色、focus、disabled 与状态样式 MUST 与项目锁定版本的 Base Nova registry 保持一致；Web 源码和直接依赖 MUST NOT 保留 Radix primitive、Slot 兼容层、legacy `new-york` 样式或 CNode 专属 primitive variant。

#### Scenario: 新建页面使用原子组件

- **WHEN** 开发者在 `routes/` 下新建页面
- **THEN** 页面内已有 shadcn 对应物的按钮、输入、字段、卡片、列表、状态、菜单、overlay 和空状态 MUST 从 `~/components/ui/` 导入
- **AND** 不得以裸元素和视觉 Tailwind 字符串重建相同 primitive
- **AND** 键盘与辅助技术用户 MUST 能识别控件的名称、角色和当前状态。

#### Scenario: 组件源码进仓库

- **WHEN** 查看 `apps/web/app/components/ui/`
- **THEN** 已安装组件 MUST 是完整的 Base Nova 组件源码而不是 npm re-export
- **AND** `components.json` MUST 让 shadcn CLI 将项目识别为 Base Nova 而不是 Radix `new-york`。

#### Scenario: 页面使用一致的语义组件

- **WHEN** 页面渲染按钮、输入框、选择器、反馈、分页或空状态
- **THEN** 用户看到的颜色、圆角、密度、焦点和禁用状态 MUST 与同类品牌组件一致
- **AND** 键盘与辅助技术用户 MUST 能识别控件的名称、角色和当前状态。

#### Scenario: 现有组件行为保持可用

- **WHEN** 共享原子组件新增能力或样式更新
- **THEN** 已使用该组件的页面 MUST 保持原有可执行动作和导航结果
- **AND** 不得因 Base UI 或 Base Nova realignment 改变既有业务动作、导航结果或权限入口。

#### Scenario: 组件组合使用 Base UI render

- **WHEN** Button、Dialog trigger、Sheet trigger 或菜单项组合 React Router Link 或其他元素
- **THEN** 组件 MUST 使用 Base UI `render` 或等价原生语义完成组合
- **AND** DOM MUST NOT 产生嵌套 button、重复交互元素或长期 `asChild`/Radix Slot 兼容层。

#### Scenario: Base UI 状态驱动样式

- **WHEN** overlay 打开或关闭、Checkbox 选中、Tabs 激活或菜单高亮
- **THEN** 样式 MUST 由对应 Base UI open/closed/checked/active/highlighted 状态属性驱动
- **AND** 不得依赖已失效的 Radix `data-state` 或 `--radix-*` 变量。

#### Scenario: 迁移完成后清理 Radix

- **WHEN** Web primitive 与消费者迁移完成
- **THEN** `apps/web` 源码 MUST 不再 import `@radix-ui/*` 或 `radix-ui`
- **AND** Web package MUST 不再直接声明 Radix dependencies
- **AND** cmdk、sonner 等非 Radix 库 MUST 保持其既有职责，不得为追求文本零匹配而被无关替换。

### Requirement: Button 变体覆盖现有用法

Button 组件 MUST 只提供锁定 Base Nova 版本定义的标准 variants 和 sizes，并 MUST 保持 `default`、`secondary`、`destructive`、`outline`、`ghost`、`link` variants 以及 `default`、`sm`、`lg`、`icon` sizes 的现有语义覆盖。主操作、次级操作、危险操作、链接与 icon-only 操作 SHALL 使用标准 prop 表达；页面 MUST NOT 新增 `inverse` 等项目专属 variant，或通过 `className` 重定义 Button 颜色、尺寸、padding、圆角和 icon 大小。

#### Scenario: 主按钮替换

- **WHEN** 渲染登录表单的提交按钮
- **THEN** 使用 `<Button>` 默认 variant
- **AND** CNode 主色由 `primary` token 提供，不在 Button 或 route 中写品牌颜色 class，也不保留裸 `<button className="bg-blue-600 ...">`。

#### Scenario: 次级按钮替换

- **WHEN** 渲染取消按钮
- **THEN** 使用 `<Button variant="outline">` 或与动作层级匹配的标准 variant
- **AND** 不得手写边框、背景和 hover 颜色，也不保留裸 `<button className="border border-gray-300 ...">`。

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

### Requirement: Overlay 焦点与滚动边界

Dialog、AlertDialog、Sheet、下拉菜单和 Command overlay SHALL 管理打开后的焦点、背景交互和滚动边界；内容超过 viewport 时，overlay 内容 MUST 可滚动，背景页面 MUST NOT 随 overlay 内滚动而移动。

#### Scenario: 键盘用户打开并关闭 Dialog

- **WHEN** 键盘用户打开 Dialog 或 AlertDialog
- **THEN** 初始焦点 MUST 移入可操作内容或明确的安全默认控件
- **AND** Tab 焦点 MUST 保持在 overlay 内
- **AND** 用户按 Escape 或完成关闭后，焦点 MUST 返回触发控件。

#### Scenario: 长内容 overlay 在移动端滚动

- **WHEN** Dialog、Sheet 或 Command 内容高度超过移动端可视区域
- **THEN** overlay 内部 MUST 可滚动到所有内容和操作
- **AND** 页面背景 MUST 保持滚动锁定
- **AND** 顶部、底部操作和系统安全区域 MUST 不遮挡可操作内容。

#### Scenario: 嵌套滚动到达边界

- **WHEN** 用户在可滚动 overlay 内到达内容顶部或底部并继续滚动
- **THEN** 滚动 MUST NOT 穿透到背景页面。

#### Scenario: 受控 overlay 阻止关闭并恢复焦点

- **WHEN** 受控 Dialog、AlertDialog 或 Sheet 在 pending 时收到 Escape、外部点击或关闭请求
- **THEN** 页面 MUST 使用 Base UI close event details 阻止不允许的关闭
- **AND** 最终关闭且未导航时焦点 MUST 返回实际触发控件或明确配置的 final focus target。

#### Scenario: 菜单动作保持键盘与链接语义

- **WHEN** 用户以指针、Enter 或 Space 激活 Base UI 菜单中的动作或链接
- **THEN** 动作 MUST 仅执行一次并按预期关闭菜单
- **AND** 导航项 MUST 保持链接语义
- **AND** 打开确认对话框的菜单动作 MUST 将焦点正确移入对话框并在取消后返回入口。

### Requirement: Pagination 与 Empty 语义

共享 Pagination SHALL 提供当前页、可用页和上一页/下一页的可访问名称及状态；共享 Empty SHALL 说明当前结果为空，并在存在恢复路径时提供与当前上下文相关的操作。

#### Scenario: 数字分页表达当前页

- **WHEN** 后台列表或用户聚合页渲染数字分页
- **THEN** 当前页 MUST 以 `aria-current="page"` 或等价语义标记
- **AND** 不可用的上一页或下一页 MUST 不可触发
- **AND** 翻页链接 MUST 保留当前搜索和筛选参数。

#### Scenario: 筛选结果为空

- **WHEN** 列表在当前搜索或筛选条件下没有结果
- **THEN** 页面 MUST 展示品牌 Empty 状态并说明没有匹配结果
- **AND** 在可清除筛选时 MUST 提供清除筛选或返回完整列表的可执行入口
- **AND** 不得同时展示误导性的分页控件。

#### Scenario: 数据集本身为空

- **WHEN** 列表没有数据且未应用搜索或筛选条件
- **THEN** Empty 状态 MUST 区分“尚无数据”与“加载失败”
- **AND** 仅在用户有权限且确有创建路径时展示创建操作。

### Requirement: 标准组件 composition 优先于手写 block

页面 SHALL 优先使用 Base Nova Card、Field、Item、Sidebar、Table/Data Table、Badge、Alert、Empty、Separator、Toggle Group 和 Input Group 的标准 composition；只有包含稳定 CNode 领域结构时才能建立 application block。

#### Scenario: 状态和空结果展示

- **WHEN** 页面展示状态标签、错误说明或空结果
- **THEN** 分别使用 Badge、Alert 或 Empty 的标准 composition
- **AND** 不得手写具有相同角色的品牌色 span 或 surface div。

#### Scenario: Card 含标题、说明和操作

- **WHEN** Card 同时包含标题、说明和右侧操作
- **THEN** 使用 CardHeader、CardTitle、CardDescription 和 CardAction
- **AND** 不得以自定义 flex header 和独立 padding 模拟相同结构。
