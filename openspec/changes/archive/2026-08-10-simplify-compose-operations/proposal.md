## Why

生产 Compose 当前为一次性的 MongoDB 到 PostgreSQL 数据迁移和对账分别保留 `migrate-data`、`reconcile` 服务，但两者只是复用 API 镜像执行根级 `pnpm` 命令，且不属于日常部署拓扑。与此同时，运维缺少一个受控、可选的 PostgreSQL 图形化查看入口，生产已运行的 OpenObserve 也尚未纳入版本化 Compose 基线。

## What Changes

- **BREAKING**：从 `docs/deployment/docker-compose.yml` 删除 `migrate-schema`、`migrate-data`、`reconcile` 等低频一次性服务，以及已下线 MongoDB 对应的 legacy external network。
- PostgreSQL schema migration 改为通过 `docker compose run --rm api pnpm db:migrate` 创建隔离的一次性 API 容器。
- 增加显式 profile 管理的 Adminer 服务，连接 Compose 内部 PostgreSQL 网络并直接发布宿主公网端口。
- 将来源 IP 白名单设为启动 Adminer 前的强制运维条件；白名单由仓库外的宿主机防火墙、云安全组或反向代理实施，Compose 不声明其能够过滤来源 IP。
- 增加使用 `public.ecr.aws/zinclabs/openobserve:latest` 的长期 OpenObserve 服务、`openobserve-data` 持久卷、内部网络和 restart policy，并在 dotenv example 中加入空的 root 用户邮箱和密码变量。
- 更新部署说明，覆盖 Adminer 的启动、验证、停止、白名单责任、OpenObserve 现有实例的安全纳管边界，并同步收敛一次性数据迁移说明。

## Capabilities

### New Capabilities

- `database-inspection-access`：定义 Adminer 的按需启动、数据库内网连接、公网端口、外部来源 IP 白名单和关闭行为。
- `openobserve-compose-service`：定义现有 OpenObserve 实例进入 Compose 基线时的镜像、凭据变量、数据卷、内部网络、重启策略和安全纳管行为。

### Modified Capabilities

- `container-image-delivery`：删除独立 migration Compose 服务，改为由不可变 API 镜像执行一次性 schema migration 命令。
- `immutable-image-release`：不可变 API 镜像约束改为覆盖通过 `api` 服务定义启动的 schema migration，而非已删除的服务名。

## Impact

### Scope

- In scope：`docs/deployment/docker-compose.yml`、`docs/deployment/deployment.md`、`docs/deployment/env.production.example`、`docs/biz/migration-background.md`，以及本 proposal 列出的 OpenSpec capabilities。
- Out of scope：删除历史 migration 脚本、修改 PostgreSQL schema、应用 API、Adminer 身份认证扩展、OpenTelemetry SDK/Collector、traces/logs/metrics 接入、OpenObserve UI 端口或反向代理、OpenObserve 凭据轮换、自动配置云安全组或宿主机防火墙、保存任何环境真实白名单或凭据。
- Affected systems：生产 Compose 编排、一次性迁移操作、PostgreSQL 运维查看入口、OpenObserve 容器与持久数据卷、外部网络访问控制。
- High-risk categories：破坏性数据迁移、数据库管理面公网暴露、OpenObserve 既有数据卷纳管、凭据处理和生产网络边界。

### Documentation Impact

- `docs/deployment/` 是 Compose、Adminer、OpenObserve 纳管操作和安全前置条件的权威位置，必须同步更新示例 Compose、dotenv 占位项和部署说明。
- `docs/biz/migration-background.md` 仅更新长期有效的一次性迁移执行边界，不复制完整命令清单。
- `docs/arch/`、根治理文件、app README、生成的 Web OpenAPI 资产不受影响。
- 后续 `add-opentelemetry-observability` 只依赖本 change 提供的 `openobserve` 服务、`cnode-internal` 网络和 `http://openobserve:5080` 内部入口，不反向扩大本 change 范围。
- 适用 Skill：`cnode-docs`，用于控制部署文档归属、安全占位值和避免重复说明。
