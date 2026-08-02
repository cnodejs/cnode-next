## ADDED Requirements

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
