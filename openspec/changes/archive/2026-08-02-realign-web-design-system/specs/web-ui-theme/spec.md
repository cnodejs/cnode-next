## MODIFIED Requirements

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

## ADDED Requirements

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
