# web-ui-markdown Specification

## Purpose

定义 Web Markdown 渲染、GFM 支持、XSS 防护、代码高亮、编辑器预览和 prose token 样式要求，确保话题和回复内容安全且一致展示。
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

### Requirement: MarkdownEditor 支持三种创作视图

`MarkdownEditor` SHALL 支持 Markdown 编辑、预览、双栏编辑 + 预览三种视图模式。预览和双栏预览区域 MUST 复用 `MarkdownView` 渲染当前 Markdown 内容。

#### Scenario: Markdown 编辑模式

- **WHEN** 用户选择编辑模式
- **THEN** 编辑器显示可输入 Markdown 的 textarea
- **AND** textarea 的内容变化会同步到调用方传入的 `onChange`

#### Scenario: 预览模式

- **WHEN** 用户选择预览模式
- **THEN** 编辑器隐藏 textarea 并使用 `MarkdownView` 渲染当前内容
- **AND** 渲染结果与发布后话题或回复正文使用同一 Markdown pipeline

#### Scenario: 双栏编辑预览模式

- **WHEN** 用户在桌面端选择双栏模式
- **THEN** 编辑器左侧显示 Markdown textarea，右侧显示 `MarkdownView` 预览
- **AND** 用户输入时右侧预览实时更新

#### Scenario: 移动端双栏降级

- **WHEN** 用户在移动端 viewport 使用编辑器
- **THEN** 双栏模式 MUST 降级为可用的编辑/预览切换布局
- **AND** 不得出现 textarea 或预览区域被挤压到不可读的状态

### Requirement: MarkdownEditor 支持图片上传插入

`MarkdownEditor` SHALL 支持通过工具栏选择图片、粘贴图片和拖拽图片上传。上传成功后 MUST 在当前光标位置插入 Markdown 图片语法 `![alt](url)`。

#### Scenario: 工具栏选择图片上传

- **WHEN** 登录用户点击图片按钮并选择合法图片文件
- **THEN** 系统上传图片并在成功后插入 `![文件名](图片URL)`

#### Scenario: 粘贴截图上传

- **WHEN** 用户在编辑器中粘贴剪贴板图片
- **THEN** 系统上传该图片并在当前光标位置插入对应 Markdown 图片语法

#### Scenario: 拖拽图片上传

- **WHEN** 用户将图片文件拖拽到编辑器输入区域
- **THEN** 系统上传图片并将返回 URL 插入正文

#### Scenario: 上传失败不污染正文

- **WHEN** 图片上传失败或文件校验失败
- **THEN** 编辑器显示错误反馈
- **AND** 正文内容不插入损坏 URL 或占位 Markdown

### Requirement: 图片上传必须校验与鉴权

图片上传 API MUST 要求登录态，且 MUST 校验文件类型、扩展名和大小。非法文件 SHALL 被拒绝并返回可展示的错误信息。

#### Scenario: 未登录用户上传图片

- **WHEN** 未登录用户尝试从编辑器上传图片
- **THEN** 上传请求被拒绝
- **AND** 编辑器提示用户需要登录后上传

#### Scenario: 非图片文件被拒绝

- **WHEN** 用户选择非图片文件作为上传内容
- **THEN** API 拒绝该文件
- **AND** 编辑器展示文件类型不支持的错误

#### Scenario: 超过大小限制的图片被拒绝

- **WHEN** 用户选择超过允许大小的图片
- **THEN** API 拒绝该文件
- **AND** 编辑器展示文件过大的错误

### Requirement: 发布话题页写作区优先级

发布话题页 SHALL 将 MarkdownEditor 作为页面主任务区域，正文编辑器高度必须高于通用回复编辑器默认高度，提交按钮必须位于清晰的表单操作区。写作类页面的提交型主动作 SHALL 统一右侧对齐。

#### Scenario: 发布页编辑器默认更高

- **WHEN** 用户访问 `/topic/create`
- **THEN** 正文 MarkdownEditor 的可输入区域默认高度 SHALL 明显高于通用默认回复编辑器
- **AND** 用户无需立即手动拖拽即可看到足够的写作空间。

#### Scenario: 发布按钮右侧对齐

- **WHEN** 发布话题表单渲染提交操作
- **THEN** “发布”按钮位于表单底部操作区的右侧或等价主操作位置
- **AND** 不与正文、Turnstile 或辅助说明混在同一视觉层级。

#### Scenario: 编辑内容页面主动作位置一致

- **WHEN** 用户在编辑话题或编辑回复页面修改 Markdown 内容
- **THEN** 保存/提交按钮位于表单底部操作区右侧
- **AND** 取消等辅助按钮不比主提交按钮更突出。
