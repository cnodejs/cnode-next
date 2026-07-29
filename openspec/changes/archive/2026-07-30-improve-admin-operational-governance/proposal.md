## Why

cnode-next 已具备后台内容治理、用户治理、审计日志和 legacy Web URL 的基础能力，但这些能力仍按页面和接口堆叠，而不是按运营任务组织：公开 `/rss` 只返回空 XML channel，无法作为真实订阅源；`/admin/users` 每行直接平铺 5 到 6 个高低风险混杂的操作按钮；`/admin/audit` 只是简单罗列日志，不能支持运营复盘、风险追踪和问责；后台导航把审计、系统设置、专区和 Tab 管理混在“系统”分组中，且系统设置没有放在最后。

这些问题共同影响 CNode 线上替代后的运营效率和安全感。管理员需要从“看到一堆按钮和 action 字符串”升级为“按内容、用户、审计、系统的任务模型完成治理”。

## What Changes

- 恢复公开 `/rss` 的真实 RSS 订阅能力：Web `/rss` 作为唯一公开 RSS 地址，API 提供 RSS source JSON，Web 组装 RSS 2.0 XML。
- RSS feed 包含最多 50 条按创建时间倒序排列的公开可见话题，允许包含 `job` 话题，但必须排除 `dev` / `test`、已删除内容和被 block 用户创建的内容。
- `/admin/users` 行操作区改为安全审计优先模型，每行只直接展示“查看”和“管理”入口，不再平铺所有动作。
- 用户管理动作在“管理”菜单中按用户治理、角色权限、账号安全、危险操作分组；`block` 文案从“隐藏内容”统一为“屏蔽用户内容 / 恢复用户内容”。
- `/admin/audit` 从日志表升级为审计中心，支持事件分类、风险等级、筛选、摘要指标、事件流展示和可展开原始详情。
- 后台导航按运营任务重排为总览、内容、用户、审计、系统，系统设置放在最后；专区管理和 Tab 管理归入内容结构相关分组。

## Scope

### In Scope

- Web `/rss` 公开资源路由和 API RSS source JSON。
- RSS XML 生成、XML escaping、公开内容过滤和 feed cache 策略。
- 后台 `/admin/users` 行操作布局、菜单分组、确认流入口和文案。
- 后台 `/admin/audit` API 字段、筛选参数、summary 统计和 UI 信息架构。
- 后台导航分组、顺序、顶部导航 active matching 和移动端导航顺序。

### Out Of Scope

- 不新增 Atom feed。
- 不新增 per-tab RSS feed；`/rss` 第一阶段为全站公开内容订阅。
- 不改变首页 `all` feed 排除 `job` 的现有语义；RSS 是全站公开订阅，不等同首页版面列表。
- 不改变 block/mute 后端业务语义，只调整后台表达和入口组织。
- 不新增审计日志数据库表；第一阶段复用现有 `audit_logs` 字段。
- 不实现审计日志导出、告警、留存策略或不可篡改审计存储。
- 不迁移或修改 legacy `../nodeclub/`、`egg-cnode/` 代码；legacy 仅作为 RSS 语义参考。

### Affected Areas

- Code: `apps/web`、`apps/api`。
- Contracts: 新增或调整后台/API RSS source JSON；扩展后台审计 API 查询参数和响应字段。
- UI/UX: `/rss`、`/admin/users`、`/admin/audit`、后台导航 shell。
- Runtime: PostgreSQL 现有 topic/user/audit 查询；无 schema 变更。
- Documentation: 后台治理和 RSS 公开 URL 相关 docs/wiki 如已有对应文档则同步。

### High-Risk Categories

- Security/permissions: 用户管理菜单仍必须隐藏或阻止当前管理员对自身执行限制或破坏性操作；审计中心不得向非 admin 暴露。
- API contract: `/api/v1/rss` 当前隐藏返回 XML，需正式定义为 RSS source JSON 或选择新路径，避免公开 XML 语义混乱。
- Data exposure: RSS 和审计详情必须避免泄漏内部 tab、已删除内容、被 block 用户内容和敏感 secrets。

## Non-goals

- 不把 `/api/v1/rss` 作为公开 RSS XML 地址；公开订阅地址必须是 Web `/rss`。
- 不把所有审计日志 detail 原样暴露给非 admin；审计中心继续 admin-only。
- 不在用户列表中继续展示超过 3 个同级操作控件。
- 不把“删除发言”“重置密码”“授予角色”表达成普通低风险按钮。
- 不改变现有管理员 API 的权限边界。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `web-url-parity`: `/rss` 从“返回 XML”强化为“返回 legacy-equivalent RSS 2.0 订阅内容”。
- `user-management`: 后台用户管理行操作必须按风险和语义收纳，不得平铺高风险操作；block 文案统一为屏蔽用户内容。
- `admin-dashboard`: 后台导航和审计日志页面必须按运营任务组织，审计日志升级为可筛选、可归类、可追溯的审计中心。

## Impact

- `apps/web/app/routes/rss.tsx`: 从静态空 channel 改为调用 API RSS source 并组装 RSS 2.0 XML。
- `apps/api/src/routes/admin.ts` 或新增 route module: 提供 RSS source JSON，使用公开可见性过滤和 `create_at desc` 排序。
- `apps/api/src/lib/db.ts`: 必要时增加 RSS topic 查询和 audit list/filter/summary 查询。
- `apps/web/app/routes/admin/users.tsx`: 改造操作列为“查看 + 管理菜单”，整理确认流和文案。
- `apps/web/app/routes/admin/audit.tsx`: 改造为审计中心，增加筛选、summary、事件流和详情展开。
- `apps/api/src/routes/admin.ts`: 扩展 `GET /api/v1/admin/audit` 返回完整审计字段、分类/风险/标签和筛选 summary。
- `apps/web/app/components/AdminLayout.tsx`: 重排导航分组和 active matching。
- 测试影响：需要覆盖 RSS 内容过滤、RSS XML 输出、用户操作入口可见性、审计筛选/summary、导航分组和权限边界。

## Documentation Impact

### docs/

- Updated if present: 后台管理或运营文档需要说明用户治理菜单、审计中心筛选和 RSS 订阅语义。
- Not Required: `docs/database.md` because 本 change 不新增 PostgreSQL schema、索引、约束或迁移。

### wiki/

- Updated if present: `wiki/business-rules.md` 应记录 `/rss` 公开可见性范围和后台 block/mute 文案语义。
- Not Required: legacy 文档不需要把 cnode-next 的审计中心设计写成 nodeclub legacy 行为。
