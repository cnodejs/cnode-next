## ADDED Requirements

### Requirement: 亮暗主题可读对比度

light 与 dark 主题中的文本、链接、边框、焦点指示、状态提示和交互控件 SHALL 使用可辨识的语义颜色组合。普通文本与背景的对比度 MUST 至少为 4.5:1，大号文本 MUST 至少为 3:1；交互控件边界、状态图形和 focus 指示与相邻颜色的对比度 MUST 至少为 3:1。

#### Scenario: light 主题阅读和操作

- **WHEN** 用户以 light 主题查看正文、muted metadata、链接、表单和 destructive 提示
- **THEN** 每类内容 MUST 达到其适用的最低对比度
- **AND** 链接、错误和 destructive 状态 MUST NOT 仅依赖难以辨识的浅色差表达。

#### Scenario: dark 主题阅读和操作

- **WHEN** 用户以 dark 主题查看卡片、popover、表单、disabled 状态和 focus 指示
- **THEN** 前景与对应背景 MUST 达到其适用的最低对比度
- **AND** disabled 与 enabled 状态 MUST 可区分，但 disabled 文本不得因此变成不可读。

#### Scenario: 键盘焦点在两种主题中可见

- **WHEN** 键盘用户在 light 或 dark 主题中移动焦点
- **THEN** 当前交互元素 MUST 显示连续且可辨识的 focus 指示
- **AND** focus 指示不得被 overflow 裁切或仅依赖颜色极接近的阴影。

### Requirement: 浏览器主题集成

页面 SHALL 根据当前生效主题向浏览器声明匹配的 color scheme 和 theme color；system 模式变化后，浏览器 chrome 与原生表单控件 MUST 跟随实际生效的 light 或 dark 主题。

#### Scenario: 固定 dark 主题

- **WHEN** 用户选择 dark 主题
- **THEN** 浏览器 color scheme MUST 表示 dark
- **AND** theme color MUST 使用与 dark 页面背景协调且可识别的颜色。

#### Scenario: system 主题实时变化

- **WHEN** 用户选择 system 且操作系统从 light 切换到 dark
- **THEN** 页面主题、浏览器 color scheme 和 theme color MUST 在不刷新页面的情况下同步为 dark
- **AND** 原生选择器、滚动条及浏览器提供的控件 MUST 使用匹配的配色。

### Requirement: Reduced motion

当用户声明 `prefers-reduced-motion: reduce` 时，Web UI SHALL 移除非必要的平滑滚动、位移、缩放、旋转和长时过渡，同时保留状态变化及操作结果的可理解性。

#### Scenario: reduced motion 下打开 overlay

- **WHEN** 用户启用 reduced motion 并打开 Dialog、Sheet、DropdownMenu 或 Command overlay
- **THEN** overlay MUST 立即出现或仅使用最短的非位移动画
- **AND** 焦点移动和可见状态 MUST 保持正确。

#### Scenario: reduced motion 下页内导航

- **WHEN** 用户启用 reduced motion 并触发回到顶部或锚点导航
- **THEN** 页面 MUST 不执行持续平滑滚动
- **AND** 最终滚动位置和焦点目标 MUST 与普通模式一致。

#### Scenario: 未声明 reduced motion

- **WHEN** 用户未请求 reduced motion
- **THEN** 状态过渡 MAY 使用品牌动画
- **AND** 动画 MUST NOT 阻止用户在过渡期间取消、关闭或继续操作。
