## Context

当前项目已经具备生产部署、OpenAPI、MIT License、CONTRIBUTING 和 SECURITY 入口，但 README 和 `docs/` 的表达仍偏内部上线验收：大量 Mermaid 图集中在 README，一次性 release readiness 记录放在长期文档里，API reference 混合了本地开发地址和散文式说明。

用户明确希望文档按开源项目常见习惯重构：README 简洁，`docs/` 提供项目使用、开发、部署和 API 等任务导向文档，`wiki/` 作为同级知识库沉淀迁移背景和业务逻辑，`deploy/` 作为同级部署资产域集中管理 compose、SQL、启动脚本和 dotenv 模板。这些域都需要规范，包含图形的文档遵循“描述 → 图形 → 简约说明”，API reference 按 method/path 组织，参数和字段优先用表格，说明和示例使用短段落、列表和代码块。同时，部署相关文件不应直接堆在仓库根目录，仓库文件组织要合理且简约；CI 也不应堆叠大量针对具体文件内容的 verify 脚本，GitHub Actions 也不应把 PR CI、镜像发布和生产部署放进同一个 workflow。

## Goals / Non-Goals

**Goals:**

- 让 README 成为开源项目入口，而不是迁移/上线验收摘要。
- 让 `docs/` 提供一份项目文档规范和开发规范，并让任务导向文档参考这套规范书写。
- 让 `wiki/` 作为与 `docs/` 同级的知识库，并提供独立写作规范约束来源、事实边界和 AI agent 行为。
- 将图形放到对应 docs 中，且每个图形都服务于一个明确读者任务。
- 让 API reference 使用标准接口手册格式，endpoint 以相对 path 为主，避免把整篇文档机械表格化。
- 移除或归档一次性 release readiness、内部评级和重复说明。
- 收敛根目录文件，将生产部署编排放到 `deploy/` 或等价目录。
- 让 `deploy/` 成为与 `docs/`、`wiki/` 同级的部署资产域，并约束 docker-compose、SQL、启动脚本和 dotenv 配置分组。
- 收敛 `scripts/` 中硬编码具体文件文本的一次性 verify 脚本，避免 CI 变成验收脚本集合。
- 拆分 GitHub Actions workflow，使 CI、镜像构建发布和生产部署各自职责清晰。
- 使用 `wiki/` 或等价知识库目录承接迁移背景、legacy 业务逻辑和社区规则沉淀。

**Non-Goals:**

- 不修改业务实现、API response shape、OpenAPI 契约含义或生产部署流程。
- 不把文档规范写成冗长手册；规范本身也必须轻量。
- 不让 README 承担 architecture、deployment、migration 或 API reference 的详细职责。
- 不用大量专项脚本去验证文档是否包含某几行文字、某些当前文件名或某次上线验收细节。
- 不隐藏工具约定必须在根目录的文件，例如 `package.json`、`pnpm-workspace.yaml`、`README.md`、`LICENSE`、`SECURITY.md`、`CONTRIBUTING.md`。

## Decisions

### Decision 1: README 只做开源项目入口

README 顶部使用简短项目说明：CNode Next 是基于 React Router、Hono、Drizzle、PostgreSQL 和 Tailwind CSS 构建的现代 CNode 社区应用。README 包含 Features、Tech Stack、Quick Start、Documentation、Contributing、Security、License。

拒绝方案：继续以“PostgreSQL-only 重写版本”和 legacy 边界作为首段。该写法更像内部迁移说明，会弱化项目作为开源应用的第一印象。

### Decision 2: `docs/conventions.md` 作为项目文档与开发规范入口

新增或整理 `docs/conventions.md`，覆盖 `docs/` 写作规范、开发规范、API 文档规范、目录职责和 secret handling 链接。`CONTRIBUTING.md` 引用该文档，避免 README 堆叠细则。

拒绝方案：把规范分散到 README、CONTRIBUTING、development 和各 docs 文件。分散会继续造成重复和漂移。

### Decision 3: 图形采用“描述 → 图形 → 简约说明”

包含图形的文档使用统一块结构：1-2 句描述、Mermaid 图、表格或短列表说明。图形用于结构、流程、状态或关系，不作为装饰。

