## ADDED Requirements

### Requirement: Development workflow SHALL support opt-in PostgreSQL and Redis mode
系统 MUST 允许贡献者通过环境配置从 sqlite-first 模式切换到 PostgreSQL/Redis 模式。

#### Scenario: Contributor enables pg and redis settings
- **WHEN** 贡献者设置必需的 pg 与 redis 环境变量
- **THEN** 运行时组件 MUST 连接 PostgreSQL/Redis 服务，而不是 sqlite 与 mock cache 默认实现

#### Scenario: Contributor disables pg and redis settings
- **WHEN** 贡献者移除 pg 与 redis 环境变量
- **THEN** 运行时 MUST 无需改代码即可回到 sqlite-first 行为

### Requirement: Codespaces SHALL provide service-only pg and redis infrastructure
Codespaces 配置 MUST 提供 PostgreSQL/Redis 服务，同时保持应用进程运行在服务容器之外。

#### Scenario: Codespace is created for repository
- **WHEN** 贡献者在 Codespaces 中打开该仓库
- **THEN** PostgreSQL/Redis 服务 MUST 可用，并可作为可选开发路径的复用基础设施

#### Scenario: Contributor runs app commands in Codespaces
- **WHEN** 贡献者执行 web 或 api 开发命令
- **THEN** 这些命令 MUST 在 workspace 环境中运行，且 MUST NOT 依赖应用镜像打包
