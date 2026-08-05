## MODIFIED Requirements

### Requirement: shadcn/ui 原子组件层

`apps/web/app/components/ui/` SHALL 包含仓库拥有源码的 shadcn `base-nova` 原子组件，并 SHALL 以 Base UI 作为交互 primitive 基础，覆盖 `button`、`input`、`label`、`card`、`badge`、`avatar`、`dropdown-menu`、`dialog`、`sheet`、`tabs`、`table`、`tooltip`、`skeleton`、`sonner`、`form`、`select`、`native-select`、`textarea`、`alert-dialog`、`alert`、`pagination`、`empty`、`command` 和 `radio-group`。组件 MUST 使用 `cn()` 和标准 semantic tokens，且其结构、默认 variant、尺寸、间距、圆角、颜色、focus、disabled 与状态样式 MUST 与项目锁定版本的 Base Nova registry 保持一致；Web 源码和直接依赖 MUST NOT 保留 Radix primitive、Slot 兼容层、legacy `new-york` 样式或 CNode 专属 primitive variant。

#### Scenario: 新建页面使用原子组件

- **WHEN** 开发者在 `routes/` 下新建页面
- **THEN** 页面内已有 shadcn 对应物的按钮、输入、字段、卡片、列表、状态、菜单、overlay 和空状态 MUST 从 `~/components/ui/` 导入
- **AND** 不得以裸元素和视觉 Tailwind 字符串重建相同 primitive
- **AND** 键盘与辅助技术用户 MUST 能识别控件的名称、角色和当前状态。

#### Scenario: 组件源码进仓库

- **WHEN** 查看 `apps/web/app/components/ui/`
- **THEN** 已安装组件 MUST 是完整的 Base Nova 组件源码而不是 npm re-export
- **AND** `components.json` MUST 让 shadcn CLI 将项目识别为 Base Nova 而不是 Radix `new-york`。

#### Scenario: 页面使用一致的语义组件

- **WHEN** 页面渲染按钮、输入框、选择器、反馈、分页或空状态
- **THEN** 用户看到的颜色、圆角、密度、焦点和禁用状态 MUST 与同类品牌组件一致
- **AND** 键盘与辅助技术用户 MUST 能识别控件的名称、角色和当前状态。

#### Scenario: 现有组件行为保持可用

- **WHEN** 共享原子组件新增能力或样式更新
- **THEN** 已使用该组件的页面 MUST 保持原有可执行动作和导航结果
- **AND** 不得因 Base UI 或 Base Nova realignment 改变既有业务动作、导航结果或权限入口。

#### Scenario: 组件组合使用 Base UI render

- **WHEN** Button、Dialog trigger、Sheet trigger 或菜单项组合 React Router Link 或其他元素
- **THEN** 组件 MUST 使用 Base UI `render` 或等价原生语义完成组合
- **AND** DOM MUST NOT 产生嵌套 button、重复交互元素或长期 `asChild`/Radix Slot 兼容层。

#### Scenario: Base UI 状态驱动样式

- **WHEN** overlay 打开或关闭、Checkbox 选中、Tabs 激活或菜单高亮
- **THEN** 样式 MUST 由对应 Base UI open/closed/checked/active/highlighted 状态属性驱动
- **AND** 不得依赖已失效的 Radix `data-state` 或 `--radix-*` 变量。

#### Scenario: 迁移完成后清理 Radix

- **WHEN** Web primitive 与消费者迁移完成
- **THEN** `apps/web` 源码 MUST 不再 import `@radix-ui/*` 或 `radix-ui`
- **AND** Web package MUST 不再直接声明 Radix dependencies
- **AND** cmdk、sonner 等非 Radix 库 MUST 保持其既有职责，不得为追求文本零匹配而被无关替换。

### Requirement: Button 变体覆盖现有用法

Button 组件 MUST 只提供锁定 Base Nova 版本定义的标准 variants 和 sizes，并 MUST 保持 `default`、`secondary`、`destructive`、`outline`、`ghost`、`link` variants 以及 `default`、`sm`、`lg`、`icon` sizes 的现有语义覆盖。主操作、次级操作、危险操作、链接与 icon-only 操作 SHALL 使用标准 prop 表达；页面 MUST NOT 新增 `inverse` 等项目专属 variant，或通过 `className` 重定义 Button 颜色、尺寸、padding、圆角和 icon 大小。

#### Scenario: 主按钮替换

- **WHEN** 渲染登录表单的提交按钮
- **THEN** 使用 `<Button>` 默认 variant
- **AND** CNode 主色由 `primary` token 提供，不在 Button 或 route 中写品牌颜色 class，也不保留裸 `<button className="bg-blue-600 ...">`。

#### Scenario: 次级按钮替换

- **WHEN** 渲染取消按钮
- **THEN** 使用 `<Button variant="outline">` 或与动作层级匹配的标准 variant
- **AND** 不得手写边框、背景和 hover 颜色，也不保留裸 `<button className="border border-gray-300 ...">`。

## ADDED Requirements

### Requirement: 标准组件 composition 优先于手写 block

页面 SHALL 优先使用 Base Nova Card、Field、Item、Sidebar、Table/Data Table、Badge、Alert、Empty、Separator、Toggle Group 和 Input Group 的标准 composition；只有包含稳定 CNode 领域结构时才能建立 application block。

#### Scenario: 状态和空结果展示

- **WHEN** 页面展示状态标签、错误说明或空结果
- **THEN** 分别使用 Badge、Alert 或 Empty 的标准 composition
- **AND** 不得手写具有相同角色的品牌色 span 或 surface div。

#### Scenario: Card 含标题、说明和操作

- **WHEN** Card 同时包含标题、说明和右侧操作
- **THEN** 使用 CardHeader、CardTitle、CardDescription 和 CardAction
- **AND** 不得以自定义 flex header 和独立 padding 模拟相同结构。
