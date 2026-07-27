# layout-templates Specification

## Purpose

定义 Web 路由使用的页面模板、内容宽度、响应式重排、后台宽屏布局和表格溢出处理约束，确保不同页面类型在桌面与移动端保持一致且可读的结构。

## Requirements

### Requirement: 命名页面模板

所有 app routes SHALL 使用命名页面模板：feed、reading/topic detail、content、form、search 或 admin。

#### Scenario: Route 可映射到模板

- **WHEN** 审计 `apps/web/app/routes` 中的任意 route
- **THEN** 该 route 可映射到一个命名模板
- **AND** 不定义与模板无关的任意 standalone 宽度。

### Requirement: Feed 模板

Feed 页面 SHALL 在桌面端使用主内容列 + 社区右栏，并 SHALL 在小屏幕将右栏模块重排到 feed 下方。

#### Scenario: 首页 feed 对齐

- **WHEN** 首页在桌面端渲染
- **THEN** feed 和 sidebar 与 Header 使用同一 shell 对齐
- **AND** sidebar 使用配置好的 feed sidebar 宽度。

### Requirement: Reading 模板

Topic 详情页 SHALL 使用 reading 模板，在大桌面支持可选左侧 TOC rail、中间可读内容列和右侧上下文 rail。

#### Scenario: Topic 详情不使用临时居中文章

- **WHEN** topic 详情页在桌面端渲染
- **THEN** 它不会把全部内容包在与 shell 无关的居中 `max-w-3xl` article 中
- **AND** 它与 reading shell template 对齐。

### Requirement: Content 模板

静态内容页 SHALL 使用 content 模板，包括 hero、结构化 sections 和可选 TOC/related navigation。

#### Scenario: About 页面不是占位

- **WHEN** `/about` 渲染
- **THEN** 它包含设计好的 hero 和至少一个结构化内容 section
- **AND** 它不是单行占位文本。

### Requirement: Form 模板

Auth、setting、create、edit 页面 SHALL 使用统一 form 模板，包括清晰标题、描述、form surface、actions、校验和辅助导航。

#### Scenario: Form 页面 surface 一致

- **WHEN** `/signin`、`/signup`、`/topic/create` 或 `/setting` 渲染
- **THEN** 表单显示在一致的品牌 surface 中，并具有一致间距和反馈状态。

### Requirement: Admin 模板

Admin routes SHALL 使用 admin 模板，包括 shell、后台导航、active 状态、数据 surface 和响应式行为。

#### Scenario: Admin 页面共享布局

- **WHEN** `/admin/topics`、`/admin/users` 和 `/admin/settings` 渲染
- **THEN** 它们共享相同 shell、nav、内容宽度、card/table surface 和 active 导航行为。

### Requirement: Admin 模板必须提供后台宽屏内容区
Admin routes SHALL 使用比前台 feed 更宽的后台 shell，以承载数据表格和运营工具，同时保留表单类内容的可读宽度。

#### Scenario: 后台 shell 使用宽屏容器
- **WHEN** 管理员在桌面端访问 `/admin/topics`、`/admin/users`、`/admin/audit` 或 `/admin/moderation`
- **THEN** admin shell 的主内容容器 MUST 使用宽屏上限，例如 `max-w-screen-2xl` 或等价宽度
- **AND** 左侧导航和主内容区域 MUST 保持 `min-w-0` 以允许内部滚动和截断生效

#### Scenario: 表单类后台页面不过度拉宽
- **WHEN** 管理员访问 `/admin/settings` 或其他表单为主的后台页面
- **THEN** 页面 SHALL 仍使用 admin shell 对齐
- **AND** 表单卡片内容 MUST 使用内部宽度或 grid 控制，避免输入框横跨整个宽屏容器

#### Scenario: 表格横向滚动与列宽协同
- **WHEN** 管理表格的内容总宽度超过主内容区域
- **THEN** 表格容器 MUST 提供横向滚动
- **AND** 页面 MUST 为关键列配置最小宽度或换行策略，避免浏览器无限压缩列宽
