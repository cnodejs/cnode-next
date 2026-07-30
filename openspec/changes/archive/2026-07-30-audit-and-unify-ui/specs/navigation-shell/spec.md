## MODIFIED Requirements

### Requirement: 主站 Header cluster 模型

主站 Header SHALL 将官方 logo 与搜索/命令入口放在左侧 cluster，将专区入口、`API` 一级入口、关于下拉、主 CTA、消息/通知和 profile 放在右侧 cluster。

#### Scenario: 桌面端主站 Header 顺序

- **WHEN** 主站 Header 在桌面端渲染
- **THEN** 顺序为 logo、搜索/命令入口、弹性空间、专区入口、`API`、关于下拉、"发布话题"、消息/通知、profile
- **AND** profile 是最右侧交互项。

### Requirement: 指引入口合并

主站 Header SHALL 不再展示“指引总览”入口。`API` SHALL 作为一级导航指向 `/api`；“关于”下拉 SHALL 只包含“新手指南”“常见问题”“关于我们”。

#### Scenario: 指引入口指向 /help

- **WHEN** 桌面端 Header 渲染
- **THEN** 辅助导航区域展示 `API` 链接指向 `/api`
- **AND** `API` 不在“关于”下拉菜单内重复展示。

#### Scenario: API 文档不再在导航栏直接暴露

- **WHEN** 用户打开“关于”下拉菜单
- **THEN** 菜单按顺序展示“新手指南”“常见问题”“关于我们”
- **AND** 不展示“指引总览”或“API 文档”。

#### Scenario: 移动端导航同步

- **WHEN** 移动端用户打开导航 sheet
- **THEN** sheet 内不展示“指引总览”
- **AND** 展示可访问 `/api` 的 `API` 入口、`/getstart` 的“新手指南”、`/faq` 的“常见问题”和 `/about` 的“关于我们”。

## ADDED Requirements

### Requirement: 用户设置入口命名

已登录用户菜单 SHALL 使用“用户设置”作为设置入口文案，并在桌面下拉和移动端导航中保持一致。

#### Scenario: 桌面用户菜单展示用户设置

- **WHEN** 已登录用户打开头像菜单
- **THEN** 设置入口文案为“用户设置”
- **AND** 入口指向 `/setting`。

### Requirement: CommandPalette 权限感知

CommandPalette SHALL 按当前用户权限过滤快捷入口和可跳转结果。普通用户和匿名用户 MUST NOT 看到或搜索到后台管理入口；具备后台访问权限的用户 MAY 看到后台入口。

#### Scenario: 匿名用户不看到管理后台入口

- **WHEN** 匿名用户打开 CommandPalette
- **THEN** 快捷入口和搜索结果中不展示“管理后台”
- **AND** 不展示任何 `/admin` 路径入口。

#### Scenario: 普通登录用户不看到管理后台入口

- **WHEN** 非 admin 且非 mod 的登录用户打开 CommandPalette
- **THEN** 快捷入口和搜索结果中不展示“管理后台”
- **AND** 不展示任何 `/admin` 路径入口。

#### Scenario: 管理人员看到管理后台入口

- **WHEN** admin 或 mod 用户打开 CommandPalette
- **THEN** 系统可以展示“管理后台”或等价后台入口
- **AND** 入口指向其有权限访问的后台页面。

#### Scenario: 移动端导航展示用户设置

- **WHEN** 已登录用户打开移动端导航 sheet
- **THEN** 设置入口文案为“用户设置”
- **AND** 入口指向 `/setting`。
