# navigation-shell Specification

## MODIFIED Requirements

### Requirement: 主站 Header cluster 模型

主站 Header SHALL 将官方 logo 与搜索/命令入口放在左侧 cluster，将辅助导航、专区下拉、主 CTA、消息/通知和 profile 放在右侧 cluster。

#### Scenario: 桌面端主站 Header 顺序

- **WHEN** 主站 Header 在桌面端渲染
- **THEN** 顺序为 logo、搜索/命令入口、弹性空间、专区下拉、指引入口、"发布话题"、消息/通知、profile
- **AND** profile 是最右侧交互项。

### Requirement: 移动端 Header 优先级

移动端 Header SHALL 简化为 logo、搜索/菜单入口、专区下拉入口、消息/通知入口和 profile/menu 入口，避免辅助文字导航拥挤。

#### Scenario: 移动端导航不拥挤

- **WHEN** viewport 为移动端宽度
- **THEN** 专区下拉和指引入口折叠到 sheet、command palette 或菜单中
- **AND** 主要触摸目标高度至少为 36px。

## ADDED Requirements

### Requirement: 专区下拉导航

主站 Header SHALL 包含"专区"下拉导航，聚合所有 `zones.visible=true` 的专区入口。专区列表 SHALL 从 `root.tsx` loader 异步加载，不再硬编码。无可见专区时 SHALL 隐藏"专区"下拉。

#### Scenario: 桌面端专区下拉

- **WHEN** 桌面端用户点击或 hover "专区"
- **THEN** 展示下拉菜单，含所有 `zones.visible=true` 的专区入口
- **AND** 专区入口按 `sort_order` 升序排列
- **AND** 每个入口指向 `/zone/:slug`

#### Scenario: 移动端专区入口折叠

- **WHEN** 移动端用户打开导航 sheet
- **THEN** 专区入口与指引入口一起在 sheet 内展示
- **AND** 不在顶栏直接占用空间

#### Scenario: 无可见专区时下拉隐藏

- **WHEN** 所有专区 `visible=false`
- **THEN** 导航栏不展示"专区"下拉
- **AND** 不报错

### Requirement: 指引入口合并

主站 Header SHALL 将原有的"入门"/"API"/"关于"三个独立链接合并为单一"指引"入口，指向 `/help`。

#### Scenario: 指引入口指向 /help

- **WHEN** 桌面端 Header 渲染
- **THEN** 辅助导航区域展示"指引"链接指向 `/help`
- **AND** 不再单独展示"入门"/"关于"链接

#### Scenario: API 文档不再在导航栏直接暴露

- **WHEN** 桌面端 Header 渲染
- **THEN** "API" 链接不在导航栏直接展示
- **AND** 用户通过 `/help` 页面的链接访问 `/api`
