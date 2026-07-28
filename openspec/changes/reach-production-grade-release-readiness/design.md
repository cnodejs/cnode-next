## Context

cnode-next 当前已经能在 `next.cnodejs.org` 和 `api.cnodejs.org` 运行，并已经完成 GitHub 账号绑定、品牌邮件和多项迁移验证。但上线链路仍停留在“人工 smoke + 手工部署 + `latest` 镜像”的状态：`.github/workflows/build-container-images.yml` 只构建并推送 GHCR `latest`，`docker-compose.prod.yml` 默认使用 `latest`，生产 API `/health` 返回 404，compose healthcheck 依赖业务接口 `/api/v1/auth/config`，SQLite 仍存在于 `packages/db/src/client.ts`、`packages/db/src/schema/*`、`packages/db/package.json` 和验证脚本中。

用户已明确“项目不允许 SQLite”，因此本设计不再保留 PostgreSQL-first 的兼容表述，而是把 PostgreSQL-only 作为运行时、开发、测试、CI 和发布验收的唯一数据库策略。

```mermaid
flowchart LR
  DEV[Developer / PR] --> VERIFY[pnpm verify]
  VERIFY --> CI[GitHub Actions verify job]
  CI --> BUILD[Build API/Web images]
  BUILD --> GHCR[GHCR sha tag + digest]
  GHCR --> DEPLOY[Production deploy runbook]
  DEPLOY --> HEALTH[/health + version]
  HEALTH --> SMOKE[Post-deploy smoke]
  SMOKE --> AUDIT[Deployment record]
```

## Goals / Non-Goals

**Goals:**

- 让 `pnpm verify` 成为本地和 CI 共用的发布准入命令。
- 让 `openspec validate --all --strict` 全绿，且主规范不再要求过期的 `latest` 或 SQLite 兼容路径。
- 从代码、依赖、脚本和文档中移除 SQLite 活动路径。
- 让 CI 先验证再发布镜像，发布物可通过 commit SHA tag 或 digest 精确追溯。
- 让生产 API 提供专用 `/health`，并能返回服务版本、commit 和 build time。
- 让生产部署流程具备 preflight、migration、health、smoke、rollback 和审计记录。
- 让项目文档图优先，读者能通过架构图、流程图、时序图、关系图和脑图快速理解能力边界、逻辑处理和关联关系。
- 让 API 文档面向外部参考和学习，优先使用 OAS 覆盖可调用接口、鉴权、示例、错误、兼容语义，并让 `apps/web` 能通过类型生成、路径校验或 smoke 验证复用 OAS。

**Non-Goals:**

- 不在本变更中改变 legacy `../nodeclub/` 运行方式或执行旧站下线。
- 不新增 Kubernetes、Terraform、ArgoCD 或新的部署平台。
- 不把生产部署做成无人工确认的自动 SSH 发布；生产操作仍需显式执行或批准。
- 不重写 CNode API v1、Web URL parity 或 GitHub OAuth 业务状态机。
- 不保留 SQLite 作为测试 fallback、开发 fallback 或验证 fallback。

## Decisions

### Decision 1: PostgreSQL-only，删除 SQLite 分支

`packages/db` 只暴露 PostgreSQL schema 与 PostgreSQL client。`DB_DIALECT` 不再作为运行时分支；如果连接参数缺失，应用直接失败而不是回退 SQLite。

被拒绝的方案：保留 SQLite 作为本地 fallback。该方案与“项目不允许 SQLite”冲突，并且会让 CI 与生产验证出现不同数据库语义，继续掩盖 boolean、JSON、index 和 migration 差异。

### Decision 2: 单一 `pnpm verify` 作为发布准入

新增或收敛根命令 `pnpm verify`，顺序覆盖 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`openspec validate --all --strict` 和 `pnpm secrets:scan`。CI 与人工发布前都执行同一入口，避免“本地过了但 CI 不同”或“CI 漏跑 OpenSpec”的情况。

被拒绝的方案：继续让开发者手工记多个命令。该方案已经导致当前 `lint` 和 OpenSpec 失败未被 release workflow 阻断。

