## MODIFIED Requirements

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

- **WHEN** 仓库提供部署 dotenv 示例
- **THEN** 模板 MUST 按应用、数据库、Redis、认证、存储、邮件、审核、迁移与观测等配置域分组
- **AND** 模板 MUST 只使用占位值，不得包含真实 secret、token、私有连接串、生产主机或用户数据

#### Scenario: 部署辅助脚本可追溯

- **WHEN** `docs/deployment/scripts/` 包含可执行辅助脚本
- **THEN** 文件名或相邻部署说明 MUST 表达用途、执行时机和所需环境变量
- **AND** 运行输出 MUST 写入忽略或外部路径，不得作为长期文档提交

### Requirement: 版本化部署示例必须保持通用

仓库中的部署示例 SHALL 使用稳定的仓库相对路径、变量和占位配置，不得记录环境特定路径、连接方式、私有基础设施拓扑、凭据位置或运行数据。

#### Scenario: 引用 Compose 编排

- **WHEN** 当前文档、规格或脚本引用版本化 Compose
- **THEN** 引用 MUST 使用 `docs/deployment/docker-compose.yml`
- **AND** `deployment/docker-compose.yml` MUST 不再作为当前推荐命令出现

#### Scenario: 编写部署说明

- **WHEN** 维护者更新 `docs/deployment/deployment.md` 或部署示例
- **THEN** 内容 MUST 使用变量和明显占位值
- **AND** 内容 MUST NOT 包含仅适用于某个生产环境的信息

#### Scenario: 保留长期安全约束

- **WHEN** 精简或整理部署文档
- **THEN** 文档 MUST 保留 reviewed migration、可恢复备份、健康检查、smoke 和回滚约束
- **AND** 文档 MUST NOT 通过复制一次性检查表扩展日常操作说明
