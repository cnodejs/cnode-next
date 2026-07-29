# jobs-zone Specification

## Purpose

定义招聘专区的展示能力：卡片网格布局、顶条 facet 筛选、移动端适配、数据加载与分页。专区与社区流是两套独立展示形态，不复用 `TopicList` / `FeedGrid`。

## ADDED Requirements

### Requirement: 专区路由独立全宽布局

专区页 `/zone/jobs` SHALL 使用全宽布局展示卡片网格，不复用首页 `FeedGrid` 的主区+20rem 侧栏骨架。专区页 SHALL 只包含顶部筛选条和下方卡片网格两个区域。

#### Scenario: 桌面端专区布局

- **WHEN** 用户访问 `/zone/jobs`
- **THEN** 页面顶部渲染 `JobFilterBar` 顶条筛选条
- **AND** 下方渲染 `JobCardGrid` 全宽卡片网格
- **AND** 页面不含首页右侧的 Sidebar

#### Scenario: 移动端专区布局

- **WHEN** viewport 为移动端宽度
- **THEN** `JobFilterBar` 折叠为"筛选"按钮触发的 Sheet（复用 `ui/sheet`）
- **AND** `JobCardGrid` 改为单列
- **AND** 主要触摸目标高度至少为 36px

### Requirement: 顶条 facet 筛选

`JobFilterBar` SHALL 支持按以下维度筛选招聘帖：地点、远程模式、薪资下限、技术栈标签。筛选条件变化 SHALL 反映到 URL query 参数。

#### Scenario: 按地点筛选

- **WHEN** 用户在 `JobFilterBar` 选择地点"上海"
- **THEN** URL 更新为 `?location=上海`
- **AND** `JobCardGrid` 只展示 `job_meta.location = '上海'` 的招聘帖
- **AND** 分页重置到第 1 页

#### Scenario: 按远程模式筛选

- **WHEN** 用户选择远程模式 `remote`
- **THEN** URL 更新为 `?remote=remote`
- **AND** 列表只展示 `job_meta.remote = 'remote'` 的招聘帖

#### Scenario: 按薪资下限筛选

- **WHEN** 用户输入薪资下限 30 K
- **THEN** URL 更新为 `?salary_min=30`
- **AND** 列表只展示 `job_meta.salary_max >= 30` 的招聘帖

#### Scenario: 按技术栈标签交集筛选

- **WHEN** 用户选择标签 `Node` 和 `PostgreSQL`
- **THEN** URL 更新为 `?tags=Node,PostgreSQL`
- **AND** 列表只展示 `job_meta.tech_tags` 与 `['Node','PostgreSQL']` 有非空交集的招聘帖

### Requirement: facet 值聚合与缓存

专区列表首次加载时 SHALL 并行请求所有 facet 维度的可选值。facet 查询结果 SHALL 缓存 5 分钟。

#### Scenario: facet 值来自 job_meta 聚合

- **WHEN** 用户访问 `/zone/jobs` 首次加载
- **THEN** 后端并行返回 `location` 的 distinct 值列表
- **AND** `remote` 固定为 `on-site` / `hybrid` / `remote` 三个枚举
- **AND** facet 查询结果缓存 5 分钟

#### Scenario: 分页时 facet 不变

- **WHEN** 用户从第 1 页翻到第 2 页
- **THEN** `JobFilterBar` 的可选值不变
- **AND** 不重新请求 facet 聚合数据

### Requirement: 专区列表只展示有 meta 的招聘帖

专区列表查询 SHALL 使用 `topics` INNER JOIN `job_meta` 筛选，只展示有结构化 meta 的招聘帖。

#### Scenario: 历史招聘帖无 meta 不展示

- **WHEN** 一个 `tab='job'` 的 topic 没有 `job_meta` 行
- **THEN** 该 topic 不出现在专区列表
- **AND** 该 topic 的详情页仍可访问（不渲染 JobMetaCard）

### Requirement: 分页复用现有 Pagination 组件

专区列表分页 SHALL 复用 `apps/web/app/components/Pagination.tsx` 组件，保持分页交互一致性。

#### Scenario: 分页导航

- **WHEN** 专区列表总数超过单页 limit
- **THEN** 底部渲染 `Pagination` 组件
- **AND** 分页参数 `page` 写入 URL query
- **AND** 筛选条件在翻页时保持

### Requirement: 专区卡片浓缩展示

`JobCardGrid` 的单卡 SHALL 展示：公司 logo、公司名、职位标题、徽章组（地点/远程/薪资/经验）、技术栈标签、简要 JD 摘要。卡片 SHALL 是浓缩版，与详情页的 `JobMetaCard` 是不同组件。

#### Scenario: 卡片渲染字段

- **WHEN** `JobCardGrid` 渲染单张招聘帖卡片
- **THEN** 卡片展示 `job_meta.company_logo`（如有）
- **AND** 展示 `job_meta.company` 和 `job_meta.position`
- **AND** 展示 `job_meta.location` / `remote` / `salary_min-max` / `experience` 为徽章
- **AND** 展示 `job_meta.tech_tags` 为标签
- **AND** 展示 `topic.content` 的前两行作为 JD 摘要（复用 `excerptMarkdown`）

#### Scenario: 点击卡片跳转详情

- **WHEN** 用户点击专区卡片
- **THEN** 导航到 `/topic/:tid`（复用现有详情路由）
- **AND** 详情页在 `tab=job` 且有 meta 时于 content 上方渲染 JobMetaCard
