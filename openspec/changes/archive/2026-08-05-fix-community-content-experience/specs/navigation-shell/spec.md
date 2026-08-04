## ADDED Requirements

### Requirement: CommandPalette 关闭控件不得覆盖搜索输入

CommandPalette SHALL 在搜索行布局中为关闭控件分配独立空间，关闭控件 MUST NOT 绝对定位覆盖输入文字、光标或输入框交互区域。关闭操作 SHALL 保持可访问名称、Escape 关闭、键盘可达、触控可达和关闭后焦点返回。

#### Scenario: 桌面端 CommandPalette 搜索行

- **WHEN** 用户在桌面端打开 CommandPalette
- **THEN** 搜索输入和关闭控件在同一行正确对齐且互不重叠
- **AND** 输入内容不会进入关闭控件的点击区域
- **AND** 关闭控件具有可感知的 focus state。

#### Scenario: 移动端 CommandPalette 关闭操作

- **WHEN** 用户在移动端打开 CommandPalette 并聚焦搜索输入
- **THEN** 关闭控件在虚拟键盘出现后仍可见或可滚动到达
- **AND** 触摸目标符合 navigation shell 的最小尺寸要求
- **AND** 不产生水平溢出。

#### Scenario: 关闭后恢复焦点

- **WHEN** 用户点击关闭控件或按 Escape 关闭 CommandPalette
- **THEN** overlay 关闭
- **AND** 焦点返回打开 CommandPalette 的触发控件或此前有效焦点目标。
