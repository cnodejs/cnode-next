## 1. MVP Compose 简化

- [x] 1.1 从 `docs/deployment/docker-compose.yml` 删除 `migrate-schema`、`migrate-data` 和 `reconcile`，schema migration 统一复用不可变 API 镜像的一次性容器。
- [x] 1.2 删除已下线 MongoDB 的 legacy external network、生产 dotenv 配置和 data migration/reconcile runbook。
- [x] 1.3 将部署说明改为从仓库根直接执行、只依赖根 `.env` 的顺序化 runbook，并保留显式 schema migration、备份和失败阻断约束。

## 2. Adminer 按需访问

- [x] 2.1 选择并记录非 `latest` 的固定 Adminer 官方镜像版本，在 Compose 中添加仅由显式 profile 启动、等待 PostgreSQL healthy、仅加入 `cnode-internal` 的 Adminer 服务。
- [x] 2.2 为 Adminer 发布可配置的宿主公网端口，只设置非敏感的默认 PostgreSQL 服务名，不向 Compose 注入数据库账号或密码。
- [x] 2.3 更新 `docs/deployment/env.production.example`，仅添加 Adminer profile/端口所需的安全占位配置，不包含真实白名单、私有主机或凭据。
- [x] 2.4 在 `docs/deployment/deployment.md` 记录 Adminer 的外部来源 IP 白名单 preflight、显式启动、允许/拒绝来源验证、登录凭据边界以及使用后停止和删除容器的命令。

## 3. OpenObserve Compose 纳管

- [x] 3.1 在 `docs/deployment/docker-compose.yml` 增加用户指定的 `public.ecr.aws/zinclabs/openobserve:latest` 服务、共享 env file、`openobserve-data:/data`、`cnode-internal` 和 `restart: unless-stopped`，并声明顶层 `openobserve-data` volume；不得在实施验证中启动该服务。
- [x] 3.2 在 `docs/deployment/env.production.example` 的 Observability 分组加入空的 `ZO_ROOT_USER_EMAIL=` 和 `ZO_ROOT_USER_PASSWORD=`，不得填入真实邮箱或密码。
- [x] 3.3 在 `docs/deployment/deployment.md` 记录首次 Compose 纳管前只读核对现有 OpenObserve container、actual image、mount、volume 和 Compose project 身份的要求，避免创建第二实例或空数据卷。
- [x] 3.4 记录 `latest` 的运维风险，要求 pull/recreate 前保存实际 image ID/digest、确认上游兼容性和可恢复数据备份；确认 `http://openobserve:5080` 仅作为 `cnode-internal` 内部入口，不新增宿主端口、OpenTelemetry Collector、应用 instrumentation、日志采集、反向代理或凭据轮换说明。

## 4. 文档与规范同步

- [x] 4.1 按 `cnode-docs` 保持 `docs/biz/migration-background.md` 只记录历史迁移语义，不加入已下线 MongoDB 的生产操作命令。
- [x] 4.2 检查当前非归档 specs、部署文档和脚本中的 `migrate-data`、`reconcile` 服务名及旧操作方式，更新权威引用并保留历史 archive 内容不变。
- [x] 4.3 审查 design Mermaid 流程与最终 Compose、部署命令一致，并确认 `docs/deployment/` 是 Adminer、OpenObserve 纳管和网络安全前置条件的唯一文档所有者。

## 5. 验证

- [x] 5.1 使用纯占位环境执行只读部署 preflight Compose 配置验证，确认默认 profile 不包含 Adminer、Adminer profile 发布预期端口、schema migration 能够解析、OpenObserve 使用固定 volume name 且没有宿主端口；不得读取真实 dotenv 或启动任何容器。
- [x] 5.2 运行 `pnpm secrets:scan`，确认 Compose、dotenv example、部署文档和 OpenSpec 工件不包含 secret、真实白名单或环境特定连接信息。
- [x] 5.3 运行 `openspec validate simplify-compose-operations --type change --strict --no-interactive` 和适用的文档/仓库检查；普通 `pnpm verify` 不得启动 Docker Compose。
- [x] 5.4 复核 Database Change Audit，确认实施没有修改 PostgreSQL schema、Drizzle migration、seed、数据或字段语义，也没有对真实数据库或 OpenObserve 数据运行 migration、Adminer 或启动验证。
- [x] 5.5 为 Adminer 增加镜像内置 `curl` HTTP healthcheck，为 distroless OpenObserve 增加 `/openobserve node status` healthcheck，并同步设计与规格。
- [x] 5.6 只读渲染 Compose 并重新运行 OpenSpec strict validation、secret scan 和文档/仓库门禁；不得启动容器。
