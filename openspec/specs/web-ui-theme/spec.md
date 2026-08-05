# web-ui-theme Specification

## Purpose

定义 Web 主题系统的语义 token、light/dark/system 三态切换、防 FOUC 初始化、字面量色值清理和全局 CSS 边界要求。

## Requirements

### Requirement: 语义 token 单一来源

`apps/web/app/styles/global.css` SHALL 用 Tailwind v4 CSS-first `@theme inline` 声明 Base Nova 所需的完整 core semantic tokens，至少涵盖 `background`/`foreground`、`primary`/`primary-foreground`、`secondary`/`secondary-foreground`、`muted`/`muted-foreground`、`accent`/`accent-foreground`、`destructive`/`destructive-foreground`、`border`、`input`、`ring`、`card`/`card-foreground`、`popover`/`popover-foreground` 和 `radius`，并 SHALL 为 light/dark 分别定义标准 sidebar 与 chart tokens。CNode 颜色 MUST 映射到 `primary`、`accent`、`secondary`、`muted`、`foreground`、`sidebar-*` 和 `chart-*` 等用途；只有 Logo 或品牌展示无法由标准角色表达时 MAY 增加少量 `brand-*` token。

#### Scenario: 组件使用语义 class 而非字面量色值

- **WHEN** 任意组件渲染卡片、控件、状态或导航背景
- **THEN** 使用与用途匹配的标准 semantic class；Card 背景使用 `bg-card text-card-foreground`
- **AND** 不出现十六进制色值、原始 CNode palette class 或手工 light/dark 颜色组合。

#### Scenario: 切换 dark mode 不改组件代码

- **WHEN** `<html>` 元素添加或移除 `dark` class
- **THEN** 所有 semantic class 以及 core、sidebar、chart 和允许的 brand roles MUST 自动切换配色
- **AND** primitive 与 route 无需增加 `dark:` 颜色变体。

### Requirement: 三态主题切换

系统 SHALL 支持 `light` / `dark` / `system` 三态切换,在三者间循环。`system` 态 MUST 监听 `prefers-color-scheme` 媒体查询变化,系统主题改变时实时跟随。

#### Scenario: 用户从 dark 切换到 system

- **WHEN** 系统主题为 light 且用户切到 system
- **THEN** 界面立即切为 light,且之后系统主题改为 dark 时界面自动跟随

#### Scenario: 刷新保留主题选择

- **WHEN** 用户选择 dark 后刷新页面
- **THEN** 主题仍为 dark,且 FOUC(闪白)被 root.tsx 的 inline script 阻断

### Requirement: 防 FOUC inline script 保留

`apps/web/app/root.tsx` 的 `<head>` 内 MUST 保留同步执行的 inline script,在任何 React 渲染前读 localStorage 并给 `<html>` 加 `dark` class。zustand theme store MUST NOT 接管该初始化逻辑,只负责交互后的切换。

#### Scenario: 首次 SSR 渲染已带正确 class

- **WHEN** 服务端返回 HTML
- **THEN** inline script 已在 `<head>` 执行完毕,`<html>` 已有/无 `dark` class,首屏不闪白

### Requirement: 字面量色值清零

完成迁移后,`apps/web/app/` 下所有 `.tsx`/`.ts` 文件 MUST NOT 包含硬编码十六进制色值(如 `#0d1117`/`#161b22`/`bg-white dark:bg-[#...]`)。颜色全部由 token 派生。

#### Scenario: grep 检查无字面量

- **WHEN** 在 `apps/web/app` 下搜索 `#[0-9a-fA-F]{3,6}` 或 `bg-white dark:`
- **THEN** 无匹配项

### Requirement: tokens 文件只含 token 定义

`styles/global.css` SHALL 作为 Tailwind、动画、Typeset 与主题 token 的入口，不得包含 route、领域 block 或 primitive 的补丁样式。Markdown Typeset、代码高亮等跨页面内容系统 MAY 使用独立 CSS 文件并由该入口导入。

#### Scenario: 全局 CSS 边界

- **WHEN** 查看 `styles/global.css` 及其导入
- **THEN** global 入口只包含框架 imports、theme token、必要 base behavior 和独立内容系统 imports
- **AND** 不得出现用于修复单一路由、Card、Button、Table 或 overlay 的 selector。

#### Scenario: 全局 CSS 只剩 token

- **WHEN** 查看 `styles/global.css`
- **THEN** 除 Tailwind、动画与独立 Typeset/代码高亮内容系统 imports、`@theme inline`、`:root`、`.dark` 和必要 base behavior 外不包含其他规则
- **AND** 不得包含业务样式、组件样式或 route-specific selector。

### Requirement: 亮暗主题可读对比度

light 与 dark 主题中的文本、链接、边框、焦点指示、状态提示和交互控件 SHALL 使用可辨识的语义颜色组合。普通文本与背景的对比度 MUST 至少为 4.5:1，大号文本 MUST 至少为 3:1；交互控件边界、状态图形和 focus 指示与相邻颜色的对比度 MUST 至少为 3:1。

