## 1. 品牌基础

- [x] 1.1 增加官方 CNode logo 资源处理，并明确 full、compact、admin 标识的使用场景。
- [x] 1.2 围绕 CNode green `#80bd01` 重建 CSS 品牌 tokens，包括 hover、active、ring、soft surface、dark mode、borders 和 shadows。
- [ ] 1.3 更新 Button、Badge、Card、DropdownMenu、Sheet、Dialog、Table、Skeleton、Toast、Avatar 样式，使其使用新的品牌 surface 和交互 tokens。
- [x] 1.4 增加确定性 avatar fallback 工具，并统一所有 domain components 的头像展示预期。

## 2. 共享 Shell 和页面模板

- [x] 2.1 创建或重构共享主站 shell primitives：Header、Footer、page container、feed grid、reading grid、content page、form page、search page 和 admin page templates。
- [x] 2.2 重设计主站 Header：左侧为 logo + search/cmd entry，右侧为辅助导航 + 发布话题 + messages + profile。
- [x] 2.3 重设计后台 Header：复用同一 shell cluster 模型，并包含 Admin mode badge、后台导航、返回主站、theme 和 profile tools。
- [x] 2.4 实现移动端 Header 行为，保证触摸目标可用，并折叠辅助导航。
- [ ] 2.5 将 public、content、auth、search、topic、user、message 和 admin routes 中的临时宽度替换为正确的命名模板。

## 3. 首页 Feed 和 Sidebar

- [x] 3.1 使用 feed template 设计首页布局，确保主内容和社区右栏与 shell 对齐。
- [x] 3.2 为最新回复、无人回复话题、积分榜和合作/资源数据增加 API/data shaping，并保持 payload 适合缓存。
- [x] 3.3 用用户/登录 CTA、最新回复、无人回复话题、积分榜、合作品牌/广告位、资源链接模块替换当前薄 Sidebar。
- [x] 3.4 确保 sidebar 模块在移动端重排到 feed 下方或紧凑 sections 中，而不是直接消失。
- [x] 3.5 重设计 TopicListItem 信息层级，包括 tags、标题、作者、回复/浏览数和最后回复时间。

## 4. Topic 详情阅读体验

- [x] 4.1 将 topic 详情 route 重构为 reading template，不再使用居中的 `max-w-3xl` article。
- [x] 4.2 构建 TopicHeader，包含面包屑、本地化 tab label、状态/tags、标题、作者、发布时间、最后回复时间、回复数、浏览数和 actions。
- [x] 4.3 构建 TopicBody surface，优化 Markdown prose、links、blockquotes、code blocks、tables、images 和响应式 overflow 行为。
- [x] 4.4 从 Markdown h2/h3 headings 生成稳定 heading anchors 和 TOC 数据。
- [x] 4.5 在大桌面渲染左侧 TOC rail，在移动端渲染 inline/collapsible TOC，并对短 topic 省略 TOC。
- [x] 4.6 构建 topic context rail，包含作者摘要、topic stats、相关话题/latest replies 和可选合作/资源模块。
- [x] 4.7 增加 topic 的 not-found、deleted、locked、no replies、unauthenticated reply、loading 和 error 状态设计。

## 5. 评论和回复体验

- [x] 5.1 更新 topic 详情 API response，返回归一化 reply author avatars，并为带 `reply_id` 的回复返回 `reply_to` summary。
- [x] 5.2 重设计评论 item，包含 avatar、作者、楼层、时间、内容、引用预览和 actions。
- [x] 5.3 实现定向回复编辑器状态，包括回复目标展示、取消行为、`@loginname` 预填和 `reply_id` 提交。
- [x] 5.4 确保评论回复保持线性流，只展示单层 quote preview，不渲染嵌套树。
- [x] 5.5 移除或禁用所有不会执行其宣称行为的评论控件。
- [ ] 5.6 验证 `reply2` 通知行为正确，且不会重复通知 topic 作者。

## 6. 内容页面

- [x] 6.1 创建共享 ContentPageLayout，包含 hero、sections、可选 TOC、related links 和响应式行为。
- [x] 6.2 重设计 `/about`，包含 CNode 身份、社区目的、价值观、项目信息和参与链接。
- [x] 6.3 将 `/getstart` 重设计为新用户引导，覆盖账号、分类、提问、分享、Markdown 和礼仪。
- [x] 6.4 将 `/faq` 重设计为分组、易扫读的问答 sections。
- [x] 6.5 重设计 API 文档页，包含认证、endpoint 分组、request/response 示例和 error/rate-limit 说明。

## 7. Footer、Command、Search、Messages 和反馈

- [x] 7.1 构建品牌 footer，包含官方 logo 处理、社区描述、分组链接、合作/生态区域和响应式布局。
- [x] 7.2 实现 command/search entry 和 palette，支持 topic/user 搜索、快速导航、发布、消息、后台入口和内容页。
- [x] 7.3 重设计 `/search` 结果页，包含 query header、可用时的 filters、loading、empty、error 和 result 状态。
- [x] 7.4 重设计 message/notification Header 入口，包含 unread badge、可访问 labels、稳定对齐尺寸和 route/preview 行为。
- [ ] 7.5 统一 toast、loading、empty、error、disabled、hover、active、focus、selected 状态在 routes 和 components 中的表现。

## 8. 后台一致性

- [ ] 8.1 确保所有 admin routes 使用 admin template、共享 Header cluster、active navigation、CNode brand tokens 和一致内容宽度。
- [ ] 8.2 使用与主站相同的 card/line/shadow 层级重设计 admin cards、tables、filters、dialogs 和 empty/error states。
- [ ] 8.3 验证 admin 移动端布局使用可用的横向或折叠导航，并且内容无 overflow。

## 9. 验证和 Agent 自验收

- [x] 9.1 在 `apps/web` 运行 `npx tsc --noEmit`，并修复本 change 引入的所有 web 类型错误。
- [x] 9.2 在 `apps/web` 运行 `pnpm build`，并修复 build failures 或不可接受的 bundle/runtime regressions。
- [ ] 9.3 以约 1280px 桌面宽度审计 `/`、`/topic/:id`、`/topic/create`、`/search`、`/user/:name`、`/my/messages`、`/signin`、`/signup`、`/about`、`/faq`、`/getstart`、API 文档页和所有 admin routes。
- [ ] 9.4 以约 390px 移动端宽度审计同一批 route families，重点检查 Header、search/cmd、sidebars/rails、TOC、forms、footer 和 touch targets。
- [ ] 9.5 检查审计 routes 的浏览器 console errors，并修复非预期 runtime errors。
- [ ] 9.6 验证所有可见且 enabled 的控件都会执行其宣称的 action 或 navigation，包括评论回复、发布、messages、profile menus、admin nav、search/cmd 和 footer links。
- [ ] 9.7 验证 topic list、topic detail、comments、sidebar、leaderboard、profile 和 messages 中的图片与头像都有可用 URL 或确定性 fallback。
- [ ] 9.8 验证代表性组件的 hover、active、focus-visible、disabled、selected、loading、empty 和 error states。
- [ ] 9.9 在标记实现完成前记录最终 self-audit 范围、检查页面、viewport 覆盖、运行命令、已知 gaps 和 residual risks。
