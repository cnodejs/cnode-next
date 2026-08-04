# layout-templates Specification

## Purpose

定义 Web 路由使用的页面模板、内容宽度、响应式重排、后台宽屏布局和表格溢出处理约束，确保不同页面类型在桌面与移动端保持一致且可读的结构。
## Requirements
### Requirement: 命名页面模板

所有 app routes SHALL 映射到由 application blocks 组成的命名页面原型。公共页面原型为 feed、reading、compose、account、directory；后台页面原型为 dashboard、data-list、workflow。每个原型 MUST 定义 shell 对齐、内容宽度、PageHeader、block spacing、主要操作位置和 responsive behavior，route 不得定义与原型无关的 standalone surface 或宽度。

#### Scenario: Route 可映射到模板
- **WHEN** 审计 `apps/web/app/routes` 中的任意 route
- **THEN** route 可映射到一个命名页面原型并复用对应 blocks；原有 feed、reading/topic detail、content、form、search 和 admin 页面职责 MUST 由对应最终原型承接
- **AND** 同类 route 不得通过独立 Hero、Card padding、圆角或最大宽度形成另一套模板。

### Requirement: Feed 模板

Feed 页面 SHALL 在桌面端使用主内容列 + 社区右栏，并 SHALL 在小屏幕将右栏模块重排到 feed 下方。

#### Scenario: 首页 feed 对齐

- **WHEN** 首页在桌面端渲染
- **THEN** feed 和 sidebar 与 Header 使用同一 shell 对齐
- **AND** sidebar 使用配置好的 feed sidebar 宽度。

### Requirement: Reading 模板

Topic 详情页 SHALL 使用 reading 模板，在大桌面使用主可读内容列和右侧上下文 rail。目录 SHALL 位于正文顶部的折叠 disclosure 中，不得建立独立左侧 TOC rail。

#### Scenario: Topic 详情不使用临时居中文章

- **WHEN** topic 详情页在桌面端渲染
- **THEN** 它不会把全部内容包在与 shell 无关的居中 `max-w-3xl` article 中
- **AND** 它与 reading shell template 对齐
- **AND** 正文顶部目录不会缩减主内容的 grid 列宽。

### Requirement: Content 模板

静态内容页 SHALL 使用 content 模板，包括 hero、具有明确视觉边界和响应式 block spacing 的结构化 sections，以及可选 TOC/related navigation。多个主要 sections 不得仅依赖单一外层 Card 和连续细分隔线表达层级。

#### Scenario: About 页面不是占位

- **WHEN** `/about` 渲染
- **THEN** 它包含设计好的 hero 和至少一个结构化内容 section
- **AND** 它不是单行占位文本。

#### Scenario: About 主要模块形成独立阅读分组

- **WHEN** `/about` 展示社区介绍、参与指南、讨论规范、社区合作、社区客户端和常见问题
- **THEN** 每个主要模块以独立 section 和留白形成可辨识分组
- **AND** 桌面模块间距不小于 64px，移动端模块间距不小于 48px
- **AND** 内部重复 Card 或 Item 的 gap 不小于 16px
- **AND** 页面不使用一张 Card 包住全部主要模块。

### Requirement: Form 模板

Auth、setting、create、edit 页面 SHALL 使用统一 form 模板，包括清晰标题、描述、form surface、actions、校验和辅助导航。

#### Scenario: Form 页面 surface 一致

- **WHEN** `/signin`、`/signup`、`/topic/create` 或 `/setting` 渲染
- **THEN** 表单显示在一致的品牌 surface 中，并具有一致间距和反馈状态。

### Requirement: Admin 模板

Admin routes SHALL 使用标准 application shell、全宽 Header、容器内 desktop navigation Card 与 mobile Sheet，并按 dashboard、data-list 或 workflow 原型组合 page header、filters、toolbar、Card/Table/Item、pagination 和 actions。桌面、移动端导航 MUST 共享任务分组和 active state；desktop navigation Card MUST 与右侧完整 page header 使用同一顶部基线，不得增加仅用于补偿 breadcrumb 高度的左栏标签。后台 page header 使用 breadcrumb 与紧凑品牌 surface，不得扩展为宣传型 Hero。

#### Scenario: Admin 页面共享布局
- **WHEN** `/admin/topics`、`/admin/users` 和 `/admin/settings` 渲染
- **THEN** 它们共享相同 shell、Sidebar/nav、内容宽度、page header、block spacing、Card/Table surface 和 active 导航行为
- **AND** 数据列表与表单可使用不同原型，但不得重建独立 panel primitive。

