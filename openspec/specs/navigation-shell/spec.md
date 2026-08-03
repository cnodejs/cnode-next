# navigation-shell Specification

## Purpose

定义主站和后台导航 shell 的 header cluster 模型、logo 行为、搜索入口、发布 CTA、后台上下文和移动端优先级要求。
## Requirements
### Requirement: 主站 Header cluster 模型

主站 Header SHALL 将官方 logo 与搜索/命令入口放在左侧 cluster，将专区入口、`API` 一级入口、`关于` 一级入口、主 CTA、消息/通知和 profile 放在右侧 cluster。

#### Scenario: 桌面端主站 Header 顺序

- **WHEN** 主站 Header 在桌面端渲染
- **THEN** 顺序为 logo、搜索/命令入口、弹性空间、专区入口、`API`、`关于`、"发布话题"、消息/通知、profile
- **AND** `关于` 是直接指向 `/about` 的普通导航链接，不渲染下拉菜单
- **AND** profile 是最右侧交互项。

### Requirement: Logo 替代重复首页导航

桌面端主站 Header SHALL 使用 logo 作为回首页链接，并 SHALL NOT 要求额外的“首页”文字导航项。

#### Scenario: 通过 logo 返回首页

- **WHEN** 桌面端用户点击 logo
- **THEN** 应用导航到 `/`
- **AND** 桌面主导航中不需要重复的“首页”项。

### Requirement: 搜索是一级导航能力

搜索 SHALL 渲染为 command/search entry，而不是普通文字链接，并 SHALL 说明可搜索范围。

#### Scenario: 搜索入口展示快捷提示

- **WHEN** 桌面端 Header 渲染
- **THEN** 搜索入口显示类似“搜索话题、用户...”的 placeholder
- **AND** 在支持时展示命令快捷键提示。

### Requirement: 发布话题 CTA 醒目

“发布话题” SHALL 在桌面端 Header 中保持可见，作为唯一 primary CTA，并 SHALL 引导匿名用户登录而不是隐藏。

#### Scenario: 匿名用户点击发布 CTA

- **WHEN** 匿名用户触发“发布话题”
- **THEN** 用户进入认证流程，并带有登录后继续到 `/topic/create` 的意图。

### Requirement: 后台 Header 共享产品 shell

后台页面 SHALL 使用与主站相同的 cluster 模型，通过 Admin badge 和后台导航模式区分上下文，而不是形成独立应用 shell。

#### Scenario: 后台 Header 保持品牌一致

- **WHEN** `/admin` 页面渲染
- **THEN** 页面展示 CNode logo、Admin 模式标识、后台导航、主题/用户工具和返回主站入口
- **AND** 使用与主站一致的品牌 token 和交互状态。

### Requirement: 移动端 Header 优先级

移动端 Header SHALL 简化为 logo、搜索/菜单入口、专区下拉入口、消息/通知入口和 profile/menu 入口，避免辅助文字导航拥挤。

#### Scenario: 移动端导航不拥挤

- **WHEN** viewport 为移动端宽度
- **THEN** 专区下拉和指引入口折叠到 sheet、command palette 或菜单中
- **AND** 主要触摸目标高度至少为 36px。

### Requirement: 专区下拉导航

主站 Header SHALL 包含"专区"下拉导航，聚合所有 `zones.visible=true` 的专区入口。专区列表 SHALL 从 `root.tsx` loader 异步加载，不再硬编码。无可见专区时 SHALL 隐藏"专区"下拉。

#### Scenario: 桌面端专区下拉

- **WHEN** 桌面端用户点击或 hover "专区"
- **THEN** 展示下拉菜单，含所有 `zones.visible=true` 的专区入口
- **AND** 专区入口按 `sort_order` 升序排列
- **AND** 每个入口指向 `/zone/:slug`

#### Scenario: 移动端专区入口折叠

- **WHEN** 移动端用户打开导航 sheet
- **THEN** 专区入口与指引入口一起在 sheet 内展示
- **AND** 不在顶栏直接占用空间

#### Scenario: 无可见专区时下拉隐藏

- **WHEN** 所有专区 `visible=false`
- **THEN** 导航栏不展示"专区"下拉
- **AND** 不报错

### Requirement: 指引入口合并

主站 SHALL 使用 `/about` 作为社区介绍、参与指南、讨论规范和常见问题的唯一内容入口。`API` SHALL 继续作为一级导航指向 `/api`，导航 shell SHALL NOT 暴露 `/help`、`/getstart` 或 `/faq`。

#### Scenario: 桌面端关于入口

- **WHEN** 桌面端 Header 渲染
- **THEN** 辅助导航区域展示 `API` 链接指向 `/api`
- **AND** 展示 `关于` 链接直接指向 `/about`
- **AND** 不展示关于下拉、指引总览、新手指南或常见问题独立入口。

#### Scenario: 移动端导航同步

- **WHEN** 移动端用户打开导航 sheet
- **THEN** sheet 展示可访问 `/api` 的 `API` 入口和指向 `/about` 的“关于”入口
- **AND** 不展示 `/help`、`/getstart` 或 `/faq` 入口。

#### Scenario: CommandPalette 公开内容入口同步

- **WHEN** 用户打开 CommandPalette
- **THEN** 快捷操作至多展示一个指向 `/about` 的“关于 CNode”公开内容入口
- **AND** 不展示新手指南或常见问题独立快捷入口。

