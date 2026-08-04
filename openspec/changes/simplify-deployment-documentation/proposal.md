## Why

部署说明分散在 `deployment/`、`docs/`、`wiki/` 和历史 change 中，日常发布、数据库迁移、一次性修复与历史背景互相重复，导致维护者难以快速找到可执行步骤。需要收敛长期文档职责，并移除版本库历史材料中的环境特定运维信息。

## What Changes

- 将 `deployment/README.md` 收敛为简短、任务导向的发布入口，只保留镜像更新、可选数据库迁移、验证和回滚。
- 将 Compose 文件统一为 `deployment/docker-compose.yml`，同步当前文档和规格引用，并明确其项目部署资产职责。
- 将数据库开发规则保留在 `docs/database.md`，将已完成的 Mongo 到 PostgreSQL 迁移背景收敛到 `wiki/`。
- 删除不再承担长期任务入口的重复审计模板和迁移 runbook，更新 README 文档索引。
- 清理 archived changes 中的环境特定路径、连接方式、基础设施拓扑和运行观察，不改写 Git 历史。
- 保留不可变 SHA 镜像、禁止部署时构建、reviewed migration、备份、健康检查和回滚等通用安全约束。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `documentation-information-architecture`: 收敛部署、数据库、迁移背景和历史材料的文档职责，删除重复长期入口。
- `production-deployment-governance`: 将版本化部署资产统一到 `deployment/docker-compose.yml`，保持文档简洁且不记录环境特定信息。
- `container-image-delivery`: 统一基于 `docker-compose.yml` 的不可变镜像发布与启动命令。
- `production-ops`: 明确项目 Compose 不包含本地构建，并只保留必要的长期运维约束。

## Impact

**范围内：** `deployment/`、`docs/database.md`、已删除的重复 migration runbook、`wiki/migration-background.md`、根 `README.md`、相关主 specs，以及 `openspec/changes/archive/` 中的环境特定内容。

**范围外：** 不修改应用代码、API、数据库 schema、运行时配置、镜像内容或实际运行环境；不修改 `../nodeclub/` 和 `egg-cnode/` 参考代码；不重写 Git 历史。

**受影响系统：** 仅版本控制中的部署资产、文档导航、规格和历史 change 文本。

**高风险类别：** 删除历史材料时可能误删仍有效的通用工程决策；重命名 Compose 后可能留下失效引用。

## Non-goals

- 不记录或同步任何环境特定配置、路径、连接方式、基础设施细节或运行数据。
- 不新增部署自动化平台，不改变 CI 镜像构建行为。
- 不重新执行 Mongo 到 PostgreSQL 迁移或任何数据库操作。

## Documentation Impact

`deployment/README.md` 成为唯一部署入口；`docs/database.md` 仅保留数据库开发与 migration 规则；历史迁移知识保留在 `wiki/`；重复或已失效入口删除。根 README 只保留稳定文档链接。
