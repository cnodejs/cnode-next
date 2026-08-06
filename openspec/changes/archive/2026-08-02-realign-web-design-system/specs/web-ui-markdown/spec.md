## MODIFIED Requirements

### Requirement: MarkdownEditor 预览复用 MarkdownView

`apps/web/app/components/MarkdownEditor.tsx` 的预览和双栏预览 MUST 直接渲染与发布后相同的 `MarkdownView`、Markdown pipeline 和 `.typeset-docs` preset；相同内容在相同可用宽度下 MUST 具有一致的标题、段落、列表、代码、表格与图片节奏。

#### Scenario: 编辑器预览与最终渲染一致

- **WHEN** 用户在编辑器点击“预览”或以双栏模式预览话题或回复 Markdown
- **THEN** 预览和最终内容使用同一 Markdown pipeline 和 `.typeset-docs` preset，渲染效果与发布后内容一致
- **AND** 不得由编辑器容器额外覆写正文颜色、列表 marker、字体大小或 block spacing。

### Requirement: prose 样式与 token 一致

项目 SHALL 从 `https://ui.shadcn.com/typeset.css` 持有未定制的上游 Typeset stylesheet，并 SHALL 在 Tailwind import 后导入。全部 `MarkdownView` SHALL 使用 `typeset typeset-docs` 容器；`.typeset-docs` MUST 使用 Roboto Variable 作为 body、heading 和 mono font，并定义 `14px` size、`1.75` leading 与 `1.25em` flow。颜色、圆角与内容表面 MUST 消费 semantic theme tokens，dark mode 不得依赖独立 `prose-invert` palette。

#### Scenario: Typeset stylesheet 和字体安装

- **WHEN** 审查 Web 样式入口和依赖
- **THEN** `typeset.css` 位于主 CSS 同目录并在 Tailwind 后导入，`@fontsource-variable/roboto` 已安装并导入
- **AND** `--font-roboto` 与 `.typeset-docs` 的三个 font variables 使用 Roboto Variable。

#### Scenario: 全部 MarkdownView 使用统一 surface

- **WHEN** 话题、回复或 MarkdownEditor preview 渲染 MarkdownView
- **THEN** renderer 根容器包含 `typeset typeset-docs`
- **AND** 所有 surface 使用同一 rhythm，不保留 `.markdown-body` 或 route-specific typography class。

#### Scenario: dark mode 下 Typeset 跟随

- **WHEN** 用户切换到 dark mode
- **THEN** Markdown 正文、链接、引用、列表、代码、表格和图片边界自动跟随 semantic tokens
- **AND** 不需要 route 或 Markdown component 增加手工 dark color class。

#### Scenario: dark mode 下 prose 跟随

- **WHEN** 切到 dark mode
- **THEN** Markdown 正文文字色、代码块背景色及其他 Typeset 内容跟随 semantic tokens 变化
- **AND** 不写 `dark:prose-invert` 或其他手工 `dark:` 颜色变体。

#### Scenario: Typeset 只影响 Markdown surface

- **WHEN** 页面同时包含 Markdown 和嵌入式交互组件
- **THEN** Typeset selector MUST 不影响容器外内容
- **AND** 不应继承 Typeset 的嵌入组件使用 `not-typeset` 或 `data-not-typeset` 隔离。

## ADDED Requirements

### Requirement: Markdown 列表保持完整结构语义和视觉层级

Markdown Typeset MUST 正确呈现无序列表、有序列表、嵌套列表、混合列表、任务列表、loose list 及列表内段落、引用和代码块；Tailwind reset MUST NOT 移除可见 marker、序号、缩进或层级关系。

#### Scenario: 无序和有序列表

- **WHEN** Markdown 包含 `- item` 或 `1. item`
- **THEN** 无序列表显示项目 marker，有序列表显示稳定序号
- **AND** marker、正文和嵌套内容在 light/dark 下均可辨识。

#### Scenario: 嵌套和任务列表

- **WHEN** Markdown 包含多层嵌套列表或 GFM task list
- **THEN** 每层具有可辨识缩进和 marker 层级，checkbox 与标签正确对齐
- **AND** 375px viewport 不产生正文级水平溢出。

#### Scenario: 列表内复杂 block

- **WHEN** list item 包含段落、引用或 fenced code block
- **THEN** block spacing 保持所属列表层级
- **AND** 代码区域可在自身边界内滚动而不撑破页面。
