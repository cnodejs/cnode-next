## Why

当前 README 和 `docs/` 更像一次生产上线验收材料：强调重写、迁移、D 级发布和大量流程图，而不是像开源项目那样先回答“这是什么、如何运行、如何调用、如何贡献”。API reference 也混入本地开发语境，接口说明不够标准化。

需要将文档调整为面向外部读者和贡献者的轻量入口：README 简洁，`docs/`、`wiki/` 和 `deploy/` 作为同级内容域分别建立规范，API 文档按社区 API reference 习惯组织。同时，CI 不应依赖大量针对具体文件文本的专项 verify 脚本；这些规则应收敛为可读规范、通用质量门禁和必要契约检查。

## What Changes

- 重写 README 信息架构：开头用简短项目介绍和技术栈描述，不以“重写版本”或 legacy 迁移作为主叙事。
- 将 README 中的架构图、数据流图、发布流图等移入 `docs/` 的合适位置，README 只作为入口和索引。
- 新增或整理 `docs/conventions.md`，定义项目文档规范、开发规范、API 文档规范和 secret handling 规则入口。
- 将 `docs/` 文档改为读者任务导向，遵循“描述 → 图形 → 简约说明”的结构。
- 精简一次性上线验收、release readiness、内部评级和重复说明，保留长期有用的开发、架构、部署、数据库、迁移和 API 文档。
- 新增或整理 `wiki/` 目录，作为与 `docs/` 同级的知识库，用于沉淀 legacy 迁移背景、CNode 业务逻辑、社区规则、历史兼容说明和长期知识库内容，并提供严格写作规范防止 AI agent 无依据扩写。
- 新增或整理 `deploy/` 目录，作为与 `docs/`、`wiki/` 同级的部署资产域，集中管理 docker-compose 文件、SQL 文件、启动脚本和 dotenv 模板。
- 将 dotenv 示例按配置域分组，例如应用地址、数据库、Redis、认证、对象存储、Turnstile、邮件和运维开关，避免后续维护时把所有变量堆成无结构列表。
- 重写 `docs/api-reference.md` 为标准接口手册：按能力分组，每个接口使用 method/path 标题；参数和字段优先用表格，说明和示例使用短段落、列表和代码块。
- API endpoint 标题和表格使用相对 path；base URL 只单独说明一次，curl 示例可使用完整生产 URL。
- 收敛仓库根目录文件：部署编排、部署模板和运行环境相关文件应放入 `deploy/` 或等价目录，根目录只保留开源项目入口和工具必须发现的文件。
- 收敛 `scripts/` 中面向一次性验收或硬编码文件内容的专项 verify 脚本；CI 应优先运行 lint、typecheck、test、build、OpenSpec、secret scan、OpenAPI 契约和 compose config 这类通用门禁。
- 拆分 GitHub Actions 职责：`ci.yml` 负责 PR/branch 质量门禁，镜像构建发布使用独立 workflow，生产部署如需 workflow 入口也应与 CI 分离并受环境保护。

## Non-goals

- 不修改应用代码、API 行为、数据库 schema、部署逻辑或 GitHub OAuth 配置。
- 不改变 `docs/api/openapi.yaml` 的接口契约语义，除非为匹配文档结构做非行为性描述调整。
- 不删除 legacy `../nodeclub/` 作为业务参考的事实，只把迁移背景和业务知识沉淀从 `docs/` 转移到 `wiki/` 或等价知识库目录中。
- 不在 README 中恢复长篇架构、部署或迁移说明。
- 不把文档和部署规范实现成大量只能匹配当前文件文本的 CI 脚本。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `documentation-information-architecture`: 将文档从“图优先上线材料”改为“开源项目入口 + docs/wiki/deploy 同级内容域 + docs/conventions + wiki 规范 + deploy 规范 + 读者任务导向 + 描述/图形/简约说明”。
- `public-api-documentation`: 将 API reference 改为社区标准接口手册，按 method/path/query/params/body/response/errors/example 表格式组织。
- `production-deployment-governance`: 将生产部署编排文件从仓库根目录收敛到 `deploy/` 或等价目录，规范 compose、SQL、启动脚本和 dotenv 模板，并要求文档、命令和 CI 引用新路径。

## Impact

- 文档：`README.md`、`CONTRIBUTING.md`、`docs/*.md`、`docs/api-reference.md`、`docs/api/openapi.yaml` 和 `wiki/` 中的说明性内容。
- 仓库组织：`deployment/docker-compose.yml` 等部署编排文件、部署 SQL、启动脚本、dotenv 模板的位置，以及引用这些文件的部署文档、脚本和 GitHub Actions workflow。
- OpenSpec：更新文档信息架构和公共 API 文档规范。
- 不影响运行时服务、容器镜像、数据库、认证、API 行为或生产部署。
