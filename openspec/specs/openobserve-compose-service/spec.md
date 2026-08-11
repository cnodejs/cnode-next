# openobserve-compose-service Specification

## Purpose

定义生产 Compose 中 OpenObserve 的长期运行、内部访问、健康检查、持久化、凭据和镜像漂移审计要求。

## Requirements

### Requirement: OpenObserve 必须纳入生产 Compose 基线

生产 Compose SHALL 定义长期运行的 `openobserve` 服务，使用 `public.ecr.aws/zinclabs/openobserve:latest`、共享生产 dotenv、`cnode-internal` 网络和 `restart: unless-stopped`。

#### Scenario: 渲染生产 Compose
- **WHEN** 运维使用安全占位环境渲染 `docs/deployment/docker-compose.yml`
- **THEN** 配置 MUST 包含使用 `public.ecr.aws/zinclabs/openobserve:latest` 的 `openobserve` 服务
- **AND** 服务 MUST 从 `${CNODE_ENV_FILE:-.env}` 读取环境
- **AND** 服务 MUST 仅加入 `cnode-internal` 网络
- **AND** 服务 MUST 使用 `restart: unless-stopped`

#### Scenario: 普通仓库验证
- **WHEN** 维护者验证本次 Compose 和文档变更
- **THEN** 验证 MUST NOT 启动、重建或接管生产 OpenObserve 容器
- **AND** 验证 MUST NOT 读取或输出真实生产 dotenv 值

### Requirement: OpenObserve 必须提供 Compose 内部入口

OpenObserve SHALL 通过 `cnode-internal` 中的服务 DNS `openobserve` 提供默认 HTTP 入口 `http://openobserve:5080`，但本 change 不得为其发布宿主端口或配置 telemetry 发送方。

#### Scenario: 内部服务访问 OpenObserve
- **WHEN** 后续 Compose 内部服务需要连接 OpenObserve
- **THEN** 它 MUST 能使用 `http://openobserve:5080` 作为内部基址
- **AND** 该连接 MUST NOT 要求发布 OpenObserve 宿主端口

#### Scenario: 当前 change 渲染 Compose
- **WHEN** 运维渲染本 change 的 OpenObserve 服务
- **THEN** 配置 MUST NOT 包含 OpenTelemetry Collector、应用 instrumentation 或日志发送配置

### Requirement: OpenObserve 必须提供容器内健康检查

OpenObserve SHALL 使用发布镜像自带的 CLI 检查本机节点状态，不得假定 distroless 镜像包含 shell、`curl` 或 `wget`，也不得为健康检查发布宿主端口。

#### Scenario: Docker 检查 OpenObserve 健康状态
- **WHEN** OpenObserve 容器运行 Docker healthcheck
- **THEN** 检查 MUST 直接执行 `/openobserve node status`
- **AND** 检查 MUST 提供覆盖服务初始化的启动宽限期
- **AND** 检查 MUST NOT 依赖宿主端口或镜像外部工具

### Requirement: OpenObserve 数据必须使用持久卷

OpenObserve SHALL 将 `/data` 挂载到 Compose 声明的 `openobserve-data` volume，容器重建不得隐式改用临时 writable layer。

#### Scenario: 检查服务挂载
- **WHEN** 运维渲染 OpenObserve 服务配置
- **THEN** `openobserve-data` MUST 挂载到容器 `/data`
- **AND** Compose MUST 声明顶层 `openobserve-data` volume

#### Scenario: 纳管既有生产实例
- **WHEN** 生产服务器已有运行中的 OpenObserve
- **THEN** 运维 MUST 在首次通过本 Compose 启动前核对既有 container、image、mount、volume 和 Compose project 身份
- **AND** 未确认既有数据卷映射时 MUST NOT 启动第二个 OpenObserve 实例

### Requirement: OpenObserve root 凭据必须由外部 dotenv 提供

部署 dotenv example SHALL 在 Observability 分组声明空的 `ZO_ROOT_USER_EMAIL` 和 `ZO_ROOT_USER_PASSWORD`，真实值 MUST 只存在于忽略或外部 dotenv 文件中。

#### Scenario: 维护 dotenv example
- **WHEN** 维护者查看 `docs/deployment/env.production.example`
- **THEN** 模板 MUST 包含 `ZO_ROOT_USER_EMAIL=` 和 `ZO_ROOT_USER_PASSWORD=`
- **AND** 模板 MUST NOT 包含真实邮箱、密码或生产连接信息

#### Scenario: 生产环境提供 root 凭据
- **WHEN** 运维准备由 Compose 管理 OpenObserve
- **THEN** 选定的外部 `CNODE_ENV_FILE` MUST 提供环境所需的真实 root 凭据
- **AND** preflight、日志和部署记录 MUST NOT 打印这些值

### Requirement: OpenObserve 镜像漂移必须可审计

由于服务使用 `latest`，生产部署 SHALL 在拉取或替换 OpenObserve 前记录实际 image ID 或 digest，并确认数据兼容性与恢复点。

#### Scenario: 拉取新的 latest 镜像
- **WHEN** 运维准备拉取或重新创建 OpenObserve
- **THEN** 运维 MUST 记录变更前后的实际 image ID 或 digest
- **AND** 运维 MUST 在替换前确认上游版本兼容性和 `openobserve-data` 的可恢复备份

### Requirement: OpenObserve 观测数据必须默认保留 30 天

生产 Compose SHALL 将 OpenObserve 的全局数据保留期显式配置为 30 天，使 logs、metrics 和 traces 中超过该期限的数据由 OpenObserve compactor 异步清理。部署 MUST NOT 通过直接删除 `openobserve-data` 文件实现 retention。

#### Scenario: 渲染默认生产配置

- **WHEN** 运维使用安全占位环境渲染 `docs/deployment/docker-compose.yml`
- **THEN** `openobserve` service MUST 获得 `ZO_COMPACT_DATA_RETENTION_DAYS=30`
- **AND** `docs/deployment/env.production.example` MUST 声明同一 30 天值

#### Scenario: 30 天前数据进入清理流程

- **WHEN** OpenObserve compactor 在 retention 配置生效后处理超过 30 天的观测数据
- **THEN** 这些数据 MUST 由 OpenObserve 支持的 retention 机制异步清理
- **AND** 部署流程 MUST NOT 假定重建容器后磁盘空间立即释放

#### Scenario: 回滚 retention 配置

- **WHEN** 运维恢复先前的 retention 值并重建 OpenObserve
- **THEN** 新配置 MUST 只影响后续 compactor 行为
- **AND** 运维 MUST NOT 声称配置回滚能够恢复已经删除的数据
