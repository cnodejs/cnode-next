# feedback-command-system Specification

## Purpose

定义搜索/命令入口、消息通知入口、toast 反馈、loading/empty/error 状态和无效控件处理要求，确保用户操作能获得明确且一致的反馈。

## Requirements

### Requirement: Command/search palette

应用 SHALL 提供 command/search 入口，用于搜索或跳转到话题、用户、发布流程、消息、内容页和有权限访问的后台页面。

#### Scenario: 从 Header 打开 command palette

- **WHEN** 用户触发搜索/命令入口或键盘快捷键
- **THEN** 打开包含搜索输入和快捷 actions 的 command/search 界面。

### Requirement: 搜索结果呈现

搜索结果 SHALL 使用设计好的 results layout，包括 empty、loading、error 和 result 状态。

#### Scenario: 空搜索结果

- **WHEN** 搜索没有结果
- **THEN** UI 展示带引导的品牌 empty state，而不是裸文本。

### Requirement: Message 和 notification 入口

消息/通知 SHALL 拥有一致的 Header 入口、未读 badge、可访问 label，以及 route 或 preview 行为。

#### Scenario: 未读 badge

- **WHEN** unread count 大于 0
- **THEN** 消息/通知入口展示 badge，且不改变相邻 Header actions 的尺寸或对齐。

### Requirement: Toast 反馈

操作反馈 SHALL 使用品牌 toast pattern，覆盖 success、error、loading 和 informational 状态。

#### Scenario: Mutation 成功

- **WHEN** 用户成功创建 topic 或 reply
- **THEN** 使用品牌反馈样式展示 success toast。

### Requirement: Loading empty error 状态

每个 route 和数据驱动模块 SHALL 根据其模板提供设计好的 loading、empty 和 error 状态。

#### Scenario: 数据模块 loading

- **WHEN** sidebar、table、message list 或 search result 正在加载
- **THEN** 展示与 surface 类型一致的 skeleton 或品牌 loading state。

### Requirement: Disabled 和 inert controls

无法执行动作的控件 SHALL disabled 并提供说明，或被省略；可见且 enabled 的控件 MUST NOT 是 inert。

#### Scenario: Inert control 审计

- **WHEN** agent 审计可见 buttons、links 和 menu items
- **THEN** 每个 enabled 控件都会执行其宣称的动作或导航。