拒绝方案：先写长篇背景再放图。读者通常不会读完整长段，图形也无法承担快速理解作用。

### Decision 4: API reference 按接口模板组织

每个核心接口使用轻量模板：method + relative path、简短说明、必要的 Path Params/Query/Body/Response 字段表、错误摘要和代码示例。空 section 可省略，示例使用代码块而不是表格。

拒绝方案：纯散文说明接口、反复写完整基础域名，或把示例和普通说明也强行做成表格。API 使用者需要快速查字段，也需要可复制的请求示例和顺畅阅读的上下文。

### Decision 5: Base URL 单独说明，endpoint 使用相对 path

API 文档通过 `CNODE_API_BASE_URL` 表达 base URL；接口标题和表格使用 `/api/v1/...` 相对 path。

拒绝方案：在每个 endpoint 标题中写完整域名，或把 `localhost:3001` 当作 API reference 主体内容。本地开发地址属于 development 文档。

### Decision 6: 根目录最小化，部署资产进入 `deploy/`

仓库根目录只保留开源项目入口和工具自动发现所必需的文件。生产 compose、部署 SQL、部署模板、启动脚本、dotenv 示例和部署辅助文件应移动到 `deploy/` 或等价目录，例如 `deployment/docker-compose.yml`。所有文档、命令和 CI 引用必须同步新路径。

拒绝方案：继续把 `deployment/docker-compose.yml` 放在根目录。该文件是生产部署实现细节，不是外部读者进入项目时必须看到的入口，会让根目录变成运维材料堆叠。

### Decision 7: `wiki/` 作为同级知识库承接迁移和业务知识沉淀

`docs/` 与 `wiki/` 是同级文档域：`docs/` 保留项目使用、开发、架构、部署、数据库和 API 这类任务导向文档；`wiki/` 保留 legacy `../nodeclub/` 迁移背景、业务逻辑分析、社区规则、兼容性说明、历史上下文和长期知识沉淀，并由 README 或 docs 提供入口链接。

`wiki/` 必须有独立写作规范：每篇知识库文档说明来源、适用范围、事实/推断边界、关联源码或 legacy 路径、最后复核时间和未确认问题。AI agent 不得把猜测写成事实；不确定内容必须标记为待确认。

拒绝方案：继续把 migration、legacy 行为分析和业务知识散落在 `docs/`。这些内容对维护者很重要，但对外部读者完成“运行、调用、部署、贡献”任务不是主路径，会让 `docs/` 过重。

### Decision 8: `deploy/` 作为同级部署资产域

`deploy/` 与 `docs/`、`wiki/` 同级：`docs/` 写任务文档，`wiki/` 写知识沉淀，`deploy/` 放可执行或可同步的部署资产。`deploy/` 应包含简短 README 或规范，说明 compose 文件命名、SQL 文件用途、启动脚本约定、dotenv 模板维护方式和 secret handling 边界。

dotenv 示例必须按配置域分组，而不是无结构变量列表。推荐分组包括应用 URL、数据库、Redis、认证、对象存储、Turnstile、邮件、观测/日志、迁移/运维开关。真实 `.env` 不进入仓库、不在文档中打印、不被脚本覆盖。

拒绝方案：把生产部署主入口保留在 `docs/deployment.md`，部署文件散落根目录，`.env.example` 继续作为无分组变量清单。这会让部署域难以维护，也让读者无法区分“项目文档”和“生产部署域”。

### Decision 9: CI 使用通用门禁，不用文件文本专项验收脚本

CI 和 `pnpm verify` 应保留通用质量门禁：lint、typecheck、test、build、OpenSpec validate、secret scan、OpenAPI 契约检查、compose config。针对某个文档必须包含某句话、某个 compose 必须匹配当前文件文本、某个 workflow 必须出现具体 action 版本的检查，不应以大量 `scripts/verify-*` 形式长期存在。

拒绝方案：继续增加硬编码文件路径和正则的专项 verify 脚本。它们适合一次性迁移验收，但不适合作为开源项目的长期 CI 资产，会制造维护成本和错误的工程观感。

### Decision 10: GitHub Actions 按职责拆分

