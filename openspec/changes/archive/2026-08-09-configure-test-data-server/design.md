## Context

仓库生产 Compose 基线使用 `postgres:18-bookworm` 与 `redis:7-bookworm`，但测试活动尚无独立的持久化数据服务。目标主机已有 Docker 和 Compose，资源足以承载小规模测试数据服务及 Adminer 管理工具；该主机不得参与 CNode 应用发布。

操作者选择由其自行配置来源 IP 白名单和云安全组。本变更负责服务认证与端口发布，但不保存主机地址、来源地址或凭据。

## Goals / Non-Goals

**Goals:**

- 提供版本与仓库基线一致、可健康检查、重启后自动恢复的 PostgreSQL 和 Redis。
- 将配置、凭据和持久数据保留在目标主机，并限制凭据文件为 root 可读。
- 允许测试客户端在外部网络访问标准端口，同时保持强制认证。
- 提供只通过内部网络连接 PostgreSQL 的 Adminer Web 管理入口，且不向 Adminer 注入数据库凭据。
- 可验证目标主机没有运行 CNode 业务应用容器。

**Non-Goals:**

- 部署 API、Web、worker 或迁移任务。
- 配置来源 IP 白名单、主机防火墙规则或云安全组。
- 导入生产数据或变更 PostgreSQL schema。
- 提供高可用、自动备份或生产灾难恢复能力。

## Decisions

### 使用官方服务容器

使用 `postgres:18-bookworm` 和 `redis:7-bookworm`，以匹配 `docs/deployment/docker-compose.yml` 的运行时大版本，并用独立 Compose 项目管理。

测试主机的 Compose SHALL 直接从生产基线中的 `postgres`、`redis`、对应 volumes 和 `cnode-internal` network 定义收敛而来。测试环境只增加远程测试所需的端口发布和 Redis 密码认证；固定 Compose 项目名以避免配置目录变更时创建新命名卷。不得保留独立容器名或测试主机专属 PostgreSQL 参数调优。

替代方案是通过 Alibaba Cloud Linux 软件源原生安装。该方案会引入额外软件源、版本偏差和主机级升级耦合，因此不采用。另一替代方案是维护完全独立的测试 Compose，但会扩大与生产基线的配置差异，也不采用。服务容器仅承载数据基础设施，不违反禁止部署 CNode 应用镜像的边界。

### 使用命名卷与自动重启

PostgreSQL 和 Redis 分别使用独立命名卷，Redis 开启 AOF，两项服务使用 `unless-stopped` 和健康检查。

替代方案是 bind mount。其目录所有权和 SELinux 标签更易产生主机差异，且没有额外的可移植性收益，因此不采用。

### 凭据只在服务端生成和保存

在目标主机生成独立随机 PostgreSQL 与 Redis 密码，保存在权限为 `0600` 的 root 所有 dotenv 文件。Compose 配置仅引用变量，命令输出和仓库文件均不包含值。PostgreSQL 使用 SCRAM 密码认证；Redis 启用 `requirepass`。

替代方案是复用现有环境凭据或将凭据写入仓库，两者都会扩大泄露和环境串用风险，因此不采用。

### 发布标准端口但不管理网络白名单

容器发布 `5432`、`6379` 和 Adminer 的 `8080`，由操作者在云安全组及需要时的主机防火墙中限制来源地址。服务认证是第二道边界，不能替代来源限制。

替代方案是仅绑定 loopback 并使用 SSH 隧道，安全性更高，但与操作者选择的指定来源 IP 访问模式不符，因此不采用。

### Adminer 仅作为测试管理工具

使用 `adminer:5-standalone` 官方镜像，通过 `ADMINER_DEFAULT_SERVER=postgres` 默认选择内部 PostgreSQL 服务，并等待 PostgreSQL healthy 后启动。Adminer 不接收 PostgreSQL 用户名或密码，操作者每次使用数据库凭据登录；服务配置 HTTP 健康检查、`unless-stopped` 和 `cnode-internal` 网络。

替代方案是将 Adminer 加入生产 Compose 基线，但生产环境不需要公网数据库管理入口，因此不采用。另一替代方案是注入数据库凭据以自动登录，但会扩大凭据暴露范围，因此不采用。

### 只清理已确认空闲的临时 schema

