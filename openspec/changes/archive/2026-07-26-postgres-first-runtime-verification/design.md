## Context

项目迁移目标是 PostgreSQL。迁移彩排已经证明，真实问题更容易在 PostgreSQL 环境下暴露，例如 boolean 条件、timestamp 排序和引用列类型。继续把 SQLite 作为默认开发路径，会让开发者在非目标数据库上验证功能，并把 dialect 差异留到后期暴露。

当前阶段的目标应收敛为：迁移后的 cnode-next 能以 PostgreSQL 数据库启动，并能通过本地 API/Web 读取迁移数据完成关键页面验证。

## Goals / Non-Goals

**Goals:**
- 明确 PostgreSQL-first 为当前开发与迁移验证基线。
- 明确研发只需要提供 PostgreSQL/Redis 连接地址；本地 docker-compose 与 SSH 隧道只是连接地址来源不同。
- 明确 `.env.local` 用于本地敏感配置，且必须被 git ignore。
- 提供最小验证命令，确认 API/Web 能读取 PostgreSQL 数据。

**Non-Goals:**
- 不实现 CI gate、branch protection 或 release gate。
- 不新增 Codespaces/devcontainer。
- 不保证无 Docker 的完整开发路径。
- 不在本变更中移除所有 SQLite schema 或历史兼容代码。

## Decisions

### Decision 1: PostgreSQL-first 作为迁移阶段默认契约
- Choice: 本地开发与迁移验证默认围绕 PostgreSQL。
- Rationale: 与生产目标一致，避免 SQLite/PG 差异掩盖问题。
- Rejected alternative: sqlite-first。
  - Reason rejected: 双 dialect 开发会增加维护成本，并已暴露运行时差异。

### Decision 2: 连接地址优先，而不是区分运行来源
- Choice: 应用只关心 PostgreSQL/Redis 连接地址；数据库可以由本地 docker-compose 提供，也可以由 SSH 隧道映射远程 rehearsal 提供。
- Rationale: 两种方式对应用运行效果相同，文档不需要维护两套开发路径。
- Rejected alternative: 分开维护本地 docker-compose 与 SSH 隧道两套说明。
  - Reason rejected: 增加文档复杂度，但不会改变应用侧配置模型。

### Decision 3: 不开放数据库公网端口
- Choice: 远程 rehearsal 数据库通过内网或 SSH 隧道访问。
- Rationale: 保持数据库访问面最小化。
- Rejected alternative: 将远程数据库端口公网开放。
  - Reason rejected: 安全风险高。

### Decision 4: CI/Codespaces 延后
- Choice: 本次只保障项目迁移后可运行，CI/Codespaces/branch protection/release gate 另行规划。
- Rationale: 当前优先级是迁移可运行性，避免扩大范围导致交付风险。

## Migration Plan

1. 更新开发文档和 `.env.example`，去掉 sqlite-first 默认表达，改为 PostgreSQL-first。
2. 固化本地 `.env.local` 使用方式，确认 ignore 生效。
3. 文档化 PostgreSQL/Redis 连接地址配置，说明本地 docker-compose 与 SSH 隧道只是地址来源不同。
4. 验证本地 API/Web 能读取 PostgreSQL 数据。
5. 将 CI/Codespaces/release gate 记录为 future work，而不是当前任务。
