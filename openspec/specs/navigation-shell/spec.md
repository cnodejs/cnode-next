# navigation-shell Specification

## Purpose

定义主站和后台导航 shell 的 header cluster 模型、logo 行为、搜索入口、发布 CTA、后台上下文和移动端优先级要求。

## Requirements

### Requirement: 主站 Header cluster 模型

主站 Header SHALL 将官方 logo 与搜索/命令入口放在左侧 cluster，将辅助导航、主 CTA、消息/通知和 profile 放在右侧 cluster。

#### Scenario: 桌面端主站 Header 顺序

- **WHEN** 主站 Header 在桌面端渲染
- **THEN** 顺序为 logo、搜索/命令入口、弹性空间、辅助导航、“发布话题”、消息/通知、profile
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

移动端 Header SHALL 简化为 logo、搜索/菜单入口、必要的消息/通知入口和 profile/menu 入口，避免辅助文字导航拥挤。

#### Scenario: 移动端导航不拥挤

- **WHEN** viewport 为移动端宽度
- **THEN** 辅助导航链接折叠到 sheet、command palette 或菜单中
- **AND** 主要触摸目标高度至少为 36px。