#### Scenario: Workflow filters 与 records 分组
- **WHEN** 审计或治理 workflow 同时展示 filters 和 records
- **THEN** toolbar、结构分隔与 records 之间保留标准 block gap
- **AND** filter controls 不得与第一条记录共享边界或形成视觉叠压。

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

### Requirement: Page header 共享视觉 anatomy

公共入口和说明页面 SHALL 使用 marketing PageHeader；任务型页面 SHALL 使用 breadcrumb 加紧凑 PageHeader。两者 MUST 共享品牌 surface、标题层级、说明、圆角和 action 排布，只通过尺度与上下文区分，不得让任务页退化为无容器标题或局部分割线。

#### Scenario: 任务型页面标题
- **WHEN** 搜索、设置、发布编辑、消息、榜单或后台页面渲染
- **THEN** breadcrumb 位于紧凑品牌 title surface 上方
- **AND** title surface 与 marketing Hero 使用同一语义颜色，但保持更小 padding 和标题尺度。

#### Scenario: Topic reading 标题
- **WHEN** 话题详情渲染 breadcrumb、标题、状态和 metadata
- **THEN** 标题保留在 reading CardHeader 而不是应用 PageHeader
- **AND** Separator 在 Card 基础 padding 内铺满内容宽度，不触碰 Card 外框。

### Requirement: 后台窄屏按信息优先级响应

后台 data-list 与 workflow SHALL 为窄屏定义核心字段、状态、主操作和次要详情的优先级；页面 MUST 明确选择响应式 record/item 或可横向滚动 Table，不得让关键操作只能在 viewport 外发现。

#### Scenario: 响应式记录项
- **WHEN** 数据可由身份/标题、状态、关键指标和主操作概括
- **THEN** 窄屏使用 Item 或等价 record composition 将核心信息纵向排列
- **AND** 次要字段可折叠、换行或进入详情。

#### Scenario: 保留可滚动数据表
- **WHEN** 任务需要跨多列比较且不适合转换为记录项
- **THEN** Table 容器提供明确横向滚动并保留关键列宽和操作可达性
- **AND** 页面不得同时维护行为不一致的桌面表格和移动端卡片。

### Requirement: 固定响应式审查 viewport

页面原型 SHALL 至少在 375px、768px、1280px 和 1440px viewport 下保持可用，并 SHALL 在较大 viewport 通过内容 measure 和最大宽度避免无边界拉伸。

#### Scenario: 页面原型跨 viewport
- **WHEN** 同一原型在四个标准 viewport 渲染
- **THEN** 导航、标题、主要内容、主要操作和 overlay 均保持可见可达
- **AND** 除明确的 Table 或 code scroll container 外不产生 viewport 水平溢出。

### Requirement: 列表分页使用共享 composition

除首页 feed MAY 使用简洁上一页/下一页模式外，公共列表与后台列表 SHALL 使用共享 numbered pagination，按上一页、最多五个连续页码、必要的首末页与省略号、下一页呈现。分页链接 MUST 保留当前有效筛选 query，route MUST NOT 自行建立不同分页 markup。

#### Scenario: 非首页列表跨页
- **WHEN** 用户在个人话题、招聘目录或后台筛选列表浏览多个结果页
- **THEN** 页面显示一致的 numbered pagination，并以 `aria-current="page"` 标识当前页
- **AND** 上一页、下一页和页码链接保留当前筛选条件。

### Requirement: 首页 rail 避免重复 Hero 内容

首页右侧 rail SHALL 优先展示补充 feed 的信息，不得重复 Hero 已表达的社区定位。社区合作展示位 MUST 明确为合作入口而非虚构广告；实时信息按最新回复、积分榜、无人回复话题排列。

#### Scenario: 首页桌面 rail
- **WHEN** 首页在显示右侧 rail 的 viewport 渲染
- **THEN** 首卡为指向 About 合作说明的社区合作展示位
- **AND** 积分榜紧邻最新回复并位于无人回复话题之前。

### Requirement: 隐藏客户端下载内容并入 About

未从站点导航露出的第三方客户端下载 route SHALL 被移除，其仍有参考价值的项目链接与维护边界 SHALL 合并到 `/about`，不得让站内下载 URL 直接重定向到第三方内容。

#### Scenario: 访问社区客户端说明
- **WHEN** 用户在 About 查看客户端与社区项目章节
- **THEN** 页面说明该客户端由社区开发者维护并提供原项目链接
- **AND** route config 不再注册 `/app/download`。
