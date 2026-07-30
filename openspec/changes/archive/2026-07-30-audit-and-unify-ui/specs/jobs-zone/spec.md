## MODIFIED Requirements

### Requirement: 顶条 facet 筛选

`JobFilterBar` SHALL 支持按以下维度筛选招聘帖：地点、远程模式、薪资下限、技术栈标签。筛选条件变化 SHALL 反映到 URL query 参数。桌面端筛选条 SHALL 使用工具栏密度，控件高度、圆角和背景与基础表单控件一致；移动端 SHALL 继续折叠到 Sheet。

#### Scenario: 按地点筛选

- **WHEN** 用户在 `JobFilterBar` 选择地点"上海"
- **THEN** URL 更新为 `?location=上海`
- **AND** `JobCardGrid` 只展示 `job_meta.location = '上海'` 的招聘帖
- **AND** 分页重置到第 1 页。

#### Scenario: 按远程模式筛选

- **WHEN** 用户选择远程模式 `remote`
- **THEN** URL 更新为 `?remote=remote`
- **AND** 列表只展示 `job_meta.remote = 'remote'` 的招聘帖。

#### Scenario: 按薪资下限筛选

- **WHEN** 用户输入薪资下限 30 K
- **THEN** URL 更新为 `?salary_min=30`
- **AND** 列表只展示 `job_meta.salary_max >= 30` 的招聘帖。

#### Scenario: 按技术栈标签交集筛选

- **WHEN** 用户选择标签 `Node` 和 `PostgreSQL`
- **THEN** URL 更新为 `?tags=Node,PostgreSQL`
- **AND** 列表只展示 `job_meta.tech_tags` 与 `['Node','PostgreSQL']` 有非空交集的招聘帖。

#### Scenario: 桌面筛选条使用工具栏密度

- **WHEN** 桌面端渲染 `JobFilterBar`
- **THEN** 地点、远程、薪资下限、技术栈和清除筛选控件 SHALL 使用一致高度
- **AND** 控件整体看起来像列表工具栏，而不是大尺寸发布表单。
