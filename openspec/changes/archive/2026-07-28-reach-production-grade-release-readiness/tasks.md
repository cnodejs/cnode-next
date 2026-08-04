## 1. OpenSpec 主规范收口

- [x] 1.1 修复当前 10 个 strict validate 失败的主 spec，补齐 `## Purpose`、`## Requirements` 和过短 Purpose。
- [x] 1.2 将 `postgres-first-dev-runtime` 主规范改为 PostgreSQL-only，删除 SQLite historical compatibility 的准入表述。
- [x] 1.3 将 `production-ops` 主规范中的 `latest` 镜像要求改为 SHA tag 或 digest 可追溯发布物。
- [x] 1.4 将 `container-image-delivery` 主规范改为 release gate 通过后发布 SHA tag 或 digest 镜像。
- [x] 1.5 运行 `openspec validate --all --strict`，确认主规范和当前 change 都通过。

## 2. 移除 SQLite 运行时和依赖

- [x] 2.1 删除 `packages/db/src/client.ts` 中的 SQLite fallback、`DB_DIALECT` 分支和 `better-sqlite3` import。
- [x] 2.2 将 `packages/db` 默认 schema export 收敛到 PostgreSQL schema，移除活跃代码中的 `sqlite-core` schema 引用。
- [x] 2.3 删除 `packages/db/package.json` 中 `better-sqlite3` 和 `@types/better-sqlite3` 直接依赖。
- [x] 2.4 删除 `pnpm-workspace.yaml` 中 `better-sqlite3` built dependency 配置并更新 `pnpm-lock.yaml`。
- [x] 2.5 移除或改写 `apps/api/src/lib/db-compat.ts`、`apps/api/src/lib/moderation-scan.ts` 中的 `DB_DIALECT` 兼容逻辑。
- [x] 2.6 将 `scripts/verify-moderation-scan-runtime.ts` 改为 PostgreSQL 验证或纯逻辑验证，禁止 `better-sqlite3`。
- [x] 2.7 更新数据库、开发和架构文档，明确项目不允许 SQLite。
- [x] 2.8 运行搜索验证，确认活跃代码和当前文档不再包含 `better-sqlite3`、`sqlite-core`、`DB_DIALECT` 或 SQLite 准入路径。

## 3. 发布验证门禁

- [x] 3.1 修复当前项目内 lint warnings，重点处理 `apps/api/src/routes/admin.ts` 和 migration/reconcile 脚本中的阻断项。
- [x] 3.2 若部分 lint 规则与项目目标冲突，调整规则或局部例外，并在文档中记录原因。
- [x] 3.3 在根 `package.json` 新增 `pnpm verify`，串联 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`openspec validate --all --strict` 和 `pnpm secrets:scan`。
- [x] 3.4 运行 `pnpm verify`，确认任一子命令失败会导致非零退出码。
- [x] 3.5 更新开发文档，说明提交前和发布前必须运行 `pnpm verify`。

## 4. CI release gate

- [x] 4.1 新增或重构 GitHub Actions verify job，使用 `pnpm install --frozen-lockfile` 安装依赖。
- [x] 4.2 让 PR 和 main 分支都运行 verify job。
- [x] 4.3 让镜像构建 job 依赖 verify job 成功后才执行。
- [x] 4.4 确认 verify 失败时 workflow 不登录 GHCR、不构建镜像、不推送镜像。
- [x] 4.5 确认 workflow 不包含部署凭据或 `docker compose` 部署命令。

## 5. 不可变镜像发布

- [x] 5.1 修改 API 镜像发布，推送 `ghcr.io/cnodejs/cnode-api:sha-<commit>` 或记录 digest。
- [x] 5.2 修改 Web 镜像发布，推送 `ghcr.io/cnodejs/cnode-web:sha-<commit>` 或记录 digest。
- [x] 5.3 为 API/Web 镜像注入 `GIT_SHA`、`BUILD_TIME` 或等价构建 metadata。
- [x] 5.4 修改 `deployment/docker-compose.yml`，生产服务使用显式 `CNODE_API_IMAGE` 和 `CNODE_WEB_IMAGE`，不得依赖唯一 `latest`。
- [x] 5.5 更新 `docs/deployment.md`，说明如何选择 SHA tag 或 digest、如何记录旧镜像、如何回滚。
- [x] 5.6 运行 `docker compose -f deployment/docker-compose.yml config`，确认生产应用服务不包含 `build:` 且镜像来自显式变量。

## 6. 生产健康与版本可观测

- [x] 6.1 在 API 新增 `GET /health`，返回 `ok`、`service`、`version`、`commit`、`buildTime`。
- [x] 6.2 确保 `/health` 不需要认证，且不泄漏环境变量、secret、数据库地址、token 或内部堆栈。
- [x] 6.3 将 API compose healthcheck 从 `/api/v1/auth/config` 改为 `/health`。
- [x] 6.4 为 Web 运行时增加可观测 build metadata，且不影响运行时 API base URL 注入。
- [x] 6.5 增加健康端点测试或验证脚本，覆盖成功响应和敏感信息不泄漏。
- [x] 6.6 本地或预发布验证 `curl /health` 返回 2xx 和正确 commit/build metadata。

