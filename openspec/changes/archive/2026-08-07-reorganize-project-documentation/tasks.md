## 1. 建立治理基线

- [x] 1.1 新增项目级 `cnode-docs` Skill，覆盖文档分类、单一权威来源、内容保留/压缩/合并/删除、安全占位、GitHub 模板和验证流程
- [x] 1.2 新增项目级 `cnode-web-design` Skill，将现有组件治理、semantic theme、页面原型、响应式、Markdown 和 UI 验收执行细则下沉到 Skill
- [x] 1.3 精简 `AGENTS.md`，保留硬边界、常用命令、文档最低规范以及两个项目 Skill 的强制触发映射

## 2. 重组并精简长期文档

- [x] 2.1 建立 `docs/arch/`、`docs/biz/`、`docs/deployment/`，确认不创建 README 或 index 文档
- [x] 2.2 将架构、数据库和设计系统内容迁入 `docs/arch/`，按权威来源删除目录索引、源码镜像、重复命令和 Agent 操作清单
- [x] 2.3 将业务规则、社区规则、内容治理、legacy 行为和迁移背景迁入 `docs/biz/`，合并重复主题并删除字段、路由、函数级实现复述
- [x] 2.4 将仍有价值的不确定业务知识标记为 `To Confirm` 并保留来源；删除无依据推断、Review Status 填充和过时历史叙述
- [x] 2.5 将开发说明拆入根 README 与 `apps/api/README.md`、`apps/web/README.md`，并删除已被治理文件或 Skills 替代的 conventions、OpenSpec governance、security 和 writing-guidelines 文档
- [x] 2.6 删除 `wiki/` 及旧文档入口，检查目标文档符合单一目的、无索引页和无重复权威说明

## 3. 迁移 OpenAPI 文档

- [x] 3.1 更新 OpenAPI 生成器，使 `pnpm gen:openapi` 只生成 `apps/web/public/openapi.json`
- [x] 3.2 删除顶层 `api/openapi.json` 和 `docs/api/openapi.json`，更新 README、治理文件、脚本、测试、workflow 和当前规格中的路径引用
- [x] 3.3 运行 OpenAPI 生成并验证 Web `/api` 仍从 `/openapi.json` 加载且生成内容不含真实环境数据

## 4. 迁移部署示例资产

- [x] 4.1 将部署说明迁为 `docs/deployment/deployment.md`，保留 reviewed migration、备份、启动、health、smoke 与 rollback，删除环境特定信息和重复检查表
- [x] 4.2 将 Compose、dotenv 示例和部署辅助脚本迁入 `docs/deployment/`，将 dotenv 文件改为非隐藏示例名并复核所有值均为明显占位值
- [x] 4.3 更新根 package scripts、文档、workflow 和当前规格中的部署路径，并修正 Compose 移动后的 env、volume 与运行输出相对路径
- [x] 4.4 移除版本化 `migration-reports/` 运行输出目录和顶层 `deployment/`，在部署 preflight 中验证新 Compose 配置可解析且普通 `pnpm verify` 不运行 Compose

## 5. 精简项目入口与协作模板

- [x] 5.1 精简根 `README.md`、`CONTRIBUTING.md`、`SECURITY.md` 和 `CODE_OF_CONDUCT.md`，确保各自职责单一且不形成完整文档索引
- [x] 5.2 完成 `apps/api/README.md` 与 `apps/web/README.md`，只保留子项目职责、关键目录、应用命令和特有边界
- [x] 5.3 将 Bug Issue 模板精简为 Description、Reproduction、Additional context，将 Feature 模板精简为 Problem、Proposal
- [x] 5.4 将 PR 模板精简为 Summary、Verification、Notes，并将 Issue 配置收敛为私密安全报告入口
- [x] 5.5 检查 `.github/workflows/` 只同步必要路径，CI 与镜像构建职责、权限和触发方式保持不变

## 6. 规格同步与验证

- [x] 6.1 更新受影响的 OpenSpec 主规格，使其不再要求 `wiki/`、顶层 `api/`、顶层 `deployment/`、`docs/conventions.md` 或部署 README
- [x] 6.2 检查当前源码、配置、根文件、`docs/`、项目 Skills 和非 archive 规格中不存在旧文档路径或失效链接；archive 保持历史记录且不包含不安全数据
- [x] 6.3 复核文档中的 Mermaid 图、路径和职责与最终目录一致，并确认没有改变 legacy `../nodeclub/` 兼容语义、API 契约、数据库或生产部署行为
- [x] 6.4 运行相关定向测试以及 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm gen:openapi`、`pnpm secrets:scan`
- [x] 6.5 运行 `openspec validate reorganize-project-documentation --strict` 与 `openspec validate --all --strict`，确认任务、文档影响和 archive readiness 完整
