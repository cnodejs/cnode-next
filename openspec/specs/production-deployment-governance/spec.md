# production-deployment-governance Specification

## Purpose

Define production deployment runbook, deploy asset organization, audit, CI gates, and workflow boundaries.

## Requirements

### Requirement: 生产部署必须有标准 runbook

项目 SHALL 提供标准生产部署 runbook，覆盖 preflight、migration、镜像拉取、服务启动、健康检查、smoke、回滚和审计记录。

#### Scenario: 部署前 preflight

- **WHEN** 运维准备生产部署
- **THEN** runbook MUST 要求确认目标 commit、API/Web image tag 或 digest、当前生产镜像、数据库迁移策略和回滚点
- **AND** runbook MUST 要求确认 `.env` 中不会打印或提交 secret

#### Scenario: 部署后验证

- **WHEN** 运维完成 `docker compose up -d --no-build`
- **THEN** runbook MUST 要求验证 API `/health`
- **AND** runbook MUST 要求运行公开 URL、API contract 和关键写入 smoke 中适用于本次发布的检查

### Requirement: migration 必须显式执行和审计

生产 schema/data migration SHALL 作为显式步骤执行，不得在普通服务启动时隐式运行。

#### Scenario: schema migration 显式执行

- **WHEN** 发布包含 PostgreSQL schema 变更
- **THEN** 运维 MUST 使用 runbook 中的 migrate profile 或等价显式命令执行 schema migration
- **AND** migration 输出和结果 MUST 被记录

#### Scenario: migration 失败阻断服务切换

- **WHEN** migration 返回失败
- **THEN** 运维 MUST 停止继续部署新应用镜像
- **AND** runbook MUST 指向回滚或人工修复流程

### Requirement: 部署记录必须可审计

每次生产部署 SHALL 留下可审计记录，能够回答谁在何时把哪个 commit/image 部署到了生产以及验证结果如何。

#### Scenario: 成功部署记录

- **WHEN** 生产部署成功完成
- **THEN** 记录 MUST 包含时间、操作者、Git commit、API image、Web image、migration 结果、health 结果和 smoke 结果
- **AND** 记录 MUST NOT 包含 secret、OAuth token、数据库密码或认证 header

#### Scenario: 回滚记录

- **WHEN** 生产部署触发回滚
- **THEN** 记录 MUST 包含失败的新 image、恢复的旧 image、回滚原因和回滚后 health/smoke 结果

### Requirement: 生产部署资产必须集中管理

生产部署 runbook、部署编排、部署模板、部署 SQL、启动脚本、dotenv 示例和部署辅助文件 SHALL 收敛到专门的 `deployment/` 部署域，避免仓库根目录或 `docs/` 堆放生产实现细节。

#### Scenario: 生产 compose 文件位置

- **WHEN** 仓库提供生产 Docker Compose 编排
- **THEN** 该文件 MUST 位于 `deployment/` 或等价部署目录
- **AND** 根目录 MUST NOT 直接放置生产 `docker-compose.yml` 编排文件

#### Scenario: deployment 与 docs/wiki 同级

- **WHEN** 仓库包含生产部署 runbook 或部署资产
- **THEN** `deployment/` MUST 作为与 `docs/`、`wiki/` 同级的顶层目录存在
- **AND** `deployment/` MUST 包含 README 或等价规范说明生产部署步骤和部署资产职责边界

#### Scenario: 部署资产分类

- **WHEN** 部署资产包含 compose、SQL、启动脚本或配置模板
- **THEN** 这些文件 MUST 在 `deployment/` 内按用途清晰命名或分目录组织
- **AND** `deployment/` 规范 MUST 说明 docker-compose 文件、SQL 文件、启动脚本和 dotenv 模板各自用途

#### Scenario: 部署命令引用新路径

- **WHEN** 文档、脚本或运维 runbook 引用生产 compose 文件
- **THEN** 它们 MUST 使用部署目录路径，例如 `deployment/docker-compose.yml`
- **AND** 旧路径 MUST 不再作为推荐命令出现