### Requirement: 用户设置入口命名

已登录用户菜单 SHALL 使用“用户设置”作为设置入口文案，并在桌面下拉和移动端导航中保持一致。

#### Scenario: 桌面用户菜单展示用户设置

- **WHEN** 已登录用户打开头像菜单
- **THEN** 设置入口文案为“用户设置”
- **AND** 入口指向 `/setting`。

### Requirement: CommandPalette 权限感知

CommandPalette SHALL 按当前用户权限过滤快捷入口和可跳转结果。普通用户和匿名用户 MUST NOT 看到或搜索到后台管理入口；具备后台访问权限的用户 MAY 看到后台入口。

#### Scenario: 匿名用户不看到管理后台入口

- **WHEN** 匿名用户打开 CommandPalette
- **THEN** 快捷入口和搜索结果中不展示“管理后台”
- **AND** 不展示任何 `/admin` 路径入口。

#### Scenario: 普通登录用户不看到管理后台入口

- **WHEN** 非 admin 且非 mod 的登录用户打开 CommandPalette
- **THEN** 快捷入口和搜索结果中不展示“管理后台”
- **AND** 不展示任何 `/admin` 路径入口。

#### Scenario: 管理人员看到管理后台入口

- **WHEN** admin 或 mod 用户打开 CommandPalette
- **THEN** 系统可以展示“管理后台”或等价后台入口
- **AND** 入口指向其有权限访问的后台页面。

#### Scenario: 移动端导航展示用户设置

- **WHEN** 已登录用户打开移动端导航 sheet
- **THEN** 设置入口文案为“用户设置”
- **AND** 入口指向 `/setting`。

### Requirement: 公共与后台 Skip navigation

公共 shell 和后台 shell SHALL 在文档开头提供键盘可用的 skip link，使用户可跳过重复导航并直接到达当前页面主内容。

#### Scenario: 公共页面跳到主内容

- **WHEN** 键盘用户在公共页面首次按 Tab
- **THEN** 页面 MUST 显示“跳到主要内容”或等价 skip link
- **AND** 激活后焦点 MUST 移到当前页面唯一的 main 内容区域
- **AND** 主标题或第一项主要内容 MUST 位于后续阅读顺序中。

#### Scenario: 后台页面跳过管理导航

- **WHEN** 键盘用户在后台页面激活 skip link
- **THEN** 焦点 MUST 跳过顶部导航、侧栏和移动端导航入口
- **AND** 到达后台当前页面的 main 内容区域。

### Requirement: 导航当前项语义

公共与后台导航 SHALL 以可见样式和 `aria-current` 或等价语义标识当前页面；仅可展开菜单但不代表当前目的地的触发器 MUST NOT 被错误标记为当前页。

#### Scenario: 公共一级导航当前项

- **WHEN** 用户位于 `/about`
- **THEN** 指向 `/about` 的“关于”导航链接 MUST 具有当前页语义和可见 active state
- **AND** 其他一级导航链接 MUST NOT 同时标记为当前页。

#### Scenario: 后台子页面当前项

- **WHEN** 用户位于某个后台子页面
- **THEN** 对应后台导航入口 MUST 具有当前页语义
- **AND** 桌面侧栏、顶部导航和移动端导航 MUST 对同一路由表达一致的 active state。

#### Scenario: 分页导航当前项

- **WHEN** shell 内页面渲染分页导航
- **THEN** 当前页码 MUST 使用当前页语义
- **AND** shell 的页面导航 active state MUST 不因页码参数变化而丢失。

### Requirement: 页面 Landmark 与标题层级

公共与后台 shell SHALL 提供可识别的 header、navigation 和唯一 main landmark；每个页面 MUST 有一个描述当前页面目的的一级标题，后续标题 SHALL 按内容层级排列。

#### Scenario: 后台列表页面结构

- **WHEN** 辅助技术用户访问后台列表页
- **THEN** 用户 MUST 能按 landmark 到达后台导航和 main 内容
- **AND** main 内 MUST 有描述当前列表的一级标题
- **AND** 筛选区、结果区和批量操作区不得以多个无层级的一级标题表示。

### Requirement: 移动端安全区域

公共与后台 shell 的固定 header、底部操作、导航 Sheet 和浮动控件 SHALL 避开设备 safe area，并 MUST 在虚拟键盘、窄屏和横屏条件下保持主要内容及关闭操作可触达。

#### Scenario: 带底部 safe area 的设备

- **WHEN** 页面运行在具有底部 safe-area inset 的移动设备
- **THEN** 固定底部操作和浮动控件 MUST 与系统手势区域保持安全间距
- **AND** 页面最后一项内容 MUST 能滚动到不被固定控件遮挡的位置。

#### Scenario: 移动导航 Sheet

- **WHEN** 用户在移动端打开公共或后台导航 Sheet
- **THEN** Sheet 的关闭控件、首个导航项和最后一个导航项 MUST 位于安全区域内
- **AND** 内容超过 viewport 时 MUST 可在 Sheet 内滚动
- **AND** 背景页面 MUST 不随 Sheet 内容滚动。

#### Scenario: 虚拟键盘打开

- **WHEN** 用户在移动端导航或搜索 overlay 中聚焦输入框并打开虚拟键盘
- **THEN** 输入框、当前结果和关闭方式 MUST 仍可见或可滚动到达
- **AND** shell 不得产生 viewport 水平溢出。
