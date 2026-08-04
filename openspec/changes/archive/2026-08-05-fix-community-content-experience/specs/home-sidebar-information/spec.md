## ADDED Requirements

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
