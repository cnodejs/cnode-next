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

生产部署 runbook、示例编排、示例配置、启动或部署辅助脚本 SHALL 收敛到 `docs/deployment/`；这些文件 MUST 使用安全占位值并明确其示例性质，仓库不得保留并列的顶层 `deployment/` 域。

#### Scenario: 生产 Compose 示例位置

- **WHEN** 仓库提供生产 Docker Compose 示例
- **THEN** 文件 MUST 位于 `docs/deployment/docker-compose.yml`
- **AND** 根目录与顶层 `deployment/` MUST NOT 放置另一份生产 Compose

#### Scenario: 部署说明位置

- **WHEN** 维护者查找部署步骤
- **THEN** 项目 MUST 提供 `docs/deployment/deployment.md`
- **AND** `docs/deployment/` MUST NOT 使用 README 或 index 文件作为入口

#### Scenario: 部署资产分类

- **WHEN** 部署示例包含 Compose、dotenv、启动脚本或辅助脚本
- **THEN** 这些文件 MUST 在 `docs/deployment/` 内按用途清晰命名或分目录组织
- **AND** 根 package scripts、文档和 workflow MUST 使用迁移后的路径

#### Scenario: dotenv 示例按配置域分组

- **WHEN** 仓库提供部署 dotenv 示例或模板
- **THEN** 模板 MUST 使用注释或等价结构按配置域分组
- **AND** 分组 SHOULD 覆盖应用 URL、数据库、Redis、认证、对象存储、Turnstile、邮件、观测/日志和迁移/运维开关
- **AND** 模板 MUST 使用占位值，不得包含真实 secret、token、私有连接串、生产主机或用户数据

#### Scenario: 部署辅助脚本可追溯

- **WHEN** `docs/deployment/scripts/` 包含可执行辅助脚本
- **THEN** 文件名或相邻部署说明 MUST 表达用途、执行时机和所需环境变量
- **AND** 运行输出 MUST 写入忽略或外部路径，不得作为长期文档提交

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
- **THEN** 约束 SHOULD 写入 `AGENTS.md`、项目级 `cnode-docs` Skill、OpenSpec 或 review checklist
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
- **AND** 部署命令 MUST 保留在 `docs/deployment/deployment.md`
### Requirement: 版本化部署资产必须保持通用
仓库中的部署示例 SHALL 使用稳定的仓库相对路径、变量和占位配置，不得记录环境特定路径、连接方式、私有基础设施拓扑、凭据位置或运行数据。

#### Scenario: 引用 Compose 编排
- **WHEN** 文档、规格或脚本引用版本化 Compose 编排
- **THEN** 引用 MUST 使用 `docs/deployment/docker-compose.yml`
- **AND** 旧文件名 MUST 不再作为当前推荐命令出现

#### Scenario: 编写部署说明
- **WHEN** 维护者更新 `docs/deployment/deployment.md` 或部署示例
- **THEN** 内容 MUST 使用仓库相对路径、变量和占位值
- **AND** 内容 MUST NOT 包含仅适用于某个运行环境的信息

#### Scenario: 保留长期安全约束
- **WHEN** 精简或整理部署文档
- **THEN** 文档 MUST 保留 reviewed migration、备份、健康检查和回滚约束
- **AND** 文档 MUST NOT 通过复制一次性检查表扩展日常入口