#### Scenario: light 主题阅读和操作

- **WHEN** 用户以 light 主题查看正文、muted metadata、链接、表单和 destructive 提示
- **THEN** 每类内容 MUST 达到其适用的最低对比度
- **AND** 链接、错误和 destructive 状态 MUST NOT 仅依赖难以辨识的浅色差表达。

#### Scenario: dark 主题阅读和操作

- **WHEN** 用户以 dark 主题查看卡片、popover、表单、disabled 状态和 focus 指示
- **THEN** 前景与对应背景 MUST 达到其适用的最低对比度
- **AND** disabled 与 enabled 状态 MUST 可区分，但 disabled 文本不得因此变成不可读。

#### Scenario: 键盘焦点在两种主题中可见

- **WHEN** 键盘用户在 light 或 dark 主题中移动焦点
- **THEN** 当前交互元素 MUST 显示连续且可辨识的 focus 指示
- **AND** focus 指示不得被 overflow 裁切或仅依赖颜色极接近的阴影。

### Requirement: 浏览器主题集成

页面 SHALL 根据当前生效主题向浏览器声明匹配的 color scheme 和 theme color；system 模式变化后，浏览器 chrome 与原生表单控件 MUST 跟随实际生效的 light 或 dark 主题。

#### Scenario: 固定 dark 主题

- **WHEN** 用户选择 dark 主题
- **THEN** 浏览器 color scheme MUST 表示 dark
- **AND** theme color MUST 使用与 dark 页面背景协调且可识别的颜色。

#### Scenario: system 主题实时变化

- **WHEN** 用户选择 system 且操作系统从 light 切换到 dark
- **THEN** 页面主题、浏览器 color scheme 和 theme color MUST 在不刷新页面的情况下同步为 dark
- **AND** 原生选择器、滚动条及浏览器提供的控件 MUST 使用匹配的配色。

### Requirement: Reduced motion

当用户声明 `prefers-reduced-motion: reduce` 时，Web UI SHALL 移除非必要的平滑滚动、位移、缩放、旋转和长时过渡，同时保留状态变化及操作结果的可理解性。

#### Scenario: reduced motion 下打开 overlay

- **WHEN** 用户启用 reduced motion 并打开 Dialog、Sheet、DropdownMenu 或 Command overlay
- **THEN** overlay MUST 立即出现或仅使用最短的非位移动画
- **AND** 焦点移动和可见状态 MUST 保持正确。

#### Scenario: reduced motion 下页内导航

- **WHEN** 用户启用 reduced motion 并触发回到顶部或锚点导航
- **THEN** 页面 MUST 不执行持续平滑滚动
- **AND** 最终滚动位置和焦点目标 MUST 与普通模式一致。

#### Scenario: 未声明 reduced motion

- **WHEN** 用户未请求 reduced motion
- **THEN** 状态过渡 MAY 使用品牌动画
- **AND** 动画 MUST NOT 阻止用户在过渡期间取消、关闭或继续操作。

### Requirement: 页面不得直接消费 CNode 原始颜色

业务页面和 application blocks MUST 按语义选择 theme role，不得直接使用 `cnode-green`、`cnode-soft`、`cnode-ink` 或等价 raw palette utility。

#### Scenario: 同一浅绿色用于不同语义

- **WHEN** 旧页面以同一 `bg-cnode-soft` 表达 selected、informational、muted surface 或 decoration
- **THEN** 迁移后 MUST 根据用途分别选择 `accent`、`secondary`、`muted` 或允许的 brand role
- **AND** 不得执行不区分用途的全局字符串替换。

### Requirement: Base Nova theme 结构作为主题种子

主题 SHALL 以 Base Nova 提供的 light/dark core、chart、radius 和 sidebar token 集合作为结构种子，并 SHALL 保持其 surface 层级、foreground 配对和透明 border/input 关系。CNode theme MUST 在这些标准角色内替换品牌相关色相，不得删除标准 token 或在页面建立平行 token 系统。

#### Scenario: CNode 映射 Base theme

- **WHEN** 从 Base Nova 中性 theme 生成 CNode light/dark theme
- **THEN** background、card、popover、secondary、muted、border 和 input 保持可辨识的标准层级关系
- **AND** primary、accent、sidebar-primary 和适用的 chart roles 使用经过对比度验证的 CNode 品牌色，而不是原样保留中性灰或无关蓝色。

#### Scenario: Radius 遵循 preset 基线

- **WHEN** Base Nova registry 定义默认 radius 与派生 radius
- **THEN** theme MUST 采用该 preset 基线并让 primitive 通过标准 radius token 消费
- **AND** 不得仅因旧页面外观或单独 theme 示例的 `0.45rem` 值在 route/primitive 建立不同圆角。

#### Scenario: Chart token 具有可辨识系列

- **WHEN** 后台真实数据 chart 使用 `chart-1` 至 `chart-5`
- **THEN** light/dark 下相邻系列 MUST 可辨识并与 CNode theme 协调
- **AND** 不得直接复制无法区分业务系列的单色灰阶或为装饰目的使用 chart token。
