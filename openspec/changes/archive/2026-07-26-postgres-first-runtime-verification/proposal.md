## Why

cnode-next 当前重点是完成从 legacy Mongo 到 PostgreSQL 后的可运行验证。继续维护 sqlite-first 会增加额外开发成本，并持续制造 SQLite 与 PostgreSQL 的行为差异，例如 boolean、timestamp、自增与引用列语义。为了降低迁移风险，开发与验证路径应直接对齐 PostgreSQL。

团队已经验证过一种低风险本地验证方式：通过 SSH 隧道连接远程 rehearsal PostgreSQL，并在本地启动 API/Web。这条路径能避免暴露数据库公网端口，同时让本地页面和 API 读取迁移后的真实数据。

## What Changes

- 移除 sqlite-first 作为默认开发契约。
- 明确 PostgreSQL 是当前默认开发与迁移验证数据库。
- 明确研发如需本地完整运行环境，应自行使用 docker-compose 启动 PostgreSQL/Redis。
- 明确本地也可通过 SSH 隧道连接远程 rehearsal PostgreSQL 做功能验证。
- 保留 `.env.local` 作为本地敏感配置承载文件，并要求被 git ignore。
- 将 CI、Codespaces、branch protection、release gate 移出本次变更，留作 future work。

## Non-goals

- 不实现 CI required gates。
- 不配置 GitHub branch protection 或 release environments。
- 不新增 Codespaces/devcontainer 配置。
- 不保证无 Docker 即可完成完整本地开发。
- 不删除所有 SQLite 代码路径；本变更只取消其默认开发目标。

## Capabilities

### New Capabilities
- `postgres-first-dev-runtime`: 定义 PostgreSQL-first 的本地开发、远程 rehearsal 连接与验证契约。

### Removed From This Change
- `sqlite-first-dev-mode`
- `opt-in-pg-redis-dev-mode`
- `ci-layered-gates`

## Impact

- 影响开发文档、环境变量模板和本地运行说明。
- 影响默认开发心智模型：以 PostgreSQL 为准，SQLite 不再作为验收基线。
- 降低迁移阶段维护双 dialect 行为的成本。
