## Why

`modernize-web-ui` 已建立 UI 基础设施，但它明确不覆盖视觉重设计。当前 `apps/web` 已有 shadcn/ui 原子组件，却仍缺少一套完整的 CNode 产品视觉系统：主站和管理页像两个产品，官方 CNode logo 尚未融入，页面宽度和布局随路由漂移，topic 详情页缺少阅读体验，首页右栏的信息密度低于老版 `nodeclub/views/sidebar.html`，评论区还存在“看起来能点但没有实际效果”的控件。

本 change 目标是建立 CNode Next 的品牌、导航、布局、内容页、topic 详情、评论和验收规范，让站点呈现为现代、大气、可信的中文 Node.js 社区，而不是一组临时拼装页面。

## What Changes

- 围绕官方 CNode logo `https://static2.cnodejs.org/public/images/cnodejs_light.svg` 与品牌绿 `#80bd01` 建立视觉系统，包括浅/深色 token、绿色 surface、边框、阴影、focus ring 和交互状态。
- 重构主站与后台导航 shell：左侧为 logo + 搜索/命令入口，右侧为辅助导航、`发布话题`、消息/通知和 profile，profile 保持最右侧。
- 建立标准页面模板：feed、reading/topic detail、content、form、search、admin，避免各 route 自行定义奇怪宽度。
- 将首页右栏升级为社区仪表盘：用户/登录 CTA、最新回复、无人回复话题、积分榜、合作品牌/广告位、资源链接。
- 将 topic 详情页设计成阅读产品：面包屑、标题、meta、tags、正文、评论、右侧上下文 rail，以及长文左侧 TOC。
- 将评论区定义为线性评论流：支持 `reply_id` 的单层引用预览和定向回复编辑器，不做嵌套评论树。
- 重做 `about`、`faq`、`getstart`、API 等内容页，使用统一内容页布局，而不是一行占位文字。
- 建立大气 footer：官方品牌、社区描述、资源分组、开发者链接、合作伙伴/生态信息。
- 规范 command/search、message/notify、toast、loading、empty、error、hover、active、focus、disabled 等反馈状态。
- 明确 agent 自验收责任：实现完成前必须由 agent 自己完成完整 UI 走查，不再依赖用户逐页找问题。

## Non-goals

- 不改变论坛核心业务模型或积分规则，除非为了渲染右栏、头像、评论引用摘要需要补充 API shape。
- 不引入无限嵌套评论；回复评论只表现为线性评论流中的单层引用关系。
- 不替换 React Router、TailwindCSS、shadcn/ui、zustand 或现有 Markdown pipeline。
- 不追求与老版 `nodeclub` EJS 视图像素级一致；老代码只作为信息架构和行为参考。
- 不实现完整广告管理平台；合作品牌/广告位可以先用静态 typed config 或简单 API 数据。

## Capabilities

### New Capabilities

- `brand-identity`: 官方 CNode logo 使用规范、绿色 palette、字体、surface、阴影与交互 token。
- `navigation-shell`: 主站/后台 Header 结构、logo/search 位置、主 CTA、账户区、command/search 入口与响应式行为。
- `layout-templates`: feed、reading/topic detail、content、form、search、admin 页面模板与 shell 宽度规范。
- `home-sidebar-information`: 首页右栏/社区仪表盘模块、数据需求、合作品牌/广告位与响应式布局。
- `topic-detail-experience`: topic 详情页结构、面包屑、标题/meta/tags、Markdown 内容 surface、上下文 rails 与 TOC。
- `comment-reply-experience`: 评论头像归一化、线性评论流、引用预览、定向回复编辑器与禁止死控件规则。
- `content-page-system`: about、FAQ、getstart、API 和其它静态/文档页的结构化内容页系统。
- `footer-system`: 品牌 footer、资源分组、合作伙伴/社区链接与响应式行为。
- `feedback-command-system`: command palette/search、通知/消息、toast、loading、empty、error、hover、active、focus、disabled 状态。
- `agent-owned-ui-acceptance`: 路由矩阵、桌面/移动端自验收、console 检查与 agent 负责的完成标准。

### Modified Capabilities

(none — `openspec/specs/` 下暂无现有基础 spec，本 change 新增产品设计能力。)

## Impact

- `apps/web/app/styles/global.css`: 品牌 token、CNode green palette、surface、shadow、focus ring、prose 和 transition 默认样式。
- `apps/web/app/components/`: Layout、AdminLayout、Sidebar、TopicList、MarkdownView、footer、command/search、notification、topic detail、comment、content page 与共享 shell 组件。
- `apps/web/app/routes/`: public feed、topic detail/create/edit、user、search、messages、auth、content、admin 页面采用模板和自验收状态。
- `apps/api/src/routes/` 与 `apps/api/src/lib/db.ts`: 可能需要新增右栏聚合、最新回复、积分榜、reply_to 摘要与头像归一化的数据 shape。
- 旧代码参考：`nodeclub/views/sidebar.html`、`nodeclub/views/_sponsors.html`、`nodeclub/api/v1/reply.js`、`egg-cnode/app/controller/api/topic.js` 用于迁移右栏模块、赞助信息、`reply_id` 行为与 API response shape。
