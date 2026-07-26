## Why

当前 web 的 Markdown 创作流程仍然接近占位实现：`apps/web/app/components/MarkdownEditor.tsx` 只是 textarea 加简单工具栏，预览能力不完整，也没有可用的图片/文件上传路径。这会阻碍用户正常发布话题和回复，也没有达到 legacy CNode 在 `nodeclub/public/` 前端资源中提供的基础编辑、预览和图片插入体验。

## What Changes

- 将 `MarkdownEditor` 做成真实可复用的创作组件，覆盖发帖、编辑话题、编辑回复和话题详情页回复。
- 支持三种创作模式：Markdown 编辑、预览、桌面端双栏编辑 + 预览。
- 所有预览模式都必须通过 `MarkdownView` 渲染同一份 Markdown，支持 GFM、代码高亮、安全 HTML、图片和表格。
- 支持从编辑器工具栏选择图片、粘贴截图、拖拽图片上传，上传成功后在光标位置插入 Markdown 图片语法。
- 增加上传进度、禁用态、错误态、文件校验和可访问的控件状态。
- 将 web 编辑器接入认证上传 API，后端按项目既定方向写入阿里云 OSS，并兼容七牛镜像迁移上下文。
- 增加 Markdown 预览、编辑器插入、上传校验和路由集成测试。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `web-ui-markdown`：扩展 Markdown 创作要求，覆盖可靠预览、双栏编辑预览和图片上传插入。

## Non-goals

- 不替换站内统一的 Markdown 渲染器。
- 不支持任意非图片附件，也不建设通用文件管理器。
- 不迁移历史七牛资产，也不改变历史内容 URL。
- 不建设协同编辑器或 WYSIWYG 富文本编辑器。

## Impact

- 前端影响：`apps/web/app/components/MarkdownEditor.tsx`、`apps/web/app/components/MarkdownView.tsx`，以及使用编辑器的路由：`topic.create.tsx`、`topic.$tid.edit.tsx`、`reply.$id.edit.tsx`、`topic.$tid.tsx`。
- API/存储影响：在 `apps/api` 新增或复用认证上传接口；必要时在 `packages/shared` 增加请求/响应契约。
- 安全影响：上传图片必须校验大小和类型；Markdown 渲染必须继续净化危险 HTML 和链接。
- 依赖影响：预期不引入新的重型编辑器框架，只增加与现有技术栈一致的最小上传或客户端辅助代码。
