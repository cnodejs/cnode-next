## 1. MVP：回复数据一致性

- [x] 1.1 为迁移历史回复、新回复和相同时间戳回复补充 API 排序测试，断言 `create_at`、稳定 ID 和楼层顺序一致。
- [x] 1.2 在 PostgreSQL 回复查询中加入 `createAt ASC, id ASC` 显式排序，并确认 topic API 不再重排结果。
- [x] 1.3 将回复软删除、作者聚合维护和 topic 回复聚合回算收敛到单个 Drizzle 事务，覆盖重复删除与无权限分支。
- [x] 1.4 在删除最新回复时回退到上一条未删除回复，在删除唯一回复时清空 `lastReplyId/lastReplyAt` 并把 `replyCount` 写为精确有效回复数。
- [x] 1.5 调整话题活动排序为 `coalesce(lastReplyAt, createAt)` 的明确 PostgreSQL 顺序，避免 null 最后回复提升到列表顶部。
- [x] 1.6 增加删除非最新回复、删除最新回复、删除唯一回复和并发/重复删除的 API 集成测试。

## 2. MVP：消息内容展示

- [x] 2.1 为 Web 消息 loader 请求 `mdrender=false`，并实现长度受限的纯文本 Markdown/HTML 摘要纯函数。
- [x] 2.2 让“新消息”和“过往消息”的共享 `MessageItem` 仅展示纯文本摘要，保持标记已读前后内容一致。
- [x] 2.3 增加消息页测试，覆盖 `<p>不错哦</p>`、Markdown 链接/代码、空内容以及消息从新消息移动到过往消息。
- [x] 2.4 增加 API 兼容测试，确认省略 `mdrender` 或显式 `mdrender=true` 时公共消息 API 仍返回既有渲染内容。

## 3. MVP：话题阅读与图片降级

- [x] 3.1 移除 `ReadingGrid` 的左侧 TOC rail 分支，使 topic reading layout 在桌面保持主内容列加右侧上下文 rail。
- [x] 3.2 将至少四个 h2/h3 的 TOC 放到正文顶部语义化折叠控件中，默认折叠并保留稳定 anchors 与移动端跳转后收起行为。
- [x] 3.3 增加 1279px/1280px 与 1440px 的 topic layout 测试，断言目录不创建独立列且正文宽度没有断点骤缩。
- [x] 3.4 为 `MarkdownView` 增加图片状态 renderer，显式剥离 AST `node` 属性并在加载失败后展示紧凑占位卡片。
- [x] 3.5 实现单图手动重试和带 `noopener noreferrer` 的打开原图操作，不增加图片代理或自动重试循环。
- [x] 3.6 增加 Markdown 图片正常加载、失败、重试、缺失 alt fallback、外链安全属性和 sanitize 边界测试。

## 4. Feature-complete：公共页面布局节奏

- [x] 4.1 重构 `/about`，移除包裹全部章节的“社区手册”总 Card，同时保留 marketing header、页内导航和现有章节内容。
- [x] 4.2 为 About 独立 sections 配置移动端至少 48px、桌面端至少 64px 的 block gap，并把内部重复 Item/Card gap 调整为至少 16px。
- [x] 4.3 增加 About 在 375px、768px、1280px、1440px 下的结构、锚点、无水平溢出和间距回归测试。
- [x] 4.4 将首页 Sidebar 顶层 Card gap 调整为桌面 24px、移动端至少 20px，保持模块顺序、`size="sm"` 内部密度和 skeleton 结构一致。
- [x] 4.5 增加首页 Sidebar 桌面/移动端模块顺序、顶层间距和加载替换回归测试。

## 5. Feature-complete：CommandPalette 关闭布局

- [x] 5.1 使用项目 shadcn CLI 文档核对 Base UI Dialog、Command 和 InputGroup 的当前推荐 composition，并记录不覆盖现有本地组件的实现选择。
- [x] 5.2 将 CommandPalette 搜索输入与关闭操作放入显式搜索行，使用 Button/Dialog close 语义分配独立空间并移除绝对覆盖定位。
- [x] 5.3 保持 Meta/Ctrl+K、Escape、可访问名称、focus state、移动端触摸尺寸和 `finalFocus` 返回行为。
- [x] 5.4 增加 CommandPalette 桌面/移动端布局、输入不重叠、键盘关闭和焦点返回测试。

## 6. PostgreSQL 存量修复与运维说明

- [x] 6.1 实现 PostgreSQL-only 幂等 repair 命令，支持 dry-run 并从未删除回复回算 topic `replyCount/lastReplyId/lastReplyAt`，且不输出内容或连接信息。
- [x] 6.2 为 repair 增加零回复、删除最新回复、多回复和重复执行测试，并断言不修改用户积分或用户回复数。
- [x] 6.3 检查稳定排序和最新回复查询的现有索引与 `EXPLAIN`；若确需新索引，另行生成 reviewed Drizzle migration，不在代码中增加 dialect fallback。
- [x] 6.4 在运维文档记录 repair 的 dry-run、备份、执行、幂等核验和恢复步骤，不记录真实环境变量或数据库 URL。

## 7. 验证与归档准备

- [x] 7.1 运行相关 API/Web 定向测试，并执行 `pnpm lint`、`pnpm typecheck` 和 `pnpm test`。
- [x] 7.2 在可行时运行 `pnpm build` 或 `pnpm verify`，记录任何与本 change 无关的既有失败。
- [x] 7.3 使用浏览器在 375px、768px、1280px、1440px 回归 `/`、`/about`、`/topic/9`、`/topic/49027`、`/topic/49278`、`/topic/49298`、`/my/messages` 和 CommandPalette。
- [x] 7.4 核对 design Mermaid 流程、Database Change Audit、delta specs 与实现一致，并运行 `openspec validate --change fix-community-content-experience` 完成 archive-readiness 检查。

### 验证记录

- 从生产 PostgreSQL 只读逻辑备份恢复独立 PostgreSQL 18 容器后，完成真实 Drizzle 并发创建/删除、重复删除、topic 锁状态复核、migration、repair dry-run/apply/幂等测试；所有写入只发生在隔离库。
- 在 231,109 条回复的克隆数据上，索引前 count/latest 查询为 Parallel Seq Scan，约 39–51ms；partial index 后为 Index Only Scan，约 0.12–0.38ms。
- 使用隔离 PostgreSQL/Redis 启动本地 API/Web，在四个 viewport 完成全部指定路由、登录消息页和 CommandPalette 浏览器回归；无水平溢出或输入/关闭按钮重叠。
