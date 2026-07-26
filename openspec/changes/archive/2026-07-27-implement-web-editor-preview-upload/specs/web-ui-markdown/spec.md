## ADDED Requirements

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
