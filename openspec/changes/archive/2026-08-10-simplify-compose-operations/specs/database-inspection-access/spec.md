## ADDED Requirements

### Requirement: Adminer 必须作为按需数据库查看服务运行

生产 Compose SHALL 提供 Adminer 服务，使获准运维人员能够通过 PostgreSQL 认证查看 `postgres` 服务中的数据；该服务不得随普通应用服务启动。

#### Scenario: 普通生产服务启动
- **WHEN** 运维不选择 Adminer profile 执行普通 `docker compose up`
- **THEN** Adminer MUST NOT 启动
- **AND** Adminer 公网端口 MUST NOT 被发布

#### Scenario: 显式启动 Adminer
- **WHEN** 运维选择 Adminer profile 并启动 Adminer
- **THEN** Compose MUST 使用固定版本的 Adminer 镜像
- **AND** Adminer MUST 通过 `cnode-internal` 网络连接 `postgres`
- **AND** Adminer MUST 使用镜像内置工具检查本机 HTTP 入口
- **AND** Adminer MUST NOT 获得数据库密码或其他真实凭据的仓库内默认值

### Requirement: Adminer 公网访问必须受外部来源 IP 白名单控制

Adminer SHALL 按运维明确决策直接发布宿主公网端口，但启动前 MUST 由仓库外网络控制将访问来源限制为获准 IP；Compose 和文档不得声称端口发布本身提供来源过滤。

#### Scenario: 白名单尚未配置
- **WHEN** 宿主机防火墙、云安全组或反向代理尚未限制 Adminer 端口的来源 IP
- **THEN** 运维 MUST NOT 启动 Adminer profile

#### Scenario: 白名单已经配置
- **WHEN** 运维确认 Adminer 端口只允许批准的来源 IP
- **THEN** 运维 MAY 启动 Adminer profile 并通过配置的公网端口访问
- **AND** 部署说明 MUST 要求验证非白名单来源无法连接

#### Scenario: 查看操作结束
- **WHEN** 获准的数据库查看操作完成
- **THEN** 运维 MUST 停止并删除 Adminer 容器
- **AND** Adminer MUST NOT 作为长期默认运行服务保留

### Requirement: Adminer 配置和文档不得泄露数据库凭据

Adminer 的 Compose 和部署示例 MUST 只包含通用变量与占位值，不得保存或输出真实数据库密码、连接串、用户数据、私有主机或环境白名单内容。

#### Scenario: 维护部署示例
- **WHEN** 维护者更新 Adminer Compose、dotenv 示例或操作说明
- **THEN** 所有环境特定值 MUST 使用变量或安全占位值
- **AND** 数据库认证 MUST 在访问时由获准运维人员提供，而不是提交到仓库
