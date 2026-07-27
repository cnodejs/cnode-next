## Why

当前 `apps/api/src/lib/mail.ts` 虽然发送了 HTML，但内容只是无样式的段落和链接，且回复、@ 提及邮件没有纯文本替代，无法呈现 CNode Next Web 已建立的品牌层级与交互重点。需要为账号激活、密码重置、回复和 @ 提及提供一套兼容常见邮件客户端、可访问且安全的统一邮件界面。

## What Changes

- 建立与 Web 一致的 CNode 邮件视觉语言，使用官方 logo、品牌绿 `#80bd01`、深色品牌头部、卡片层级和明确的主 CTA。
- 提供可复用的邮件布局与内容构建方式，统一品牌头部、正文卡片、操作按钮、原始链接回退和 footer。
- 为账号激活、密码重置、话题回复和 @ 提及生成完整 HTML 与等价纯文本版本。
- 对插入 HTML 的动态内容进行转义，并将回复内容作为安全的纯文本摘要展示，避免用户内容破坏模板或注入标记。
- 增加模板级测试，验证关键文案、链接、品牌元素、HTML 转义和纯文本替代，不通过真实 SMTP 发信。
- 保持 `nodeclub/common/mail.js` 所代表的现网邮件触发语义，以及新项目现有 SMTP、重试、用户通知偏好和消息去重行为不变。

## Capabilities

### New Capabilities

- `branded-email-notifications`: 定义认证和社区通知邮件的统一品牌布局、HTML/纯文本双版本、安全渲染与可测试输出。

### Modified Capabilities

无。

## Impact

- 主要影响 `apps/api/src/lib/mail.ts`，并新增或调整对应单元测试。
- 邮件继续通过自建 SMTP 和 nodemailer 投递；新增 React Email 及其 renderer 作为类型化邮件组件与 HTML 渲染依赖，不引入第三方邮件投递 API。
- 不修改公开 API、数据库 schema、邮件触发调用方或环境变量；邮件中的站点链接继续基于 `APP_WEB_BASE_URL`。
- 视觉取值与 `apps/web/app/components/CNodeLogo.tsx`、`apps/web/app/components/Layout.tsx` 和 `brand-identity` 规格保持一致，但邮件样式独立内联，以适应邮件客户端。

## Non-goals

- 不建设拖拽式模板编辑器、营销邮件系统、批量订阅或邮件活动分析。
- 不改变账号激活、密码重置、回复通知和 @ 提及的业务触发与去重规则。
- 不直接复用 TailwindCSS、React Web 组件或 Web 深色模式；邮件采用客户端兼容优先的独立 HTML 表格布局和内联样式。
- 不迁移或重写 legacy `nodeclub` 的发信实现；新模板仅用于 cnode-next API，现网切换随新系统部署完成。
