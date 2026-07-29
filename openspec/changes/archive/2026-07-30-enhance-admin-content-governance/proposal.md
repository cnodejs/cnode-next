## Why

管理后台的话题管理当前只能按标题搜索，缺少按 tab、状态、时间维度和运营指标筛选的能力，管理员难以定位需要处理的内容。巡检结果当前按全量命中列表展示，虽然底层已有巡检任务和命中记录关联，但后台不能按任务查看和一键处理某次巡检发现的问题。

## What Changes

- 后台话题管理页支持按 tab、可见状态、运营标记、时间维度和排序方式筛选话题。
- 后台话题管理筛选、分页和批量操作 MUST 在翻页和操作后保留当前筛选上下文。
- 巡检结果页支持按巡检任务查看命中记录，任务卡片提供查看该任务命中的入口。
- 巡检任务支持对该任务下待处理命中执行批量确认删除，删除目标为命中的原始话题或回复。
- 批量确认删除 MUST 使用明确危险文案、二次确认和审计日志，避免将“清理”误解为仅清除巡检记录。
- 后台话题管理增加 admin-only 的真实删除入口，用于从数据库物理删除已确认不需要保留的话题及其依赖数据。
- 默认删除行为仍保持现有软删除；真实删除必须使用独立文案、二次确认和审计日志，不得替代现有删除按钮。
- 第一阶段不新增数据库表或迁移；复用现有 `moderation_hits.scan_job_id` 关联。重复扫描到同一对象同一敏感词仍遵循现有去重行为，不为每个任务重复创建命中记录。

## Scope

### In Scope

- 后台 `/admin/topics` 的话题查询、筛选、排序、分页上下文保持和 admin-only 真实删除入口。
- 后台 `/admin/mod` 的巡检任务命中查看、任务级批量确认删除和危险操作确认。
- 后端 `/api/v1/admin/topics`、`/api/v1/admin/moderation` 及相关后台管理 API。
- 当前 cnode-next PostgreSQL 数据模型中的话题、回复、收藏、招聘扩展、巡检命中、消息引用和审计日志处理。

### Out Of Scope

- 不迁移或改写 legacy `../nodeclub/`、`egg-cnode/` 代码；legacy 仅作为软删除和后台治理语义参考。
- 不新增巡检 occurrence 表，不改变 `moderation_hits.dedupe_key` 的去重语义。
- 不改变公共话题列表、话题详情、用户收藏或消息 API 的可见性规则。
- 不新增 PostgreSQL schema、索引、约束、迁移或数据回填。

### Affected Areas

- Code: `apps/web`、`apps/api`。
- Runtime: PostgreSQL 中现有 topic/reply/moderation 相关表的运行时查询和显式数据清理。
- Contracts: 后台管理 API 查询参数和响应字段；不改变公开 API 契约。
- Documentation: `docs/content-moderation.md`、`wiki/business-rules.md`。

### High-Risk Categories

- Database: 真实删除会物理清理现有数据，但不改变 schema。
- Security/permissions: 真实删除和任务级批量确认删除必须限制为 admin。
- API contract: 后台管理 API 新增查询参数和操作入口。
- Data repair/cleanup: 真实删除是显式 admin-only 数据清理操作，不是自动修复脚本。

## Non-goals

- 不将现有“删除”按钮改成物理删除；默认删除继续是假删除。
- 不让巡检任务级批量确认删除执行物理删除；巡检确认删除继续沿用现有软删除生命周期。
- 不物理删除审计日志。
- 不把真实删除写成 legacy nodeclub 兼容行为。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `admin-dashboard`: 后台话题管理列表增加多维筛选、排序和筛选上下文保留；巡检结果后台增加按任务查看和任务级批量确认删除入口。
- `content-moderation`: 巡检命中处理要求扩展为支持按 `scan_job_id` 归类和对任务下待处理命中批量确认删除。
- `content-lifecycle`: 后台批量删除巡检命中的话题或回复时，必须沿用既有话题/回复删除生命周期、积分和计数器规则。
- `content-lifecycle`: 后台话题管理增加独立的真实删除生命周期要求，限定为 admin-only 高风险操作。

## Impact

- `apps/web/app/routes/admin/topics.tsx`: 增加筛选表单、排序选择、URL 参数保持和筛选态分页。
- `apps/api/src/routes/admin.ts`: 扩展 `GET /api/v1/admin/topics` 查询参数；扩展 `GET /api/v1/admin/moderation` 的任务过滤；增加或扩展巡检批量处理 API 支持任务级确认删除。
- `apps/api/src/routes/admin.ts`: 增加后台话题真实删除 API，负责按安全顺序清理依赖数据并写入审计日志。
- `apps/web/app/routes/admin/mod.tsx`: 巡检任务卡片增加查看命中和批量确认删除流程。
- `apps/web/app/routes/admin/topics.tsx`: 增加真实删除入口和二次确认流程，仅 admin 可见。
- `apps/api/src/lib/moderation-scan.ts`: 复用现有 `handleModerationHit`，必要时增加任务级处理封装。
- `packages/db/src/schema/topic.ts`、`packages/db/src/schema/moderation_scan.ts`: 第一阶段不变更 schema。
- 测试影响：需要覆盖后台话题查询条件组合、巡检任务过滤、任务级批量删除和权限/审计路径。

## Documentation Impact

### docs/

- Updated: `docs/content-moderation.md` because巡检结果将从全量命中列表扩展为按巡检任务查看，并新增任务级批量确认删除操作说明。
- Not Required: `docs/database.md` because第一阶段不新增 PostgreSQL schema、索引、约束或迁移；真实删除是运行时 admin-only 操作，不是数据库结构变更。

### wiki/

- Updated: `wiki/business-rules.md` because后台话题管理将新增真实删除业务规则，且必须与现有软删除、巡检确认删除语义区分。
- Not Required: `wiki/legacy-behavior.md` because真实删除是 cnode-next 新后台治理能力，不是 legacy nodeclub 线上兼容行为；legacy 软删除记录保持不变。
