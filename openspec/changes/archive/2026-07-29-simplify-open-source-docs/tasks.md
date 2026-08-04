## 1. README 开源入口

- [x] 1.1 重写 README 首段为简短项目介绍和技术栈说明，不以“重写版本”或 legacy 迁移作为主叙事。
- [x] 1.2 将 README 中的 System Map、Data Flow、Release Flow、Repository Map 移到合适的 docs 文档或删除无效图。
- [x] 1.3 README 保留 Features、Tech Stack、Quick Start、Documentation、Contributing、Security、License 等开源项目入口内容。
- [x] 1.4 README 中 License 使用确定语气链接 MIT License，不再使用 “license status”。

## 2. docs 规范与轻量化

- [x] 2.1 新增或整理 `docs/conventions.md`，定义文档规范、开发规范、API 文档规范、目录职责和 secret handling 链接。
- [x] 2.2 将 docs 文档改为读者任务导向，保留 architecture、development、database、migration、api-reference 等稳定入口；生产部署入口放入同级 `deploy/` 域。
- [x] 2.3 对包含图形的文档应用“描述 → 图形 → 简约说明”结构，并将图后说明收敛为表格或短列表。
- [x] 2.4 删除、归档或迁移一次性 release readiness、内部评级和重复说明。
- [x] 2.5 更新 `CONTRIBUTING.md`，让贡献者先阅读 `docs/conventions.md`。

## 3. wiki 知识库规范

- [x] 3.1 建立与 `docs/` 同级的 `wiki/` 或等价知识库目录，用于迁移背景、legacy 行为、社区规则和业务逻辑沉淀。
- [x] 3.2 将 `docs/` 中偏历史、迁移背景或业务分析的内容迁移到 `wiki/`，并在 docs 中保留简短链接。
- [x] 3.3 为 `wiki/` 增加独立写作规范或模板，要求来源、适用范围、事实/推断/待确认边界、复核状态和禁止无依据扩写。
- [x] 3.4 在 `docs/conventions.md` 中说明 `docs/` 与 `wiki/` 是同级文档域，且 AI agent 编写 wiki 不得把猜测写成事实，缺少来源必须标记待确认。

## 4. deploy 部署资产域

- [x] 4.1 创建 `deploy/` 或等价部署目录，作为与 `docs/`、`wiki/` 同级的部署资产域。
- [x] 4.2 移动生产 compose、部署 SQL、启动脚本、dotenv 示例和部署相关模板到 `deploy/` 中的清晰子路径。
- [x] 4.3 为 `deploy/` 增加 README 或等价规范，说明 docker-compose 文件、SQL 文件、启动脚本、dotenv 模板和 secret handling 边界。
- [x] 4.4 将 dotenv 示例按配置域分组，例如应用 URL、数据库、Redis、认证、对象存储、Turnstile、邮件、观测/日志和运维开关。
- [x] 4.5 更新 README、docs、脚本和运维命令中对 `deployment/docker-compose.yml`、dotenv 示例、SQL 和启动脚本的引用。
- [x] 4.6 运行 `docker compose -f deployment/docker-compose.yml config --quiet` 或等价命令，确认新路径可用。
- [x] 4.7 确认根目录只保留开源入口、工具配置、源码目录、docs、wiki、deploy 和 OpenSpec 目录等必要文件。

## 5. CI 与 scripts 收敛

- [x] 5.1 盘点 `scripts/verify-*` 和 package scripts，区分长期通用门禁与一次性上线验收脚本。
- [x] 5.2 删除或归档针对具体文件文本、具体文档句子、当前 workflow action 版本的专项 verify 脚本。
- [x] 5.3 保留 lint、typecheck、test、build、OpenSpec validate、secret scan、OpenAPI 契约和 compose config 这类通用质量门禁。
- [x] 5.4 更新 `pnpm verify`，避免它依赖一次性文档/文件形态验收脚本。
- [x] 5.5 将 `.github/workflows` 按职责拆分为 CI、镜像构建发布和可选部署入口，避免一个 workflow 同时承担 PR verify、image publish 和 deploy。
- [x] 5.6 确认 `ci.yml` 使用只读权限，镜像 workflow 才授予 `packages: write`，部署 workflow 如存在必须使用手动触发和受保护环境。

## 6. API Reference 标准化

- [x] 6.1 重写 `docs/api-reference.md`，按 Topics、Replies、Users、Collections、Messages、Auth、Search、System 等能力分组。
- [x] 6.2 每个核心接口使用 method + relative path 标题，例如 `GET /api/v1/topics`。
- [x] 6.3 每个核心接口按需使用 Path Params、Query、Body、Response 字段表；说明、错误摘要和 Example 使用短段落、列表或代码块，避免全篇表格化。
- [x] 6.4 Base URL 只在总览中说明；endpoint 标题和表格不重复完整域名。
- [x] 6.5 移除 API reference 中作为主体说明的 `localhost` 调用地址，将本地开发说明链接到 `docs/development.md`。
- [x] 6.6 运行 `pnpm verify:openapi-contract`，确认 OAS/Web 契约仍通过。

## 7. 验证

- [x] 7.1 运行 `pnpm lint`。
- [x] 7.2 运行 `openspec validate --all --strict`。
- [x] 7.3 运行 `pnpm secrets:scan`。
- [x] 7.4 复核 README、docs、wiki、deploy、CONTRIBUTING、API reference 和部署路径链接无明显断链或旧路径残留。

## 8. 协作规范补强

- [x] 8.1 扩充 `docs/conventions.md`，补充 Git Workflow（分支命名、Conventional Commits、squash merge）、Pull Requests、Code Review、Testing、OpenSpec And Design Process 章节。
- [x] 8.2 新增 `CODE_OF_CONDUCT.md`（Contributor Covenant 2.1）。
- [x] 8.3 新增 `.github/PULL_REQUEST_TEMPLATE.md`，包含 OpenSpec、Verification、Impact Checklist、Migration/Deployment Notes。
- [x] 8.4 新增 `.github/ISSUE_TEMPLATE/bug_report.yml` 和 `feature_request.yml`，以及 `config.yml` 指向安全报告和 OpenSpec。
- [x] 8.5 README 和 CONTRIBUTING 引用 Code of Conduct。

## 9. 残留清理与 CI 优化

- [x] 9.1 删除根目录旧生产 Compose，确认根目录不再存放生产编排。
- [x] 9.2 `build-images.yml` 移除重复的 `verify` job，CI 质量门禁由 `ci.yml` 承担，镜像 workflow 只负责 build/push。
- [x] 9.3 wiki 占位页（`legacy-behavior.md`、`migration-background.md`）补充来源、事实、推断、待确认，引用当前源码与 compose profile。
- [x] 9.4 运行 `pnpm verify` 与 `openspec validate --all --strict` 最终验证。
