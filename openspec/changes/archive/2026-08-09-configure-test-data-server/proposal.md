## Why

当前测试活动缺少与生产隔离的持久化 PostgreSQL 和 Redis 服务，后续验证容易误用生产基础设施。需要建立一台仅承载测试数据服务的主机，并用明确边界阻止应用镜像部署到该主机。

## What Changes

- 在独立测试主机上运行与仓库基线一致的 PostgreSQL 18 和 Redis 7 官方服务容器，并运行 Adminer 5 官方管理工具容器。
- 为两项服务启用持久化、健康检查、自动重启和服务端本地生成的随机凭据。
- 发布 PostgreSQL 与 Redis 标准端口；来源 IP 白名单和云安全组由操作者独立配置。
- 通过 `8080` 发布 Adminer，由操作者使用来源 IP 白名单限制访问；Adminer 仅通过内部网络访问 PostgreSQL，且不预置数据库凭据。
- 清理测试数据库中无活动 backend 且不含对象的遗留临时 schema，不删除 PostgreSQL 系统 schema 或应用表。
- 将操作者提供的 PostgreSQL custom dump 通过 SSH 加密传输到测试服务器，并只恢复到测试数据库。
- 禁止在该主机部署 CNode API、Web、worker、迁移任务或其他业务应用镜像。
- 记录不含主机地址、凭据和环境专属连接信息的验证与运维边界。

## Capabilities

### New Capabilities

- `test-data-services`: 定义隔离测试主机的数据服务、持久化、安全和应用部署边界。

### Modified Capabilities

无。

## Impact

- 范围内：独立测试主机上的 Docker Compose 数据服务、Adminer 管理工具、持久卷、凭据文件、健康检查、重启策略、空闲临时 schema 清理及生产快照到测试库的受控恢复。
- 范围外：生产服务器写操作、CNode 应用部署、生产库恢复、阿里云安全组及来源 IP 白名单配置。
- 受影响系统：测试 PostgreSQL、测试 Redis、远端 Docker 运行时。
- 高风险类别：远程基础设施变更、网络端口暴露、凭据管理、持久化数据。
- 不改变应用 API、数据库 schema、运行时环境变量契约或生产 Compose 基线。

## Non-goals

- 不在测试数据主机运行任何 CNode 应用、迁移镜像或 Adminer 以外的管理应用。
- 不把生产备份恢复到生产库，不复制生产凭据或生产配置，不向命令输出或仓库内容暴露用户数据。
- 不由本变更配置云防火墙、安全组或开发机来源地址。
- 不提供多节点高可用、灾难恢复或生产级备份能力。

## Documentation Impact

- `docs/deployment/`：本次不加入环境专属主机、连接方式或凭据；现有生产示例保持不变。
- `docs/arch/`、`docs/biz/`、根治理文件和应用 README：无影响。
- `apps/web/public/openapi.json`：无 API 合约变更，无需重新生成。
- 适用 `cnode-docs` 规则，OpenSpec 仅记录可长期复用且不敏感的边界。
