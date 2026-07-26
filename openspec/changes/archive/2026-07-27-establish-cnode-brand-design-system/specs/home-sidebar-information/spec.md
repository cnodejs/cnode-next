## ADDED Requirements

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
