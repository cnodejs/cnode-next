## Why

当前开发文档以 sqlite-first 为主，能保证低门槛启动；但团队协作已经需要一条可复用的 PostgreSQL/Redis 可选路径，且要同时覆盖 GitHub Codespaces 与本地环境。如果缺少统一契约，成员环境会逐步分叉，CI 也可能漏掉仅在 pg/redis 模式出现的回归，直到发布前才暴露。

同时，`nodeclub/` 与 `egg-cnode/` 作为历史逻辑参考正在被 cnode-next 逐步替代，新流程需要明确：如何在不强制 Docker 的前提下，完成现代基础设施路径的开发与发布质量校验。

## What Changes

- 明确 sqlite-first 为默认开发模式，不强制 Docker。
- 明确 pg/redis 为研发自主切换的可选开发模式。
- 明确 Codespaces 仅提供服务型基础设施（PostgreSQL 与 Redis），不要求应用镜像构建或应用容器打包。
- 明确 CI 仅采用两级门禁：
  - PR 必过：sqlite 快速检查 + pg/redis 集成检查。
  - Release 必过：完整功能检查（full functional）。
- 明确 nightly 完整功能工作流不在本次变更范围内。

## Non-goals

- 不要求将 `apps/api` 或 `apps/web` 容器化为开发容器。
- 不要求所有本地开发者必须具备 Docker 环境。
- 不要求每个 PR 都执行完整功能检查。
- 不改写 `nodeclub/` 映射或 `egg-cnode/` 对照的业务行为。

## Capabilities

### New Capabilities
- `sqlite-first-dev-mode`: 定义无需 Docker 的默认开发契约。
- `opt-in-pg-redis-dev-mode`: 定义本地与 Codespaces 场景下 PostgreSQL/Redis 的可选开发契约。
- `ci-layered-gates`: 定义 PR 必过门禁与 release-only 完整功能门禁。

### Modified Capabilities
- 无。

## Impact

- 影响开发文档与 OpenSpec 开发/CI 契约。
- 影响 Codespaces/devcontainer 的配置范围（仅服务，不容器化应用）。
- 影响 CI 工作流与分支保护策略。
- 提升发布前对 pg/redis 相关行为的验证信心。