#### Scenario: dotenv 示例按配置域分组

- **WHEN** 仓库提供部署 dotenv 示例或模板
- **THEN** 模板 MUST 使用注释或等价结构按配置域分组
- **AND** 分组 SHOULD 覆盖应用 URL、数据库、Redis、认证、对象存储、Turnstile、邮件、观测/日志和迁移/运维开关
- **AND** 模板 MUST 使用占位值，不得包含真实 secret、token、私有连接串或生产用户数据

#### Scenario: 启动脚本和 SQL 可追溯

- **WHEN** `deployment/` 包含启动脚本或 SQL 文件
- **THEN** 文件名或相邻说明 MUST 表达执行时机和用途
- **AND** 文档 MUST 说明这些资产是否可重复执行、是否会修改数据、以及执行前需要的环境变量

### Requirement: CI 必须避免一次性文件文本验收脚本

CI 和 `pnpm verify` SHALL 使用长期可维护的通用质量门禁，避免依赖大量针对具体文件内容、具体文档句子或一次性上线验收目标的专项 verify 脚本。

#### Scenario: 通用质量门禁

- **WHEN** CI 执行发布或 PR 验证
- **THEN** 它 SHOULD 运行 lint、typecheck、test、build、OpenSpec validate、secret scan 和 OpenAPI 契约检查这类通用检查
- **AND** repository verification MUST NOT 在本地运行 Docker Compose；Compose validation MUST 属于部署主机 preflight
- **AND** 这些检查 MUST NOT 依赖真实 `.env` secret 值

#### Scenario: 专项 verify 脚本收敛

- **WHEN** `scripts/` 中存在只验证当前文档文本、当前 compose 文本或当前 workflow 文本的 `verify-*` 脚本
- **THEN** 该脚本 MUST 被删除、归档到一次性变更记录，或替换为更通用的契约/配置校验
- **AND** `pnpm verify` MUST NOT 长期依赖这类一次性脚本

#### Scenario: 文档结构由规范约束

- **WHEN** 文档结构、目录职责或 README 信息架构需要约束
- **THEN** 约束 SHOULD 写入 `docs/conventions.md`、OpenSpec 或 review checklist
- **AND** CI MUST NOT 通过硬编码文档必须包含某几句固定文字来代替人工 review

### Requirement: GitHub Actions 必须按职责拆分

GitHub Actions workflow SHALL 按 CI、镜像构建发布和生产部署入口分离职责，并使用最小权限。

#### Scenario: PR 和分支 CI

- **WHEN** pull request 或普通分支 push 触发验证
- **THEN** `ci.yml` 或等价 CI workflow MUST 运行通用质量门禁
- **AND** CI workflow MUST NOT 需要 `packages: write` 权限

#### Scenario: 镜像构建发布

- **WHEN** main、tag 或手动发布触发容器镜像构建
- **THEN** 镜像 workflow MUST 与 PR CI 分离
- **AND** 只有镜像 workflow SHOULD 使用 `packages: write` 权限推送 GHCR 镜像
- **AND** 镜像 tag MUST 包含 commit SHA 或 digest 可追溯标识

#### Scenario: 生产部署入口

- **WHEN** 仓库提供 GitHub Actions 生产部署入口
- **THEN** 部署 workflow MUST 与 CI 和镜像构建 workflow 分离
- **AND** 部署 workflow MUST 使用手动触发、受保护 environment、最小权限 secret 和审计记录
- **AND** 部署 workflow MUST NOT 在日志中打印 `.env`、tokens、私钥、数据库 URL 或用户数据

#### Scenario: 当前无自动部署

- **WHEN** 项目选择人工执行部署 runbook
- **THEN** GitHub Actions MUST 只构建并发布镜像
- **AND** 部署命令 MUST 保留在 `deployment/README.md` 或等价部署域说明中
