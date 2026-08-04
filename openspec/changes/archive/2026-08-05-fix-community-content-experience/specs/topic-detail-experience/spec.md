## MODIFIED Requirements

### Requirement: Topic 详情 reading layout

Topic 详情页 SHALL 根据 viewport 使用 reading layout，包含主 topic 内容和右侧上下文 rail。目录不得占用独立左侧 rail；主内容列在响应式断点前后 MUST 保持连续且可读的宽度变化。

#### Scenario: 大桌面 reading layout

- **WHEN** topic 详情页在大桌面 viewport 渲染
- **THEN** 它使用中间内容列和右侧上下文 rail
- **AND** 内容列保持可读行宽
- **AND** viewport 从 `xl` 断点下方跨到上方时，内容列不会因新增左侧 rail 而骤然缩窄。

### Requirement: Topic TOC

Topic 详情页 SHALL 在正文存在至少四个合格 Markdown h2/h3 headings 时生成 TOC，并将 TOC 作为正文顶部默认折叠的 disclosure；桌面和移动端 SHALL 使用同一内容结构且不占用固定侧边 rail。

#### Scenario: 长文显示折叠 TOC

- **WHEN** topic body 包含至少四个合格 h2/h3 headings
- **THEN** 正文开始处显示可展开的目录及章节数量
- **AND** 目录默认折叠
- **AND** TOC links 滚动到稳定 heading anchors。

#### Scenario: 短文不显示 TOC

- **WHEN** topic body 包含少于四个合格 h2/h3 headings
- **THEN** 页面不渲染空目录或低价值目录控件。

#### Scenario: 移动端展开和跳转

- **WHEN** 移动端用户展开目录并选择一个章节
- **THEN** 页面跳转到对应稳定 heading anchor
- **AND** 目录在跳转后收起
- **AND** 页面不产生固定侧栏或水平溢出。
