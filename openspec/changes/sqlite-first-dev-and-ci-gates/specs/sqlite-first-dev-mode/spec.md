## ADDED Requirements

### Requirement: Local development SHALL default to sqlite without Docker dependency
开发流程 MUST 支持在无 Docker 前提下使用 sqlite 完成基线开发任务。

#### Scenario: Contributor starts without Docker
- **WHEN** 贡献者本地没有 Docker 运行环境
- **THEN** 贡献者 MUST 仍可完成依赖安装、sqlite 初始化与核心开发命令执行

#### Scenario: No pg configuration provided
- **WHEN** 开发环境未提供显式的 pg 连接配置
- **THEN** 应用运行时 MUST 以 sqlite 兼容模式运行

### Requirement: sqlite-first documentation SHALL be explicit and actionable
仓库文档 MUST 明确 sqlite-first 为默认路径，并给出 pg/redis 可选模式的清晰边界。

#### Scenario: New contributor follows setup guide
- **WHEN** 新贡献者按默认开发文档执行
- **THEN** 文档路径 MUST 在不配置 PostgreSQL/Redis 的情况下成功完成

#### Scenario: Contributor compares development modes
- **WHEN** 贡献者阅读环境配置章节
- **THEN** 文档 MUST 清楚区分 sqlite 默认模式与 pg/redis 可选模式
