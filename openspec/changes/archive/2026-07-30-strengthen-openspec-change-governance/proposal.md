## Why

当前 OpenSpec 已要求 proposal、design、tasks 和 spec delta 使用简体中文，并要求记录 Non-goals、legacy 参考和设计取舍；但 change 创建时对改造范围、`docs/` / `wiki/` 同步、图形说明和数据库变更审计的约束仍不够明确。随着 cnode-next 从一次性重写进入持续迭代阶段，需要把项目知识沉淀变成流程要求，而不是依赖模型临场能力。

## What Changes

- 新增 OpenSpec change 治理要求：创建 change 时必须声明改造范围、影响边界和不改造内容。
- 新增文档影响判定：每个 change 必须说明 `docs/` 和 `wiki/` 是否需要同步；需要同步时列出目标文件，不需要时说明原因。
- 新增图形说明要求：影响架构、数据流、状态流、权限或迁移顺序的 change，必须在 `design.md` 使用 Mermaid 图或矩阵表达关键关系。
- 新增数据库变更审计要求：涉及 PostgreSQL schema、migration、seed/bootstrap、索引、约束、数据修复、backfill 或字段语义的 change，必须提供影响评估、兼容策略、迁移计划、回滚策略、性能/锁表风险和验证方式。
- 更新贡献和约定文档，使 OpenSpec、`docs/`、`wiki/`、PR notes 和归档检查形成闭环。
- 后续活跃 change 可按新规则补充文档影响和数据库审计；已归档 change 不作为本变更的改写对象。

## Non-goals

- 不修改 OpenSpec CLI 或 schema 引擎本身。
- 不强制小型文档修正、拼写修正、纯机械格式化都创建 OpenSpec change。
- 不要求所有 change 都必须更新 `docs/` 或 `wiki/`；只要求显式判定并说明原因。
- 不把 `docs/` 或 `wiki/` 变成实现日志；一次性实现细节仍应留在 change artifacts 中。
- 不引入 SQLite、数据库方言 fallback 或本地数据库兼容路径；数据库审计只面向 PostgreSQL 运行时。

## Capabilities

### New Capabilities

- `openspec-change-governance`: 定义 OpenSpec change 的范围声明、文档影响判定、图形说明、数据库变更审计和归档前知识同步要求。

### Modified Capabilities

- 无。

## Impact

- OpenSpec 配置：更新 `openspec/config.yaml` 中 proposal、design、tasks 规则。
- 文档：新增或更新 OpenSpec 治理文档，并同步 `docs/conventions.md` 与 `CONTRIBUTING.md` 的流程说明。
- Wiki：不新增业务事实；只在治理文档中明确何时应更新 `wiki/`。
- 数据库：无运行时数据库变更；本 change 仅定义数据库变更审计要求。
- API/Web：无 API、Web 页面或运行时行为变更。