`.github/workflows` 应按职责拆分，而不是用一个 workflow 同时承担 PR verify、main 分支镜像发布和潜在生产部署。推荐结构：`ci.yml` 在 pull_request 和 push 分支上运行通用质量门禁；`build-images.yml` 或 `release.yml` 在 main、tag 或手动触发时构建并推送 GHCR 镜像；`deploy.yml` 仅在确有需要时提供受保护环境的手动部署入口。

生产部署 workflow 不应保存部署凭据或直接执行部署，除非项目明确决定引入 GitHub Environments、审批、最小权限 secret 和审计策略。当前边界是 CI 构建镜像，部署 runbook 使用 SHA tag 或 digest 和 `deployment/` 中的 Compose。

拒绝方案：继续使用 `build-container-images.yml` 同时处理 PR verify 和镜像发布。这个名字与职责不匹配，权限也更难最小化，后续一旦加入部署步骤会变成 CI/release/deploy 混合体。

## Risks / Trade-offs

- [文档重构导致链接失效] -> 任务中包含链接复核和 `grep` 检查旧路径引用。
- [README 过短导致上下文不足] -> 使用 Documentation 表格指向 architecture、development、deployment、API、database 和 migration。
- [API reference 与 OAS 漂移] -> 保留 `pnpm verify:openapi-contract`，并让 API reference 标明 OAS 为机器可读契约。
- [docs/conventions.md 变成新长文档] -> 限制为规则、表格和模板，不写长篇背景。
- [移动 compose 文件影响生产部署命令] -> 任务中必须同步 `deployment/README.md`、README、远程部署说明和任何脚本中的 compose 路径；部署前运行 `docker compose -f deployment/docker-compose.yml config --quiet`。
- [部署资产移动导致 dotenv 或脚本引用漂移] -> `deployment/README.md` 或等价规范必须列出 compose、SQL、脚本、dotenv 模板的职责和引用关系；dotenv 模板按分组维护。
- [移除专项 verify 脚本后质量下降] -> 保留编译、测试、OpenSpec、secret scan、OpenAPI 契约和 compose config 这类通用门禁；文档结构靠规范和人工 review，不靠脆弱正则。
- [workflow 拆分后触发关系混乱] -> `ci.yml` 不需要 packages write 权限；镜像 workflow 显式依赖或重复最小验证；部署 workflow 如存在只允许 manual/environment protected 触发。
- [`wiki/` 与 `docs/` 边界不清] -> 在 `docs/conventions.md` 中定义：`docs/` 和 `wiki/` 是同级文档域；任务导向文档进 `docs/`，历史/业务/迁移知识进 `wiki/`。
- [AI agent 在 wiki 中无依据扩写] -> `wiki/` 规范要求来源、证据、事实/推断标记和待确认问题；缺少来源的内容不得作为确定事实写入。

## Migration Plan

1. 先建立 `docs/conventions.md`，明确文档和开发规范。
2. 重写 README 为开源项目入口，并把图形迁移到 docs。
3. 整理 `docs/`，将一次性记录移出长期文档路径或归档。
4. 建立与 `docs/` 同级的 `wiki/` 目录，迁移 legacy、迁移背景和业务知识沉淀内容，并补充 wiki 写作规范。
5. 建立 `deploy/` 部署资产域，移动生产 compose、部署 SQL、启动脚本和 dotenv 模板，同步所有引用。
6. 清理 `scripts/` 和 package scripts 中面向具体文件文本的一次性 verify 脚本，保留通用质量门禁和必要契约检查。
7. 拆分 `.github/workflows`：CI、镜像构建发布和生产部署入口分离，并收敛权限。
8. 重写 API reference 为表格式接口手册。
9. 运行 `pnpm lint`、`openspec validate --all --strict`、`pnpm verify:openapi-contract`、compose config 和链接/路径复核。

## Open Questions

- 一次性生产部署记录和重复审计模板不作为长期文档维护。
- API reference 是否只覆盖核心公开接口，后台/内部接口只链接 OAS，还是也用同一模板完整列出？
- `deploy/` 是否只放生产 compose，还是同时放 `.env.example`、SQL、audit template 和 deployment helper scripts？
- `wiki/` 是否纳入 OpenSpec/release 验证的链接检查，还是作为维护者知识库只做人工复核？
- `wiki/` 是否需要固定 front matter，例如 `source`、`status`、`reviewed_at`、`owners`？
