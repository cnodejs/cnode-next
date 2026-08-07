## Why

当前长期文档分散在 `docs/`、`wiki/`、`api/` 与 `deployment/`，部分内容重复源码、保留一次性过程或承担索引职责；根治理文件和 GitHub 模板也重复要求贡献者填写可由代码与 CI 判断的信息。需要建立单一、简洁、可执行的信息架构，并通过项目级 Skills 约束 Agent 在文档与 Web 设计任务中的具体行为。

## What Changes

- 将长期文档统一收敛到 `docs/arch/`、`docs/biz/`、`docs/deployment/`，移除 `wiki/`、顶层 `api/` 与顶层 `deployment/` 文档域，不建立 `README.md`、`index.md` 等文档索引页。
- 审计现有内容，按权威来源执行保留、压缩、合并或删除；业务文档只保留稳定语义和可追溯依据，不镜像路由、schema 或实现函数。
- 将 OpenAPI 直接生成到 `apps/web/public/openapi.json`，作为 Web `/api` 页面使用的唯一版本化 OAS 输出。
- 将部署说明、示例配置、Compose 与辅助脚本迁入 `docs/deployment/`，同步命令、挂载和引用路径；所有示例仅使用占位数据。
- 精简根 `README.md`、`AGENTS.md`、`CONTRIBUTING.md`、`SECURITY.md`、`CODE_OF_CONDUCT.md`，新增 `apps/api/README.md` 与 `apps/web/README.md`。
- 在 `AGENTS.md` 保留硬边界和 Skill 加载规则；新增项目级文档 Skill 与 Web 设计 Skill，承载详细执行规范。
- 将 Issue 模板简化为最小问题上下文，将 PR 模板简化为 Summary、Verification、Notes；workflow 只同步必要路径。
- **BREAKING**：仓库文档和部署资产路径变化，依赖旧路径的本地命令、链接及外部自动化需要改用新路径。

## Capabilities

### New Capabilities

- `project-agent-skills`: 定义项目级 Skills 的职责、触发条件以及与 `AGENTS.md`、自动化门禁的分层关系。
- `github-collaboration-templates`: 定义最小化 Issue/PR 模板及安全报告入口。

### Modified Capabilities

- `documentation-information-architecture`: 将长期文档统一到三个 `docs/` 分类，建立内容标准、根治理文件和应用 README 职责，并取消文档索引页。
- `public-api-documentation`: 将 `apps/web/public/openapi.json` 作为唯一生成的 OAS 输出和 Web 静态资产。
- `production-deployment-governance`: 将部署示例资产迁入 `docs/deployment/` 并保持现有显式迁移、验证和回滚边界。
- `openspec-change-governance`: 文档影响评估改用新的 `docs/` 分类，不再要求独立 `wiki/` 域。
- `web-design-system-governance`: 将 Agent 执行细则下沉到项目级 Web 设计 Skill，架构文档只保留稳定设计决策。

## Non-goals

- 不改变 CNode 业务规则、legacy `../nodeclub/` 兼容行为、API 路由或响应契约。
- 不改变 PostgreSQL schema、迁移数据、生产拓扑、镜像发布方式或部署步骤语义。
- 不重写 OpenSpec archive 或 Git 历史，不新增文档站点和文档索引。

## Scope

### In Scope

- `docs/`、`wiki/`、`api/`、`deployment/`、根治理文件、`apps/*/README.md`、项目级 Skills、`.github/` 模板及受路径影响的脚本和 workflow。

### Out Of Scope

- 应用功能、数据库结构、运行时接口、生产环境真实配置及 `../nodeclub/`、`egg-cnode/` 参考代码。

### Affected Systems

- 文档生成、Web API 文档静态资源、部署辅助命令、OpenSpec 治理、Agent 工作流和 GitHub 协作入口。

### High-Risk Categories

- API contract：仅收敛生成输出，不改变内容。
- Deployment/release：路径变化必须保持 Compose 和辅助命令可用。
- Security：示例与文档不得引入真实环境数据。
- Database、migration/data repair、permissions：无行为变更。

## Documentation Impact

- 重组并精简全部当前 `docs/` 与 `wiki/` 内容，删除 `wiki/` 文档域。
- 更新根治理文件和应用 README；不建立任何文档索引页。
- OpenSpec 主规格同步新路径与文档标准，archive 仅保留历史记录。

## Impact

- 受影响路径包括 `docs/`、`wiki/`、`api/`、`deployment/`、`.github/`、`AGENTS.md`、根公共文档、`apps/api/scripts/gen-openapi.ts`、`package.json` 及其中引用旧路径的文件。
- 不新增运行时依赖；验证需覆盖 OpenAPI 生成、部署配置解析、链接与旧路径清理、lint/typecheck/test/build/OpenSpec/secrets。