## 7. 生产部署治理

- [x] 7.1 编写标准生产部署 runbook，覆盖 preflight、migration、pull、up、health、smoke、rollback 和审计记录。
- [x] 7.2 明确 migration 只能通过显式 profile 或命令执行，普通服务启动不得隐式跑 migration。
- [x] 7.3 增加部署审计记录模板，包含时间、操作者、commit、API image、Web image、migration 结果、health 结果和 smoke 结果。
- [x] 7.4 增加回滚流程，要求恢复旧 SHA tag 或 digest 后重新验证 health 和 smoke。
- [x] 7.5 更新生产文档，明确不打印、不提交远程 `.env` 和任何 secret。

## 8. 文档信息架构与仓库治理

- [x] 8.1 重写 README.md 为图优先入口，展示系统能力、架构、数据流、发布链路和文档索引。
- [x] 8.2 精简 AGENTS.md，只保留代理执行所需的技术栈、目录边界、PostgreSQL-only、legacy 参考路径和常用命令。
- [x] 8.3 盘点 `docs/*.md`，合并重复的数据库、开发、部署、迁移、安全和运维内容。
- [x] 8.4 为核心 docs 增加 Mermaid 架构图、流程图、时序图、关系图或脑图，减少长篇文字说明。
- [x] 8.5 补充或创建 `CONTRIBUTING.md`，说明 OpenSpec、`pnpm verify`、secret handling 和 PR 验证流程。
- [x] 8.6 补充或创建 `LICENSE`，明确当前仓库许可证状态且不混淆 legacy `../nodeclub/` 参考代码。
- [x] 8.7 补充或创建安全报告入口，说明不要在公开 issue 中粘贴 secrets、tokens 或用户隐私数据。

## 9. 外部 API 文档

- [x] 9.1 创建 `docs/openapi.yaml`、`docs/api/openapi.yaml` 或等价 OAS 文件，定义 `openapi`、`info`、`servers`、认证方案、通用错误和核心 schemas。
- [x] 9.2 按对外能力设置 OAS tags：帖子、回复、用户、收藏、消息、认证、搜索、系统配置；后台和内部接口必须单独标记。
- [x] 9.3 优先补齐帖子 API：列表、详情、发帖、编辑、分页、`mdrender`、成功响应、错误响应和 legacy-compatible 字段。
- [x] 9.4 优先补齐回复 API：帖子回复、创建回复、编辑回复、删除回复、点赞、取消点赞、作者字段、内容字段和错误响应。
- [x] 9.5 补齐用户、收藏和消息 API：用户资料、用户话题、用户回复、收藏/取消收藏、消息列表、消息已读和认证要求。
- [x] 9.6 重整 `docs/api-reference.md`，让 Markdown 文档引用 OAS，并提供 base URL、版本策略、认证方式、通用响应、错误格式、分页、限流和可复制 `curl` 示例。
- [x] 9.7 补充 `mdrender`、Markdown 内容渲染、HTML 响应和原始内容响应示例。
- [x] 9.8 增加 OAS lint 或基础解析验证脚本，确保 OAS 可被工具读取且不包含 secret。
- [x] 9.9 将 API 文档和 OAS 覆盖复核加入 release readiness checklist，确保 API 变更必须同步文档并记录 smoke/contract 覆盖差距。

## 10. Web API 契约集成

- [x] 10.1 盘点 `apps/web` 中所有 API 调用 path、method、认证要求和核心响应字段。
- [x] 10.2 选择 OAS 集成方式：生成 TypeScript 类型、生成轻量 API client，或实现 Web API path/schema 覆盖验证脚本。
- [x] 10.3 将帖子、回复、用户、收藏和消息相关 Web API 调用优先关联到 OAS paths。
- [x] 10.4 增加验证，发现 Web 调用了 OAS 未记录的核心 API 时失败或阻断 release readiness。
- [x] 10.5 增加验证，发现 OAS 删除或变更 Web 仍依赖的核心响应字段时提示或失败。
- [x] 10.6 将 Web/OAS 契约验证纳入 `pnpm verify` 或 release readiness checklist。

## 11. 最终验收

- [x] 11.1 运行 `pnpm lint` 并确认通过。
- [x] 11.2 运行 `pnpm typecheck` 并确认通过。
- [x] 11.3 运行 `pnpm test` 并确认通过。
- [x] 11.4 运行 `pnpm build` 并确认通过。
- [x] 11.5 运行 `openspec validate --all --strict` 并确认通过。
- [x] 11.6 运行 `pnpm verify` 并确认通过。
- [x] 11.7 运行 SQLite 残留搜索，确认活跃代码、依赖和当前文档不再允许 SQLite。
- [x] 11.8 复核 README、AGENTS、docs、API reference、OAS、Web/OAS 契约验证、CONTRIBUTING、LICENSE 和安全入口符合图优先与外部参考要求。
- [x] 11.9 在生产部署前生成一次 release readiness 报告，列出 commit、镜像、验证结果、文档复核结果和未决风险。
