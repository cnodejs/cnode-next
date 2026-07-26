## ADDED Requirements

### Requirement: Topic 详情 reading layout

Topic 详情页 SHALL 根据 viewport 使用 reading layout，包含中间 topic 内容和上下文 rails。

#### Scenario: 大桌面 reading layout

- **WHEN** topic 详情页在大桌面 viewport 渲染
- **THEN** 它使用可选左侧 TOC rail、中间内容列和右侧上下文 rail
- **AND** 内容列保持可读行宽。

### Requirement: 面包屑和分类上下文

Topic 详情页 SHALL 在标题前展示包含首页和本地化分类标签的面包屑上下文。

#### Scenario: 面包屑使用用户可读标签

- **WHEN** tab 为 `ask` 的 topic 渲染
- **THEN** 面包屑或分类上下文展示“问答”等用户可读标签，而不是仅展示 raw `ask`。

### Requirement: Topic Header 信息层级

Topic Header SHALL 包含状态 badges、分类 tag、标题、作者、发布时间、可用时的最后回复时间、回复数、浏览数和 actions。

#### Scenario: Topic Header metadata

- **WHEN** topic 详情页渲染
- **THEN** 作者、发布时间、回复数、浏览数和 tags 在标题附近以设计好的 metadata layout 可见。

### Requirement: Topic body surface

Markdown 内容 SHALL 在专门的可读 surface 中渲染，并使用品牌 prose 样式。

#### Scenario: Markdown prose 样式

- **WHEN** topic 内容包含 headings、links、blockquotes、code blocks、tables 或 images
- **THEN** 每类元素都使用可读间距、品牌链接色、安全代码样式和响应式图片/表格行为。

### Requirement: Topic TOC

Topic 详情页 SHALL 在存在足够合格 Markdown h2/h3 headings 时生成 TOC。

#### Scenario: 长文显示 TOC

- **WHEN** topic body 包含至少两个合格 h2/h3 headings
- **THEN** 大桌面左侧 rail 显示 TOC
- **AND** TOC links 滚动到稳定 heading anchors。

#### Scenario: 移动端 TOC 折叠

- **WHEN** 同一 topic 在移动端渲染
- **THEN** TOC 作为正文前的 collapsible disclosure 可用
- **AND** 它不占用固定侧边 rail。

### Requirement: Topic context rail

Topic 详情页 SHALL 包含右侧上下文 rail，展示作者摘要、topic stats、相关话题或最新回复，以及可选合作/资源模块。

#### Scenario: Context rail 包含 topic 上下文

- **WHEN** topic 详情页在桌面端渲染
- **THEN** 右侧 rail 包含作者与 topic 上下文，而不是重复正文。

### Requirement: Topic 状态处理

Topic 详情 SHALL 为 loading、not-found、deleted、locked、no-reply 和 unauthenticated reply 状态提供设计好的 UI。

#### Scenario: Locked topic 回复状态

- **WHEN** topic 被锁定
- **THEN** 页面在 topic header 附近展示锁定提示
- **AND** 回复编辑器被替换为解释性的 disabled state。