数据库清理仅允许处理名称已列入本次操作白名单的 `pg_temp_<backend-id>` 与对应 `pg_toast_temp_<backend-id>`。执行前必须确认每个 schema 的对象数为 0，且 `pg_stat_get_backend_pid(<backend-id>)` 返回 null；删除语句不得使用 `CASCADE`。`pg_catalog`、`information_schema`、`public`、`pg_toast`、Drizzle 管理对象和应用表均不在清理范围。

替代方案是删除所有 `pg_temp_*` schema 或重建数据库。前者可能影响活动会话，后者会扩大数据丢失范围，因此均不采用。

### 生产快照只恢复到测试数据库

操作者提供的 PostgreSQL custom dump 必须先被 Git 忽略，再通过 SSH 加密传输到测试服务器约定的备份目录。恢复前验证 dump 格式、目标 PostgreSQL 健康状态和目标库现状；恢复使用目标容器内与服务器同大版本的 `pg_restore`，启用 `--no-owner`、`--no-privileges`、`--exit-on-error` 和 `--single-transaction`，且不使用 `--create`，确保目标始终是 `.env` 指定的测试数据库。

恢复前为当前测试库创建独立回滚 dump。生产 dump 和回滚 dump 仅保存在本地忽略路径或测试服务器备份目录，不进入 Git，不打印对象内容或用户行。恢复完成后验证服务健康、业务表存在和数据库可查询，但不输出用户数据。

替代方案是从开发机通过公网数据库连接直接恢复。该方案会使生产数据流量脱离 SSH 传输边界，因此不采用。另一替代方案是恢复到生产数据库，违反测试隔离边界，因此禁止。

## Risks / Trade-offs

- [端口在白名单完成前可被网络探测] -> 强制随机凭据，不在任何输出中暴露密码；操作者必须配置安全组后再使用。
- [主机仅有约 2 GiB 内存] -> 只运行两个数据服务，不运行应用容器，并采用适合测试负载的 PostgreSQL 内存上限。
- [单机或命名卷损坏会丢失测试数据] -> 明确该环境不承载生产数据；重要测试数据另行导出。
- [浮动大版本标签可能引入小版本更新] -> 当前与仓库基线保持一致；后续可在统一维护时改为镜像 digest。
- [Redis 远程管理命令扩大破坏面] -> 使用独立测试实例和认证，不存放生产或不可重建数据。
- [Adminer 公网入口可能遭受扫描和口令尝试] -> 不注入凭据，由操作者将 `8080` 严格限制到指定来源 IP，并只使用测试数据库凭据。
- [临时 schema 清理误伤活动会话或对象] -> 执行前同时校验名称白名单、对象数和 backend 状态，在事务中执行且禁止 `CASCADE`。
- [真实生产数据进入测试环境会扩大隐私暴露范围] -> 备份文件始终被 Git 忽略，只经 SSH 传输；数据库和 Adminer 端口继续使用来源 IP 白名单，验证过程不输出用户行。
- [恢复失败留下部分 schema] -> 使用 `--exit-on-error --single-transaction`，并在恢复前创建测试库回滚 dump。

## Migration Plan

1. 确认标准端口无占用、Docker 可用且主机未运行同名服务。
2. 在 root 所有的服务目录写入 Compose 配置与随机凭据文件。
3. 拉取官方 PostgreSQL、Redis 和 Adminer 镜像并启动独立 Compose 项目。
4. 在容器内部执行健康检查，并确认端口发布、命名卷和重启策略。
5. 确认该 Compose 项目只包含两个数据服务与 Adminer，且主机未部署 CNode 应用容器。

回滚时停止并删除该 Compose 项目的容器；默认保留命名卷以防误删测试数据。只有在明确确认数据不再需要后，才单独删除命名卷和服务端凭据。

## Database Change Audit

本变更创建测试 PostgreSQL 实例，删除已确认无活动 backend、对象数为 0 的遗留临时 schema，并将操作者提供的生产 custom dump 恢复到测试数据库。恢复会在测试库中创建 dump 包含的 schema、表、索引、约束和数据，但不修改仓库 Drizzle schema 或迁移文件，不写入生产数据库，也不生成新迁移。

## Open Questions

- 来源 IP 白名单和阿里云安全组由操作者在本变更外完成。
- 测试数据备份周期尚未定义；当前环境中的数据按可重建测试数据处理。
