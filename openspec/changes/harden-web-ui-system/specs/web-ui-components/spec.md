## MODIFIED Requirements

### Requirement: shadcn/ui 原子组件层

Web UI SHALL 继续使用仓库内源码所有权的 shadcn/ui 原子组件层，并 SHALL 提供 `button`、`input`、`label`、`card`、`badge`、`avatar`、`dropdown-menu`、`dialog`、`sheet`、`tabs`、`table`、`tooltip`、`skeleton`、`sonner`、`form`、`select`、`native-select`、`textarea`、`alert-dialog`、`alert`、`pagination`、`empty`、`command` 和 `radio-group`。这些组件 MUST 共享语义颜色、尺寸、焦点和禁用状态，且不得以另一套不兼容的基础组件替换现有层。

#### Scenario: 页面使用一致的语义组件

- **WHEN** 页面渲染按钮、输入框、选择器、反馈、分页或空状态
- **THEN** 用户看到的颜色、圆角、密度、焦点和禁用状态 MUST 与同类品牌组件一致
- **AND** 键盘与辅助技术用户 MUST 能识别控件的名称、角色和当前状态。

#### Scenario: 现有组件行为保持可用

- **WHEN** 共享原子组件新增能力或样式更新
- **THEN** 已使用该组件的页面 MUST 保持原有可执行动作和导航结果
- **AND** 不得因基础组件整体替换而改变既有业务行为。

## ADDED Requirements

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
