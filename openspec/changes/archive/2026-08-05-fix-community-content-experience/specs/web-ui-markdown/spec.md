## ADDED Requirements

### Requirement: Markdown 外链图片失败时提供紧凑降级

`MarkdownView` SHALL 检测图片加载失败并用可访问的紧凑占位卡片替换浏览器默认破图展示。占位卡片 MUST 显示可用的图片描述，并提供手动重试和安全打开原图操作；系统 MUST NOT 自动无限重试或在本变更中代理外部图片。

#### Scenario: 外链图片加载失败

- **WHEN** Markdown 图片请求以网络错误或无有效图片尺寸结束
- **THEN** 页面显示“图片暂时无法加载”或等价状态
- **AND** 显示非空 alt 描述或通用“文章图片”描述
- **AND** 不保留全宽浏览器破图元素。

#### Scenario: 用户手动重试

- **WHEN** 用户在失败占位卡片点击“重新加载”
- **THEN** 系统仅为该图片发起一次新的加载尝试
- **AND** 成功后恢复正常图片
- **AND** 再次失败时保持失败卡片且不进入自动循环。

#### Scenario: 用户打开原图

- **WHEN** 用户点击“打开原图”
- **THEN** 原始图片 URL 在安全的外部浏览上下文中打开
- **AND** 链接使用 `noopener noreferrer`。

#### Scenario: Markdown 图片 DOM 属性保持有效

- **WHEN** `react-markdown` 向自定义图片 renderer 传递 AST 专用属性
- **THEN** renderer 不把 `node="[object Object]"` 或其他非 DOM 属性输出到 `<img>`。