### Decision 3: CI 先验证再发布镜像

GitHub Actions 拆成或组织为两个阶段：`verify` job 先完成质量门禁，`build-images` job 依赖 `verify` 成功后才推送镜像。PR 只验证不推镜像；main 和 `workflow_dispatch` 才允许发布。

被拒绝的方案：沿用当前 build/push workflow。该方案会让失败的 lint、失败的 OpenSpec 或 secret scan 漏过发布。

### Decision 4: 镜像发布使用 SHA tag 或 digest

API/Web 镜像至少推送 `sha-${GITHUB_SHA}`，可以同时保留 `latest` 作为人类便利标签，但生产部署和 `docker-compose.prod.yml` 必须使用显式 `CNODE_API_IMAGE` 与 `CNODE_WEB_IMAGE`，指向 SHA tag 或 digest。

被拒绝的方案：只使用 `latest`。`latest` 覆盖后无法从生产状态精确反查 commit，也无法保证回滚目标不被覆盖。

### Decision 5: `/health` 不复用业务接口

API 新增专用 `GET /health`。该端点默认执行浅健康检查，返回进程可用、服务名、版本、commit 和 build time；如果需要依赖检查，应通过单独字段或 query 明确区分，避免数据库短暂抖动让容器被错误重启。

被拒绝的方案：继续使用 `/api/v1/auth/config`。该接口是业务配置，不携带版本信息，也不能表达发布物可追溯性。

### Decision 6: 部署先标准化 runbook，再考虑自动化

本变更先提供可审计 runbook 或脚本：确认镜像、执行 migration、启动服务、检查 `/health`、运行 smoke、记录 commit/digest/时间/操作者。自动 SSH 部署可作为后续能力，但不作为本次 D 级准入的前提。

被拒绝的方案：立即让 GitHub Actions 连接生产服务器。当前生产 `.env` 含真实 secrets，且 migration 与旧站同机运行，自动远程操作需要更细的权限和回滚设计。

### Decision 7: 文档图优先，文字只做补充

`README.md` 作为入口页，必须用少量文字和图示说明项目能力、运行方式和关键链接。`docs/` 需要合并相近主题，形成架构、开发、部署、迁移、API、安全/运维等少数入口。每个核心文档优先使用 Mermaid 图表达结构和流程，文字用于解释图中无法表达的约束。

被拒绝的方案：继续按历史 change 累积长文档。该方案会让读者很难判断项目能力、数据流和发布流程，也不利于外部学习 API。

### Decision 8: API 文档面向外部开发者

`docs/api-reference.md` 必须不只是内部契约备注，而是外部可读的 API 参考。它需要覆盖 base URL、认证方式、请求参数、响应结构、错误格式、分页、限流、示例、兼容 nodeclub API v1 的语义，以及哪些接口需要登录或 token。

被拒绝的方案：只保留 OpenSpec 中的 API contract。OpenSpec 适合验收和变更管理，但外部开发者需要稳定、可浏览、可复制示例的参考文档。

### Decision 9: API 契约以 OAS 作为机器可读来源

项目应提供 OpenAPI Specification 文件，例如 `docs/openapi.yaml` 或 `docs/api/openapi.yaml`，作为外部 API reference、示例和未来 smoke/contract 验证的共享来源。接口必须按对外能力分组，而不是按代码文件分组：帖子、回复、用户、收藏、消息、认证、搜索、系统配置等。第一优先级是对外展示和客户端高频能力，包括帖子列表、帖子详情、回复列表、发帖、回帖、用户资料、收藏和消息。

被拒绝的方案：只维护 Markdown 表格。纯 Markdown 对人友好，但无法可靠驱动未来自动 smoke、schema 校验或 SDK/客户端参考生成。

### Decision 10: Web API 调用必须和 OAS 建立持续校验关系

