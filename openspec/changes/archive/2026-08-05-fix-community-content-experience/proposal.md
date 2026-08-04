## Why

生产页面已暴露多处会误导用户或降低可读性的缺陷：回复楼层顺序不稳定、删除回复后话题仍显示已删除回复的时间、消息页直接显示 HTML 标签，以及长文、失效图片、说明页、首页侧栏和 CommandPalette 的布局降级不合理。现在需要把数据一致性与已确认的阅读体验问题一起收敛，避免新站继续传播错误状态并降低迁移内容的可用性。

## What Changes

- 话题回复按创建时间和稳定次序升序返回，保证线性楼层与直接链接稳定。
- 删除回复时原子维护话题回复数，并在删除最新回复后回退到上一条有效回复；删除唯一回复时清空最后回复引用和时间，同时修复现有不一致数据。
- `/my/messages` 展示回复的纯文本摘要，不再把 API 返回的 Markdown HTML 当普通字符串显示；保持 legacy-compatible `mdrender` API 行为。
- 移除话题详情左侧固定 TOC rail，将满足门槛的目录放到正文顶部作为默认折叠的 disclosure，并保持稳定 heading anchors。
- Markdown 外链图片加载失败时显示紧凑占位卡片，提供重试和打开原图操作，不引入自动代理或无限重试。
- `/about` 去掉包裹全部章节的单一大 Card，以独立 sections、响应式留白和更宽松的内部 card gap 建立内容层级。
- 首页右侧 rail 的 Card 间距从紧凑堆叠调整为清晰分组，同时保持模块顺序和移动端可达性。
- CommandPalette 将关闭操作纳入搜索行布局，避免覆盖输入区域，并保持 Escape、键盘焦点返回和移动端触控可达。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `comment-reply-experience`: 明确回复必须按稳定时间线排序并据此生成楼层。
- `content-lifecycle`: 删除回复时同步回算话题最后有效回复元数据，并支持存量数据修复。
- `messaging`: Web 消息列表展示安全、可读的回复纯文本摘要，同时保持 API `mdrender` 兼容。
- `topic-detail-experience`: TOC 从左侧 rail 改为正文顶部折叠目录，正文不再因 `xl` 断点骤然缩窄。
- `web-ui-markdown`: 外链图片失败时提供可访问的紧凑降级 UI。
- `layout-templates`: About 内容模块使用独立 section rhythm，避免单一大 Card 造成高密度连续文本。
- `home-sidebar-information`: 首页 rail Card 使用清晰且响应式的模块间距。
- `navigation-shell`: CommandPalette 关闭控件不得覆盖搜索输入，并保持 overlay 可访问性。

## Impact

**范围内：** `apps/api` 的回复查询、回复删除与消息 shaping，`packages/db` 相关查询/修复脚本，`apps/web` 的 topic、messages、MarkdownView、About、Sidebar、CommandPalette，以及相应 API/Web 测试。

**范围外：** 不恢复已经失效的外部图片；不新增图片代理；不改变消息公共 API 的 `mdrender=true` 语义；不改变回复嵌套模型、角色权限、About 文案或首页模块顺序；不修改 legacy `../nodeclub/` 或 `egg-cnode/` 参考代码。

**受影响系统：** PostgreSQL 话题/回复元数据、Hono API、React Router SSR 页面和共享 Web UI components。不新增运行时依赖。

**高风险类别：** 回复删除事务与存量数据回算可能影响话题排序和计数；消息 API 兼容必须避免破坏外部客户端；Markdown 图片降级必须继续经过现有 sanitize 边界。

## Non-goals

- 不代理、抓取或迁移当前已失效的第三方图片。
- 不重新设计完整话题页、首页或 About 信息架构。
- 不改变 legacy nodeclub 的线性回复、消息类型和 API 路径兼容边界。
- 不处理本次调查之外的视觉微调。

## Documentation Impact

无需修改用户文档或 `wiki/`：这些变更修正既有页面行为，不引入新操作流程。若实现新增一次性数据修复命令，应在仓库运维文档中记录执行方式、幂等性和回滚/核验步骤，但不得记录真实数据库连接信息。
