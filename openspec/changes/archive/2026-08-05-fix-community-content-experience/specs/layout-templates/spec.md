## MODIFIED Requirements

### Requirement: Reading 模板

Topic 详情页 SHALL 使用 reading 模板，在大桌面使用主可读内容列和右侧上下文 rail。目录 SHALL 位于正文顶部的折叠 disclosure 中，不得建立独立左侧 TOC rail。

#### Scenario: Topic 详情不使用临时居中文章

- **WHEN** topic 详情页在桌面端渲染
- **THEN** 它不会把全部内容包在与 shell 无关的居中 `max-w-3xl` article 中
- **AND** 它与 reading shell template 对齐
- **AND** 正文顶部目录不会缩减主内容的 grid 列宽。

### Requirement: Content 模板

静态内容页 SHALL 使用 content 模板，包括 hero、具有明确视觉边界和响应式 block spacing 的结构化 sections，以及可选 TOC/related navigation。多个主要 sections 不得仅依赖单一外层 Card 和连续细分隔线表达层级。

#### Scenario: About 页面不是占位

- **WHEN** `/about` 渲染
- **THEN** 它包含设计好的 hero 和至少一个结构化内容 section
- **AND** 它不是单行占位文本。

#### Scenario: About 主要模块形成独立阅读分组

- **WHEN** `/about` 展示社区介绍、参与指南、讨论规范、社区合作、社区客户端和常见问题
- **THEN** 每个主要模块以独立 section 和留白形成可辨识分组
- **AND** 桌面模块间距不小于 64px，移动端模块间距不小于 48px
- **AND** 内部重复 Card 或 Item 的 gap 不小于 16px
- **AND** 页面不使用一张 Card 包住全部主要模块。
