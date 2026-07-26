## Context

当前 `apps/web/app/components/MarkdownEditor.tsx` 是一个受控/非受控混合的 textarea 组件，工具栏只做简单字符串包裹，预览只有单一切换分支，图片按钮只是插入 `![](url)` 文本。`MarkdownView` 已经使用 `react-markdown`、`remark-gfm`、`rehype-sanitize` 和 `rehype-highlight`，因此编辑器不需要重新实现 Markdown 渲染，而应复用它保证“编辑预览”和“发布后展示”一致。

这次变更同时涉及 web 组件、使用编辑器的页面、API 上传入口和 OSS 存储接入。legacy CNode 的相关能力主要来自 `nodeclub/public/` 下前端编辑资源和服务端图片上传逻辑，新项目需要按 React Router + Hono + OSS 的架构重新实现。

## Goals / Non-Goals

**Goals:**

- 提供 Markdown 编辑、预览、双栏编辑 + 预览三种模式。
- 桌面端支持双栏同步预览，移动端降级为编辑/预览切换，避免窄屏不可用。
- 预览统一复用 `MarkdownView`，不在编辑器内复制渲染 pipeline。
- 支持工具栏选择图片、粘贴图片、拖拽图片上传，并把上传结果插入为 Markdown 图片语法。
- 上传接口只允许登录用户上传图片，并进行 MIME、扩展名和大小校验。
- 在现有发帖、编辑话题、编辑回复、回复框中统一使用增强后的编辑器。

**Non-Goals:**

- 不做 WYSIWYG 富文本编辑器。
- 不引入 TipTap、Monaco、Milkdown 等重型编辑器框架。
- 不支持视频、压缩包、PDF 等通用附件。
- 不做图片管理后台、图库复用或历史资源迁移。

## Decisions

### Decision: 保持 textarea + MarkdownView，而不是引入富文本编辑器

使用 textarea 作为 Markdown 输入源，围绕它增强工具栏、选区插入、粘贴/拖拽上传和视图模式。预览区域始终渲染 `<MarkdownView content={value} />`。

替代方案：引入 TipTap/Milkdown 做块编辑或所见即所得。拒绝原因是 CNode 用户更熟悉 Markdown，当前需求是补齐基础能力，引入重型编辑器会增加 SSR、样式、安全、依赖和迁移复杂度。

### Decision: 编辑器提供 viewMode，而不是用布尔值 showPreview

`MarkdownEditor` 内部使用 `"edit" | "preview" | "split"` 表示视图模式。未传入模式时默认编辑，用户可通过 toolbar 切换。桌面显示 split，移动端即使选择 split 也以 tab/切换方式呈现，避免双栏挤压。

替代方案：继续使用 `showPreview: boolean`。拒绝原因是布尔值无法表达双栏模式，会让后续状态判断和 UI 文案变复杂。

### Decision: 上传成功只插入 Markdown URL，不在编辑器维护附件模型

上传接口返回图片 URL 和原始文件名，前端在当前光标处插入 `![filename](url)`。正文仍然是单一 Markdown 字符串，提交话题/回复时不需要额外附件字段。

替代方案：维护 editor attachments 数组并随正文提交。拒绝原因是当前业务只需要图片嵌入，附件模型会引入未使用的数据关系和清理策略。

### Decision: 上传走 API 代理写 OSS，而不是浏览器直传

web 将图片通过认证 API 上传到 `apps/api`，后端负责校验、命名、写入 OSS 并返回公开 URL。

替代方案：浏览器获取临时签名后直传 OSS。拒绝原因是当前需求优先保证基础能力，API 代理更容易统一鉴权、限流、校验和错误处理；后续如果图片流量成为瓶颈，再切到签名直传。

```mermaid
flowchart LR
  User[用户] --> Editor[MarkdownEditor]
  Editor -->|输入 Markdown| Preview[MarkdownView]
  Editor -->|选择/粘贴/拖拽图片| WebUpload[web upload client]
  WebUpload --> Api[apps/api 上传接口]
  Api --> Validate[鉴权与文件校验]
  Validate --> OSS[阿里云 OSS]
  OSS --> Api
  Api -->|返回 url| Editor
  Editor -->|插入 ![name](url)| Textarea[Markdown 文本]
```

## Risks / Trade-offs

- 图片通过 API 代理上传可能增加后端带宽压力 → 先用大小限制和限流控制风险，后续再评估 OSS 签名直传。
- textarea 在长文双栏预览时可能出现滚动不同步 → 本次不强制实现精确滚动同步，只保证内容实时预览和布局可用。
- 粘贴/拖拽事件可能与浏览器默认行为冲突 → 仅在检测到 image file 时拦截，普通文本粘贴保持默认体验。
- 上传成功但用户未提交正文会产生孤儿图片 → 初期接受该成本，通过文件大小限制和登录限制降低滥用，后续再增加清理任务。

## Migration Plan

1. 增强 `MarkdownEditor` 的模式、工具栏和插入逻辑，并在现有路由保持调用方式兼容。
2. 增加 web 上传客户端和 API 上传接口，接入 OSS 配置。
3. 在发帖、编辑话题、编辑回复、回复框验证图片插入和预览一致性。
4. 如果上传接口异常，可回滚为仅保留 Markdown 编辑和预览，图片按钮禁用或提示稍后再试。

## Open Questions

- 单张图片大小上限使用 2MB、5MB 还是沿用 legacy 配置，需要实现时确认现有配置约定。
- OSS URL 是否需要 CDN 域名、独立上传域名或直接使用 bucket 公网域名，需要结合现有部署配置确认。
