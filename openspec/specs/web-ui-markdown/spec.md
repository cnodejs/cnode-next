## Requirements

### Requirement: react-markdown 作为 Markdown 渲染器

`apps/web/app/components/MarkdownView.tsx` MUST 用 `react-markdown` 渲染 Markdown 内容,替换现状(直接 `<div className="whitespace-pre-wrap">{content}</div>` 的 TODO 桩)。pipeline SHALL 为 `react-markdown` + `remark-gfm` + `rehype-sanitize` + `rehype-highlight`。

#### Scenario: 话题正文渲染 Markdown

- **WHEN** 渲染话题详情页的 `topic.content`
- **THEN** `MarkdownView` 用 react-markdown 解析,标题/列表/代码块/链接等正确渲染,不再是纯文本

#### Scenario: 回复正文渲染 Markdown

- **WHEN** 渲染话题详情页的回复列表
- **THEN** 每条回复用 `MarkdownView` 渲染,支持行内代码、引用、粗体等

### Requirement: GFM 扩展支持

`MarkdownView` SHALL 通过 `remark-gfm` 插件支持 GFM 语法,包括表格、删除线、任务列表、自动链接。

#### Scenario: 表格语法渲染

- **WHEN** Markdown 内容包含 `| a | b |\n| --- | --- |\n| 1 | 2 |`
- **THEN** 渲染为 `<table>` 而非保留原始文本

### Requirement: XSS 防护为硬性要求

`MarkdownView` MUST 通过 `rehype-sanitize` 对所有渲染出的 HTML 做净化。sanitize schema SHALL 放行 `class` 属性(供 rehype-highlight 加 class),但 MUST 阻断 `<script>`、`on*` 事件属性、`javascript:` 链接。

#### Scenario: script 标签被剥离

- **WHEN** Markdown 内容(或通过 HTML 嵌入)包含 `<script>alert(1)</script>`
- **THEN** 渲染结果中不出现 `<script>`,不执行 alert

#### Scenario: onerror 被剥离

- **WHEN** 内容包含 `<img src=x onerror=alert(1)>`
- **THEN** 渲染的 `<img>` 无 `onerror` 属性

### Requirement: 代码块高亮

`MarkdownView` SHALL 通过 `rehype-highlight` 给代码块加语法高亮 class。`apps/web/app/styles/global.css` 或独立 CSS SHALL 引入 highlight.js 主题(或自定义基于 token 的高亮样式),light/dark 各一份。

#### Scenario: 代码块带高亮 class

- **WHEN** 渲染 `js\nconst x = 1\n`
- **THEN** 输出 `<code class="hljs language-js">` 且 `const`/`1` 等有高亮 span 包裹

### Requirement: MarkdownEditor 预览复用 MarkdownView

`apps/web/app/components/MarkdownEditor.tsx` 的预览分支 SHALL 直接渲染 `<MarkdownView content={value} />`,不自己实现预览逻辑,保证编辑与最终展示一致。

#### Scenario: 编辑器预览与最终渲染一致

- **WHEN** 用户在编辑器点"预览"
- **THEN** 看到的渲染效果与发布后话题页完全一致(同 pipeline)

### Requirement: prose 样式与 token 一致

Markdown 渲染容器的 `.prose` 样式 SHALL 用语义 token 而非固定色值(`prose-headings:text-foreground`/`prose-p:text-muted-foreground`/`prose-code:bg-muted` 等),dark mode 由 token 切换,不写 `dark:prose-invert`。

#### Scenario: dark mode 下 prose 跟随

- **WHEN** 切到 dark mode
- **THEN** Markdown 正文文字色、代码块背景色跟随 token 变化,无需 `dark:` 变体
