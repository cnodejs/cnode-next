## ADDED Requirements

### Requirement: 独立测试数据服务
测试主机 SHALL 仅运行 PostgreSQL 18、Redis 7 数据服务与 Adminer 5 管理工具，不得运行 CNode API、Web、worker、迁移任务或其他业务应用容器。

#### Scenario: 启动测试数据服务
- **WHEN** 操作者启动测试数据服务 Compose 项目
- **THEN** 项目仅创建 PostgreSQL、Redis 和 Adminer 三个服务容器
- **THEN** PostgreSQL 和 Redis 使用与仓库生产基线一致的大版本

### Requirement: 数据持久化与恢复
PostgreSQL 和 Redis SHALL 使用相互独立的持久卷，Redis SHALL 启用 AOF，两个服务 SHALL 在主机或 Docker 重启后自动恢复运行。

#### Scenario: 服务重启后保留数据
- **WHEN** 已写入测试数据的服务容器被重建或主机重启
- **THEN** PostgreSQL 数据仍可从其持久卷读取
- **THEN** Redis AOF 数据仍可从其持久卷读取

### Requirement: 服务认证
PostgreSQL 和 Redis SHALL 使用服务端生成的独立随机密码，并 SHALL 将凭据保存在仅 root 可读且不提交到仓库的文件中。

#### Scenario: 未认证连接被拒绝
- **WHEN** 客户端在未提供有效凭据的情况下连接任一数据服务
- **THEN** 服务拒绝需要认证的读写操作

#### Scenario: 凭据不出现在实施记录中
- **WHEN** 操作者检查仓库变更和命令输出
- **THEN** 其中不包含数据库密码、Redis 密码或完整连接 URL

### Requirement: 健康检查与资源边界
PostgreSQL、Redis 和 Adminer SHALL 配置健康检查和 `unless-stopped` 重启策略。

#### Scenario: 服务正常启动
- **WHEN** PostgreSQL 和 Redis 完成初始化
- **THEN** Compose 将三个服务标记为 healthy
- **THEN** 主机同时运行的服务范围不包含 CNode 业务应用容器

### Requirement: 网络责任边界
数据服务 SHALL 发布标准端口，Adminer SHALL 发布 `8080` 端口以支持指定来源 IP 访问，凭据认证 SHALL 保持开启；来源 IP 白名单、主机防火墙和云安全组 MUST 由操作者在基础设施侧配置。

#### Scenario: 端口发布完成
- **WHEN** 数据服务处于 healthy 状态
- **THEN** PostgreSQL 发布 `5432` 端口
- **THEN** Redis 发布 `6379` 端口
- **THEN** Adminer 发布 `8080` 端口
- **THEN** 服务配置不包含环境专属来源 IP

### Requirement: Adminer 凭据隔离
Adminer SHALL 只通过 `cnode-internal` 网络访问 PostgreSQL，SHALL 默认选择 `postgres` 服务，并 SHALL NOT 在容器配置中保存数据库用户名或密码。

#### Scenario: 打开数据库管理入口
- **WHEN** 操作者从允许的来源地址打开 Adminer
- **THEN** Adminer 显示登录页面并默认选择内部 `postgres` 服务
- **THEN** 操作者必须手动提供有效测试数据库凭据后才能查看数据库

### Requirement: 临时 schema 安全清理
测试数据库清理 SHALL 仅删除明确列入操作白名单、对象数为 0 且无活动 backend 的 `pg_temp_*` 与对应 `pg_toast_temp_*` schema，SHALL NOT 使用 `CASCADE`，并 SHALL NOT 删除系统 schema、Drizzle 管理对象或应用表。

#### Scenario: 清理空闲临时 schema
- **WHEN** 白名单临时 schema 的对象数为 0 且对应 backend PID 不存在
- **THEN** 操作者在事务中删除该临时 schema
- **THEN** 清理后非系统业务表集合保持不变

#### Scenario: 拒绝清理非空或活动 schema
- **WHEN** 候选 schema 包含对象、对应 backend 仍活动或名称不在白名单中
- **THEN** 清理事务终止且不删除该 schema

### Requirement: 生产快照受控恢复
系统 SHALL 只把操作者明确提供且已确认格式的 PostgreSQL custom dump 恢复到 `.env` 指定的测试数据库，SHALL 通过 SSH 传输备份，SHALL 在恢复前创建测试库回滚 dump，并 SHALL NOT 将 dump、用户数据或凭据提交到 Git 或打印到命令输出。

#### Scenario: 成功恢复测试数据库
- **WHEN** custom dump 有效、测试 PostgreSQL healthy 且恢复目标与 `.env` 一致
- **THEN** 操作者使用目标 PostgreSQL 容器内的 `pg_restore` 在单一事务中恢复 schema 和数据
- **THEN** 恢复命令不创建或连接其他数据库，不恢复源 owner 或 ACL
- **THEN** 恢复后业务表可查询且三个测试服务保持 healthy

#### Scenario: 恢复失败时不保留部分结果
- **WHEN** `pg_restore` 遇到不兼容对象或 SQL 错误
- **THEN** 单一恢复事务回滚
- **THEN** 恢复前回滚 dump 保持可用
