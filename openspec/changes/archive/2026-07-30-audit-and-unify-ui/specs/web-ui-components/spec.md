## ADDED Requirements

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
