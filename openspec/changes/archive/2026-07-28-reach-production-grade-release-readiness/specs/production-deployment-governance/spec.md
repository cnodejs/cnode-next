## ADDED Requirements

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
