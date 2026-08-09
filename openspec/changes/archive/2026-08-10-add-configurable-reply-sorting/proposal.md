## Why

话题回复当前只按最早到最新展示，回复较多时用户必须滚动较长距离才能看到讨论的最新进展。详情页需要默认突出最新回复，同时保留查看完整时间线的能力，并且不能破坏公共 API、楼层和引用锚点的稳定语义。

## What Changes

- 话题详情页默认按“最新优先”展示回复，并提供“最新优先 / 最早优先”切换。
- 排序控件使用现有 Base UI `Select`，保持键盘、焦点和 popup 行为与 Web 设计系统一致。
- 通过 URL query 表达非默认排序，使 SSR、刷新、前进后退和分享链接保持一致；默认排序不写入 canonical URL。
- 楼层继续按 `create_at ASC, id ASC` 的规范时间线计算，切换展示方向不得重编号。
- 公共 `GET /api/v1/topic/{topic_id}` 继续按稳定升序返回回复，不新增 breaking API 行为，也不按排序方向复制匿名 KV 缓存。
- 回复提交成功后使用接口返回的 `reply_id` 定位到新回复，避免默认倒序后用户停留在编辑器处而看不到结果。
- 小屏 action surface 将“收藏话题、查看回复”保持在左侧，将“编辑话题、管理”等权限动作保持在右侧，同时保留既有角色权限矩阵。
- 为排序解析、楼层稳定性、URL 导航、引用锚点和回复提交落点增加自动化测试，并使用现有 `.env` 启动 dev server，连接已配置的测试 PostgreSQL/Redis 进行桌面和移动端页面验证。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `comment-reply-experience`: 将固定升序渲染改为规范时间线与可配置展示顺序分离，规定默认排序、切换方式、楼层、锚点和提交后定位行为。
- `topic-detail-experience`: 明确移动端 action surface 的左右分组和换行语义。

## Scope

### In Scope

- Web 话题详情 reading route `apps/web/app/routes/topic.$tid.tsx` 的回复区。
- React Router SSR loader 对排序 query 的解析和展示数据塑形。
- 回复排序控件及其桌面、移动端、键盘和屏幕阅读器行为。
- Topic action surface 的小屏左右分组。
- 回复成功后的 revalidation 与锚点定位。
- 相关 Web/API 契约回归测试和测试环境页面验证。

### Out of Scope

- 回复分页、无限滚动、嵌套评论树或热门度排序。
- 修改公共 Topic API 的默认回复顺序或响应 schema。
- 将排序偏好持久化到账号、PostgreSQL、Redis 或 `localStorage`。
- 修改回复数据、楼层存储方式、数据库 schema、migration 或索引。
- 修改 reference-only 的 `../nodeclub/` 或 `egg-cnode/`；它们的线性升序行为由现有公共 API 兼容层继续保留。

## Impact

- **Affected systems:** `apps/web` 话题详情 SSR 与交互；`apps/api` 仅做不回归验证；匿名详情 KV 缓存保持规范升序 payload。
- **Route archetype:** topic detail reading route；不改变 ReadingGrid、作者 rail 或回复 Card 的视觉语言。
- **Shared UI:** 复用现有 Base UI/shadcn `Select`；实施前加载 `cnode-web-design`，不引入新的设计系统抽象。
- **Responsive:** 排序控件在窄屏与标题区可换行且保持可点击尺寸；回复 DOM 顺序与视觉顺序一致，不使用 CSS `column-reverse`。
- **Accessibility:** 控件具有明确“回复排序方式”名称和可理解选项；楼层、引用锚点、键盘导航及提交后的焦点/滚动行为保持可用，并尊重 reduced motion。
- **High-risk categories:** 公共 API 顺序兼容、楼层重编号、SSR 与 URL 不一致、匿名缓存污染、提交后定位竞态。
- **Dependencies:** 不新增运行时依赖。

## Non-goals

- 不解决超大话题一次返回全部回复的性能问题；若未来引入分页，排序和楼层计算需另行下沉到服务端设计。
- 不记住用户跨话题或跨设备的排序偏好。
- 不改变删除回复后有效回复集合及楼层压缩的现有语义。

## Documentation Impact

- `openspec/specs/comment-reply-experience/spec.md`: 归档后更新为新的权威产品行为。
- `docs/arch/`、`docs/biz/`、`docs/deployment/`: 无新增长期架构、业务治理或部署规则，预计无需修改。
- 根治理文件与 `apps/*/README.md`: 无命令或协作边界变化，预计无需修改。
- `apps/web/public/openapi.json`: API contract 不变，不应重新生成；若实施中意外调整 route schema，必须生成并验证 Web `/api` 页面。
