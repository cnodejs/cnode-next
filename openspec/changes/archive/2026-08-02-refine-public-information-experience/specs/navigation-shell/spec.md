## MODIFIED Requirements

### Requirement: 主站 Header cluster 模型

主站 Header SHALL 将官方 logo 与搜索/命令入口放在左侧 cluster，将专区入口、`API` 一级入口、`关于` 一级入口、主 CTA、消息/通知和 profile 放在右侧 cluster。

#### Scenario: 桌面端主站 Header 顺序

- **WHEN** 主站 Header 在桌面端渲染
- **THEN** 顺序为 logo、搜索/命令入口、弹性空间、专区入口、`API`、`关于`、"发布话题"、消息/通知、profile
- **AND** `关于` 是直接指向 `/about` 的普通导航链接，不渲染下拉菜单
- **AND** profile 是最右侧交互项。

### Requirement: 指引入口合并

主站 SHALL 使用 `/about` 作为社区介绍、参与指南、讨论规范和常见问题的唯一内容入口。`API` SHALL 继续作为一级导航指向 `/api`，导航 shell SHALL NOT 暴露 `/help`、`/getstart` 或 `/faq`。

#### Scenario: 桌面端关于入口

- **WHEN** 桌面端 Header 渲染
- **THEN** 辅助导航区域展示 `API` 链接指向 `/api`
- **AND** 展示 `关于` 链接直接指向 `/about`
- **AND** 不展示关于下拉、指引总览、新手指南或常见问题独立入口。

#### Scenario: 移动端导航同步

- **WHEN** 移动端用户打开导航 sheet
- **THEN** sheet 展示可访问 `/api` 的 `API` 入口和指向 `/about` 的“关于”入口
- **AND** 不展示 `/help`、`/getstart` 或 `/faq` 入口。

#### Scenario: CommandPalette 公开内容入口同步

- **WHEN** 用户打开 CommandPalette
- **THEN** 快捷操作至多展示一个指向 `/about` 的“关于 CNode”公开内容入口
- **AND** 不展示新手指南或常见问题独立快捷入口。
