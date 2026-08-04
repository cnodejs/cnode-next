## Why

当前 cnode-next 已完成核心迁移与多轮生产验证，但仍不能达到 D 级“生产级自动化上线”标准：`pnpm lint` 和 `openspec validate --all --strict` 不能作为绿灯门禁，SQLite 仍存在于运行时与依赖中，CI 只推送 `latest` 镜像，生产缺少专用 `/health` 与可追溯版本信息，部署仍依赖手工判断。

现在需要把发布链路从“人工确认可用”收口为“自动验证、PostgreSQL-only、不可变发布、健康可观测、部署可审计”，避免替换 legacy `../nodeclub/` 时出现不可复现或不可回滚的上线状态。

## What Changes

- **BREAKING**: 移除 SQLite 运行时、schema、脚本和直接依赖；项目只允许 PostgreSQL。
- 修复主 OpenSpec 规范格式与过期要求，使 `openspec validate --all --strict` 必须通过。
- 修复或收敛 lint 规则，使 `pnpm lint` 成为可执行的质量门禁。
- 新增统一 release verification gate，覆盖 lint、typecheck、test、build、OpenSpec strict validate 和 secret scan。
- 升级 GitHub Actions，验证通过后才构建并推送容器镜像。
- 发布 API/Web 镜像时生成 commit SHA tag 或 digest，生产部署禁止依赖唯一 `latest` tag。
- 新增生产 `/health` 与版本可观测能力，暴露服务名、commit、build time 和基础健康状态。
- 标准化生产部署流程，明确 preflight、migration、pull immutable image、up、health、smoke、rollback 和审计记录。
- 重整 README、AGENTS 和 `docs/`，以架构图、信息图、流程图、时序图、类图、脑图等可视化内容为主，减少长篇文字。
- 补齐面向外部开发者参考和学习的 API 文档，优先以 OpenAPI Specification (OAS) 描述对外帖子、回复、用户、收藏、消息等能力，并让 `apps/web` 的 API 调用、类型或验证流程引用 OAS，形成持续更新能力。

## Non-goals

- 不改变 legacy `../nodeclub/` 的运行方式，也不在本变更中执行老站下线。
- 不新增 GitHub OAuth 真实账号 E2E；本变更只要求 release gate 能覆盖已有自动化和可实现的 smoke。
- 不引入 Kubernetes、Terraform、ArgoCD 或新的部署平台；继续基于现有 `deployment/docker-compose.yml` 和 GHCR。
- 不重写业务路由、UI 或 CNode API v1 契约；只在必要时补充健康、版本和验证入口。

## Capabilities

### New Capabilities

- `release-verification-gates`: 定义本地与 CI 发布门禁必须覆盖的命令、顺序和失败阻断规则。
- `production-health-version`: 定义 API/Web 生产健康检查、版本信息和部署后可观测要求。
- `immutable-image-release`: 定义 GHCR 镜像必须以 commit SHA tag 或 digest 发布与部署。
- `production-deployment-governance`: 定义生产部署 runbook、preflight、migration、smoke、rollback 和审计要求。
- `documentation-information-architecture`: 定义图优先的项目文档结构、README/AGENTS 职责和 docs 简化合并要求。
- `public-api-documentation`: 定义面向外部开发者参考和学习的 API 文档、OAS 分组和 smoke/contract 验证复用要求。
- `web-api-contract-integration`: 定义 `apps/web` API 调用与 OAS 契约之间的引用、类型生成或漂移检测要求。

### Modified Capabilities

- `postgres-first-dev-runtime`: 从 PostgreSQL-first 改为 PostgreSQL-only，禁止 SQLite 作为运行时、开发、测试或验收路径。
- `production-ops`: 从人工 replacement 验收扩展为 D 级发布准入，移除对 `latest` 镜像的要求并改为不可变发布物。
- `container-image-delivery`: 从只构建和推送 `latest` 镜像改为验证通过后发布可追溯镜像。
- `secret-scanning`: 将 secret scan 纳入 release verification gate，而不是仅依赖本地 hook。

## Impact

- 代码：`packages/db/`、`apps/api/src/lib/*`、健康/版本路由、验证脚本、lint 相关代码。
- CI/CD：`.github/workflows/*`、GHCR image tags、release gate job、构建参数。
- 运维：`deployment/docker-compose.yml`、`deployment/README.md`、数据库文档、`CNODE_API_IMAGE` / `CNODE_WEB_IMAGE` 占位配置。
- 文档与规范：`README.md`、`AGENTS.md`、`CONTRIBUTING.md`、`LICENSE`、`openspec/specs/*`、`docs/*.md`、API reference 文档。
- 依赖：移除 `better-sqlite3`、`@types/better-sqlite3` 和 SQLite-only tooling。
