## MODIFIED Requirements

### Requirement: Command/search palette

应用 SHALL 提供具有可访问 command 语义的 command/search 入口，用于搜索或跳转到话题、用户、发布流程、消息、内容页和有权限访问的后台页面。Command palette MUST 支持键盘移动、选择、关闭和焦点恢复，并 MUST 向辅助技术表达当前输入、结果集合、活动项和空状态。

#### Scenario: 从 Header 打开 command palette

- **WHEN** 用户触发搜索/命令入口或键盘快捷键
- **THEN** 打开包含有名称的搜索输入和快捷 actions 的 command/search 界面
- **AND** 焦点 MUST 移入搜索输入或当前可操作区域。

#### Scenario: 键盘浏览命令

- **WHEN** command palette 已打开且存在可用结果
- **THEN** 用户 MUST 能使用上、下方向键移动活动结果
- **AND** Enter MUST 执行当前活动命令
- **AND** 活动项 MUST 在视觉上可辨识并由辅助技术读取。

#### Scenario: 关闭后恢复焦点

- **WHEN** 用户按 Escape、选择命令或以关闭控件关闭 command palette
- **THEN** palette MUST 关闭
- **AND** 未发生页面导航时焦点 MUST 返回打开 palette 的触发控件。

#### Scenario: 命令权限保持不变

- **WHEN** command palette 为匿名用户、普通用户、版主或管理员生成命令
- **THEN** 结果 MUST 仅包含该用户原本可访问的目的地和动作
- **AND** command 交互不得扩大任何后台或治理权限。

### Requirement: 搜索结果呈现

搜索结果 SHALL 使用一致的 results layout，包括 empty、loading、error 和 result 状态；每次异步状态变化 MUST 可见并通过适当的 status 或 live region 播报，且过期请求结果 MUST NOT 覆盖当前查询状态。

#### Scenario: 空搜索结果

- **WHEN** 当前搜索完成且没有结果
- **THEN** UI 展示带引导的品牌 Empty 状态，而不是裸文本
- **AND** 辅助技术 MUST 收到没有匹配结果的状态播报。

#### Scenario: 搜索加载中

- **WHEN** 用户输入有效查询且搜索请求尚未完成
- **THEN** 结果区域 MUST 展示 loading 状态
- **AND** loading 状态 MUST 被非打断式播报
- **AND** 不得把上一次查询结果表达为当前查询结果。

#### Scenario: 搜索失败

- **WHEN** 当前搜索请求失败
- **THEN** 结果区域 MUST 展示可理解的错误状态和可用的重试方式
- **AND** 错误 MUST 以适当的 live region 播报
- **AND** palette MUST 保留当前查询文本。

#### Scenario: 搜索结果更新

- **WHEN** 当前搜索请求成功返回一个或多个结果
- **THEN** 页面 MUST 展示结果数量或等价状态并使首个结果可通过键盘到达
- **AND** 辅助技术 MUST 收到结果已更新的播报。

## ADDED Requirements

### Requirement: 全局异步反馈播报

创建、编辑、收藏、治理和批量操作的 pending、success 与 error 反馈 SHALL 以可见品牌反馈呈现，并 MUST 通过适当 live region 播报。相同操作进行中 MUST 防止重复提交，反馈文案 MUST 说明操作对象或结果。

#### Scenario: 异步动作进行中

- **WHEN** 用户触发异步动作且请求尚未完成
- **THEN** 触发控件 MUST 表达 busy 或 disabled 状态并阻止重复提交
- **AND** 页面 MUST 播报操作正在进行
- **AND** 其他不冲突的页面导航和阅读能力 MUST 保持可用。

#### Scenario: 异步动作成功

- **WHEN** 异步动作成功
- **THEN** 页面 MUST 更新可见状态并播报成功结果
- **AND** 成功反馈 MUST 与当前对象和动作一致
- **AND** pending 状态 MUST 被清除。

#### Scenario: 异步动作失败

- **WHEN** 异步动作失败
- **THEN** 页面 MUST 保留操作前可恢复的内容和上下文
- **AND** 展示并播报可理解的失败原因或重试提示
- **AND** 触发控件 MUST 恢复为可再次操作状态。
