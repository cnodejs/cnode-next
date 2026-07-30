# navigation-shell Specification

## Purpose

定义主站和后台导航 shell 的 header cluster 模型、logo 行为、搜索入口、发布 CTA、后台上下文和移动端优先级要求。
## Requirements
### Requirement: 主站 Header cluster 模型

主站 Header SHALL 将官方 logo 与搜索/命令入口放在左侧 cluster，将专区入口、`API` 一级入口、关于下拉、主 CTA、消息/通知和 profile 放在右侧 cluster。

#### Scenario: 桌面端主站 Header 顺序

- **WHEN** 主站 Header 在桌面端渲染
- **THEN** 顺序为 logo、搜索/命令入口、弹性空间、专区入口、`API`、关于下拉、"发布话题"、消息/通知、profile
- **AND** profile 是最右侧交互项。

### Requirement: Logo 替代重复首页导航

桌面端主站 Header SHALL 使用 logo 作为回首页链接，并 SHALL NOT 要求额外的“首页”文字导航项。

#### Scenario: 通过 logo 返回首页

- **WHEN** 桌面端用户点击 logo
- **THEN** 应用导航到 `/`
- **AND** 桌面主导航中不需要重复的“首页”项。

### Requirement: 搜索是一级导航能力

搜索 SHALL 渲染为 command/search entry，而不是普通文字链接，并 SHALL 说明可搜索范围。

#### Scenario: 搜索入口展示快捷提示

- **WHEN** 桌面端 Header 渲染
- **THEN** 搜索入口显示类似“搜索话题、用户...”的 placeholder
- **AND** 在支持时展示命令快捷键提示。

### Requirement: 发布话题 CTA 醒目

“发布话题” SHALL 在桌面端 Header 中保持可见，作为唯一 primary CTA，并 SHALL 引导匿名用户登录而不是隐藏。

#### Scenario: 匿名用户点击发布 CTA

- **WHEN** 匿名用户触发“发布话题”
- **THEN** 用户进入认证流程，并带有登录后继续到 `/topic/create` 的意图。

### Requirement: 后台 Header 共享产品 shell

后台页面 SHALL 使用与主站相同的 cluster 模型，通过 Admin badge 和后台导航模式区分上下文，而不是形成独立应用 shell。

#### Scenario: 后台 Header 保持品牌一致

- **WHEN** `/admin` 页面渲染
- **THEN** 页面展示 CNode logo、Admin 模式标识、后台导航、主题/用户工具和返回主站入口
- **AND** 使用与主站一致的品牌 token 和交互状态。

### Requirement: 移动端 Header 优先级

移动端 Header SHALL 简化为 logo、搜索/菜单入口、专区下拉入口、消息/通知入口和 profile/menu 入口，避免辅助文字导航拥挤。

#### Scenario: 移动端导航不拥挤

- **WHEN** viewport 为移动端宽度
- **THEN** 专区下拉和指引入口折叠到 sheet、command palette 或菜单中
- **AND** 主要触摸目标高度至少为 36px。

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
