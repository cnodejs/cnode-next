## Why

当前 CNode Next 的前台与管理后台已完成主要功能迁移，但 UI 密度、导航信息架构、表单控件尺寸和关键交互反馈存在多处漂移，导致页面看起来不统一、部分操作缺少可见反馈。现在需要在进入更多功能扩展前，先把前台社区体验和后台运营体验的视觉与交互规则收敛下来。

## What Changes

- 简化主站导航：移除“指引总览”入口，将 `API` 提升为与“关于”平级的一级导航；“关于”下拉仅保留“新手指南”“常见问题”“关于我们”，并同步移动端导航和命令面板命名。
- CommandPalette 必须按当前用户权限过滤快捷入口和搜索结果，非管理员不得搜到或跳转“管理后台”等后台内容。
- 将用户菜单中的“设置”统一为“用户设置”，避免与其他菜单项长度和语义不一致。
- 首页话题列表分页改为轻量模式，只展示上一页/下一页，不再暴露总页数；后台、用户列表和管理列表继续保留数字页码分页。
- 调整发布话题页写作体验：正文编辑器默认更高，发布按钮位于右侧操作区，分类 select 与输入控件样式统一。
- 统一招聘专区筛选条密度：桌面筛选控件降为工具栏密度，`select`/`Input` 高度、圆角、背景与基础控件一致；移动端 Sheet 筛选保持可用。
- 修复话题详情页“添加回复”和单条评论“回复”按钮缺少可见反馈的问题：触发后应滚动到回复编辑器、聚焦输入区，并展示目标引用状态。
- 重构话题详情页正文后的操作区：收藏、查看回复、编辑、举报和管理动作按互动、页内导航、更多/管理分层展示，不再零散平铺为同级按钮。
- 管理后台纳入同轮审计：概览页减少顶部指标卡数量，用户管理表格合并身份信息列并移除默认的积分/话题/回复列，后台筛选、表格、分页、危险操作保持高密度但统一。
- Non-goals：本次不改数据库 schema、不改 API 返回字段、不引入新的 UI 框架、不删除已有 `/help` 路由文件；是否将 `/help` 重定向或归档另行决定。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `navigation-shell`: 主站导航结构、用户菜单文案、移动端导航和辅助入口排序调整。
- `web-ui-components`: 前台与后台控件尺寸、圆角、select/textarea 样式、分页显示模式和后台表格密度统一。
- `web-ui-markdown`: 发布话题页对 MarkdownEditor 的默认展示高度和提交操作布局提出页面级要求。
- `comment-reply-experience`: “添加回复”和单条回复 action 必须滚动并聚焦回复编辑器，避免死控件感。
- `topic-detail-experience`: 话题详情正文后的收藏、查看回复、编辑、举报和管理动作分层组织。
- `jobs-zone`: 招聘筛选条密度和控件样式收敛。
- `admin-dashboard`: 管理概览指标从 8 张同权重卡片改为分组摘要，突出待处理事项。
- `user-management`: 用户列表默认列重构，用户名和邮箱合并展示，积分/话题/回复不作为默认列。
- `admin-list-pagination`: 明确后台分页保留数字页码，首页简化分页不影响后台列表分页。

## Impact

- Affected systems: `apps/web` 前台页面、话题详情页、发布页、招聘专区、主站 Layout、后台 Layout 和后台管理页面。
- Affected specs: `navigation-shell`、`web-ui-components`、`web-ui-markdown`、`comment-reply-experience`、`jobs-zone`、`admin-dashboard`、`user-management`、`admin-list-pagination`。
- Legacy context: legacy `nodeclub` 的论坛式高密度列表和分页可作为内容密度参考，但 CNode Next 不应继续暴露首页超大总页码；后台运营功能对齐 `nodeclub/web_router.js` 中管理员操作语义，但 UI 需采用当前 React/shadcn 组件体系。
- High-risk categories: 导航入口变更可能影响用户习惯；回复滚动/聚焦涉及 hash、sticky header 和 editor ref；后台用户表格删减列可能影响管理员快速查看贡献数据。

## Documentation Impact

- `docs/` 和 `wiki/` 暂不需要同步，因为本次是 Web UI 和后台信息架构调整，不改变公开 API、部署流程或数据库迁移。
- 如果后续决定将 `/help` 路由重定向或删除，应另起文档/SEO 兼容说明，明确旧链接策略。