`apps/web` 不应该长期手写与 OAS 无关的 API path、request、response 假设。实现可以选择从 OAS 生成 TypeScript 类型、生成轻量 API client、或在验证脚本中比对 `apps/web` 使用的 API paths 与 OAS paths。第一阶段不强制完整生成 client，但必须让 `pnpm verify` 能发现“Web 调用了未记录 API”或“OAS 删除/变更了 Web 仍依赖的核心接口”。

被拒绝的方案：OAS 只作为外部静态文档。该方案不能保证持续更新，仍会出现前端调用、后端实现和外部文档三者漂移。

## Risks / Trade-offs

- [移除 SQLite 触发大量 import 变更] -> 先把 schema export 和 DB client 收敛到 PostgreSQL，再逐步删除 SQLite-only 文件，过程中持续跑 typecheck。
- [lint warnings 数量较多导致任务膨胀] -> 优先修阻断发布的活跃代码；若规则与项目现状明显冲突，调整规则必须在 spec/tasks 中记录理由。
- [OpenSpec 全绿可能暴露历史 archive 文案污染] -> 只修主规范和当前 change，不修改历史 archive，除非 validate 工具直接要求。
- [SHA tag 增加生产 `.env` 更新步骤] -> 在部署 runbook 中把 image tag 更新作为显式 preflight，并记录旧 tag 用于 rollback。
- [health 暴露过多信息] -> 只暴露 commit 短 SHA、build time、service 和状态，不暴露环境变量、数据库地址、secret 或内部错误堆栈。
- [生产部署仍需人工执行] -> 人工不是问题，不可审计才是问题；本变更要求每次部署留下 commit/image/health/smoke 记录。
- [图优先文档可能遗漏细节] -> 每张图后只保留必要约束、边界和链接，详细行为落到 API 文档、OpenSpec 或 runbook。
- [API 文档与实现漂移] -> 将 API 文档更新纳入 `pnpm verify` 或专用验证脚本可检查的范围，至少在 release readiness checklist 中强制复核。
- [OAS 一次性覆盖所有接口工作量过大] -> 分阶段优先覆盖外部核心能力；后台管理、内部运维和低频接口可以后续补齐，但必须在文档中标注覆盖范围。
- [Web 直接生成完整 API client 改动过大] -> 允许先生成类型或实现 path 覆盖校验，后续再逐步收敛到生成 client。

## Migration Plan

1. 先修 OpenSpec 主规范，使目标状态从 PostgreSQL-first/latest/future CI 调整为 PostgreSQL-only/immutable/release gate。
2. 移除 SQLite 运行时和依赖，确保 `pnpm typecheck`、`pnpm test`、`pnpm build` 仍通过。
3. 修复 lint 和 OpenSpec strict validate，新增 `pnpm verify`。
4. 更新 CI，使 `verify` 通过后才构建并推送 SHA tag 镜像。
5. 新增 `/health` 和构建元信息注入，更新 compose healthcheck。
6. 更新生产部署文档和 runbook，使用显式 SHA tag 或 digest。
7. 简化并合并 README、AGENTS 和 `docs/`，补齐 API reference、CONTRIBUTING、LICENSE 等仓库治理文档。
8. 在非生产或本地 compose 完成验证后，再由操作者按 runbook 更新生产。

Rollback 策略：生产部署前记录当前 `CNODE_API_IMAGE`、`CNODE_WEB_IMAGE` 和容器状态；如果新镜像 health 或 smoke 失败，将 `.env` 中镜像引用改回旧 SHA tag 或 digest，执行 `docker compose pull` 和 `docker compose up -d --no-build api web worker`，再重新验证 `/health` 与 smoke。

## Open Questions

- GitHub Actions 是否继续保留 `latest` 便利 tag，还是完全停止推送 `latest`？生产必须不依赖它。
- `/health` 是否需要提供深度依赖检查模式，例如 `/health?deep=1` 检查 PostgreSQL 和 Redis？
- 部署审计记录放在仓库 `docs/deployments/`、服务器目录，还是外部运维日志？
- `LICENSE` 采用 MIT、Apache-2.0 还是沿用 legacy CNode/nodeclub 的许可证策略？
