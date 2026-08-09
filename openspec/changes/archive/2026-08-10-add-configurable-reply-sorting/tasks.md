## 1. MVP 数据与排序行为

- [x] 1.1 在 `apps/web/app/routes/topic.$tid.tsx` loader 中解析回复排序 query，将缺失、`newest` 和无效值归一为默认“最新优先”，将 `oldest` 解析为“最早优先”。
- [x] 1.2 在不原地修改 API/KV payload 的前提下，先按规范升序回复生成稳定楼层，再创建与当前排序对应的展示数组，并把排序值传给 route component。
- [x] 1.3 调整 `ReplySection` 和 `ReplyItem` 的数据边界，使可见楼层来自规范时间线而不是展示数组下标，并保持回复 ID anchor 与引用链接不变。
- [x] 1.4 增加纯数据或 loader 针对性测试，覆盖默认最新优先、最早优先、无效值回退、相同回复在两种方向下楼层不变，以及派生排序不修改原始缓存数组。

## 2. 排序交互与响应式体验

- [x] 2.1 按 `cnode-web-design` 检查现有 topic detail archetype 和已安装 Base UI/shadcn primitives，在回复区标题行复用现有控件实现带“回复排序方式”可访问名称的“最新优先 / 最早优先”选择器，不新增全局抽象。
- [x] 2.2 让排序切换通过 React Router 更新 URL，最早优先写入 `reply_sort=oldest`，默认排序移除该参数，并保留其他兼容 query、hash、浏览器历史和 SSR 一致性。
- [x] 2.3 验证回复 DOM 顺序等于视觉顺序，不使用 CSS `column-reverse`；在窄屏允许标题与控件换行且不产生横向滚动。
- [x] 2.4 增加 route/component 测试，覆盖控件标签与选项、URL 切换、刷新语义、键盘操作、空回复列表，以及两种排序下引用 anchor 的有效性。
- [x] 2.5 按用户验证反馈将回复排序控件从 `NativeSelect` 改为现有 Base UI `Select` composition，并更新 popup、键盘和选项测试。
- [x] 2.6 将小屏 Topic action surface 调整为左侧“收藏话题、查看回复”、右侧“编辑话题、管理/举报”的两列分组，保持权限矩阵并增加布局测试。

## 3. 回复提交后的稳定定位

- [x] 3.1 扩充 Web 创建回复响应类型以读取既有 `reply_id`，成功后等待 revalidation 完成，再按当前排序定位新回复 anchor，同时保留 query。
- [x] 3.2 实现普通与 `prefers-reduced-motion: reduce` 两种定位行为，确保成功 toast、编辑器清理和定向回复状态清理不回归，并避免在目标 DOM 渲染前滚动。
- [x] 3.3 增加交互测试，覆盖最新优先时新回复位于顶部并被定位、最早优先时位于末尾并保持 URL，以及 reduced-motion 下不使用平滑滚动。

## 4. 契约与自动化验证

- [x] 4.1 保留 `buildRepliesByTopicQuery` 的 `create_at ASC, id ASC` 断言，并增加回归检查，确认 `GET /api/v1/topic/{topic_id}` 的 response schema、默认顺序和 `apps/web/public/openapi.json` 均未改变。
- [x] 4.2 运行受影响的 Web/API 测试、`pnpm lint` 和 `pnpm typecheck`；修复所有由本变更引入的问题，并在可行时运行 `pnpm verify`。
- [x] 4.3 核验 Database Change Audit：`packages/db` schema、migration、索引、seed 和数据修复文件均无变更，且无需数据库迁移或缓存格式迁移。

## 5. 测试服务器页面验证

- [x] 5.1 使用仓库现有 `.env` 执行 `pnpm dev`，连接已配置的测试 PostgreSQL/Redis；不得读取、打印、复制或记录环境变量值、连接地址、凭据及真实用户内容。
- [x] 5.2 在测试环境的非生产话题验证匿名 SSR 默认最新优先、最早优先切换、URL 刷新、前进后退、直接回复 hash 和引用跳转，并确认重复排序不会污染匿名 KV 缓存结果。
- [x] 5.3 经用户确认跳过测试服务器真实创建回复验证；相关行为由自动化交互测试覆盖，且不绕过 Turnstile 或写入共享测试数据。
- [x] 5.4 在至少 375px 移动端和 1280px 桌面 viewport 验证 light/dark theme、无横向溢出、键盘焦点顺序、屏幕阅读器可访问名称、empty/pending 状态及 reduced-motion 行为。

## 6. 归档准备

- [x] 6.1 按 `cnode-docs` 核对权威文档归属：确认无 `docs/arch`、`docs/biz`、`docs/deployment`、治理文件或 app README 需要同步，且没有过时路径或不安全示例数据。
- [x] 6.2 检查 `design.md` Mermaid 流程与最终实现一致，确认 spec scenarios 均有对应自动化或页面验证证据，并运行 `openspec validate add-configurable-reply-sorting --strict`。
