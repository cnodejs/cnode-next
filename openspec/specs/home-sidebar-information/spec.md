## Purpose

定义首页 sidebar 展示的社区信息模块、服务端数据来源、外部链接安全要求，以及桌面和移动端的响应式呈现行为。
## Requirements
### Requirement: Sidebar 社区仪表盘

首页 sidebar SHALL 作为社区仪表盘，包含参与入口、动态、榜单、合作伙伴和资源模块。

#### Scenario: 桌面端首页 sidebar 模块

- **WHEN** 首页在桌面端渲染
- **THEN** sidebar 包含用户/登录或社区 CTA、最新回复、无人回复话题、积分榜、合作品牌/广告位和资源/社区链接。

### Requirement: 最新回复模块

Sidebar SHALL 包含最新回复，显示回复作者、关联 topic 和相对时间。

#### Scenario: 最新回复 item

- **WHEN** 存在最新回复数据
- **THEN** 每个 item 显示回复作者、topic 标题和相对时间
- **AND** 点击 item 导航到 topic 或 reply anchor。

### Requirement: 无人回复话题模块

Sidebar SHALL 包含无人回复话题作为参与提示，数据 SHALL 来自服务端或缓存数据，而不是仅在当前页面列表上做客户端过滤。

#### Scenario: 无人回复不是当前页过滤

- **WHEN** 首页处于任意 tab 或页码
- **THEN** 无人回复话题代表配置限制内的全社区无人回复话题。

### Requirement: 积分榜模块

Sidebar SHALL 包含积分榜，展示 top users、头像或确定性 fallback、积分，并链接完整 Top100 页面。

#### Scenario: 积分榜 item

- **WHEN** 存在 top users 数据
- **THEN** 每行显示排名、头像、loginname 和 score
- **AND** 模块链接到完整积分榜。

### Requirement: 合作品牌和广告位

Sidebar SHALL 提供克制的合作品牌/赞助/广告位，并有清晰标签且无欺骗性交互。

#### Scenario: 合作位标签

- **WHEN** 合作内容渲染
- **THEN** 它被标记为合作伙伴、赞助、推荐或社区支持
- **AND** 外部链接使用 `rel="noopener noreferrer"` 安全打开。

### Requirement: Sidebar 响应式位置

重要 sidebar 模块 SHALL 不在移动端消失，而是重排到 feed 下方或紧凑 sections 中。

#### Scenario: 移动端 sidebar 重排

- **WHEN** 首页在移动端渲染
- **THEN** 发布/登录 CTA、最新回复、积分榜等关键模块在 topic feed 下方或紧凑布局中仍可访问。

### Requirement: Sidebar 数据必须使用公开可见性规则

首页 sidebar 的最新回复和无人回复模块 SHALL 使用与首页公开 feed 一致的可见性规则，不能显示内部 tab、已删除内容或被 block 用户创建的话题。仅处于 mute 状态的用户内容不应因此被隐藏。

#### Scenario: 最新回复排除内部话题
- **WHEN** 首页 sidebar 加载最新回复
- **THEN** 最新回复 MUST 不包含所属话题 `tab=dev` 或 `tab=test` 的回复
- **AND** 点击最新回复不得进入内部话题详情

#### Scenario: 最新回复排除受限话题
- **WHEN** 最新回复属于已删除话题或作者已被 block 的话题
- **THEN** 该回复 MUST 不出现在最新回复模块

#### Scenario: 无人回复排除内部和受限话题
- **WHEN** 首页 sidebar 加载无人回复话题
- **THEN** 无人回复列表 MUST 不包含 `dev/test` 话题
- **AND** MUST 不包含已删除话题
- **AND** MUST 不包含作者已被 block 的话题

#### Scenario: mute 用户内容不从 sidebar 自动隐藏
- **WHEN** 话题作者仅处于 mute 状态且未处于 block 状态
- **THEN** 最新回复和无人回复模块 MUST 按普通公开规则决定是否展示该话题

### Requirement: Sidebar Card 之间保持清晰模块节奏

首页 sidebar 的顶层 Card SHALL 使用一致且可辨识的响应式垂直间距，不得形成边界紧贴的连续面板；该间距调整 MUST 保持既有模块顺序、内部密度和加载前后结构稳定。

#### Scenario: 桌面端 sidebar Card 间距

- **WHEN** 首页在桌面端渲染社区合作、最新回复、积分榜、无人回复和生态资源 Card
- **THEN** 相邻顶层 Card 之间保持 24px 垂直间距
- **AND** 模块顺序保持不变。

#### Scenario: 移动端 sidebar Card 间距

- **WHEN** sidebar 模块重排到移动端 feed 下方
- **THEN** 相邻顶层 Card 之间保持至少 20px 垂直间距
- **AND** 不因间距调整产生水平溢出。

#### Scenario: Sidebar 加载状态不跳变

- **WHEN** Sidebar skeleton 被真实 Card 替换
- **THEN** skeleton 和真实 Card 使用同一顶层间距规则
- **AND** 不额外创建不同的加载态模块节奏。
