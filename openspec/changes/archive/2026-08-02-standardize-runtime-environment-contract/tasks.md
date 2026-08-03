## 1. MVP：集中配置契约

- [x] 1.1 在可复用的 workspace 模块中定义纯函数 PostgreSQL typed parser，支持 `POSTGRES_HOST`、`POSTGRES_PORT`、`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`，统一必填校验和 `5432` 默认端口。
- [x] 1.2 定义 Redis typed parser，支持 `REDIS_HOST`、`REDIS_PORT`、`REDIS_DB`、`REDIS_PASSWORD`，统一 `6379`、`0` 默认值和整数范围校验。
- [x] 1.3 为 parser 添加仅使用合成 env map 的单元测试，覆盖成功、默认值、缺失值、无效数字、拒绝旧变量和错误信息不泄漏 secret；测试不得加载真实 `.env*`。
- [x] 1.4 将应用自有配置从 `APP_*` 一次性替换为对应的 `CNODE_*`，同步 API、Web、Dockerfile、测试和 tracked 模板且不提供 fallback。

## 2. MVP：PostgreSQL 硬切换

- [x] 2.1 将 `packages/db/src/client.ts`、migration、seed 和 Drizzle config 切换到集中 PostgreSQL parser 与结构化连接参数，移除手工 connection URL 和分散默认值。
- [x] 2.2 将 MongoDB 到 PostgreSQL migration、reconcile 和 deployment preflight 脚本切换到 `POSTGRES_*`，删除脚本内重复的 required/config 构造逻辑。
- [x] 2.3 删除重复或不再需要的 PostgreSQL Drizzle 配置入口，并验证所有根目录 `db:*` 命令解析同一份 tracked fixture 契约而不连接真实数据库。
- [x] 2.4 更新相关测试中的敏感配置 canary，确保 `DB_*` 与 `DATABASE_URL` 不再被表达为受支持的运行时入口，同时保留健康响应不得泄漏 secret 的断言。

## 3. MVP：Redis 硬切换

- [x] 3.1 将 API 与 worker 的真实 Redis client 切换到集中 Redis parser，并保持 `REDIS_DB` 作为 database index 配置。
- [x] 3.2 将测试使用的 Redis mock/fake 选择改为显式测试边界，确保生产配置缺失或部分提供时快速失败而不是静默回退。
- [x] 3.3 添加 Redis consumer 测试，验证标准 `REDIS_*` 变量生效、默认值一致且错误不包含 password。

## 4. Feature-complete：部署与模板

- [x] 4.1 更新 `deployment/docker-compose.prod.yml`，通过 `env_file` 直接注入应用、PostgreSQL 与 Redis 配置，删除重复 environment 映射。
- [x] 4.2 更新 `.env.example` 和 `deployment/.env.production.example` 为新命名契约，只使用非敏感占位值；不得读取或参考 `.env`、`.env.local`、`.env.remote.local` 的内容。
- [x] 4.3 静态核对 production example 与 Compose `env_file` 契约，并通过 typed parser 测试确认缺少必填基础设施变量时快速失败；实际 Compose 验证留给远程部署流程。

## 5. Feature-complete：文档与规范同步

- [x] 5.1 更新 `docs/development.md` 的应用、PostgreSQL、Redis 和启动示例，分别使用 `CNODE_*`、`POSTGRES_*` 与 `REDIS_*` 契约。
- [x] 5.2 更新 migration runbook、隧道和 rehearsal 文档，使用 `POSTGRES_HOST`、`POSTGRES_PORT` 与显式 `CNODE_ENV_FILE`，并保留不得公开数据库端口的要求。
- [x] 5.3 检查 `docs/`、活跃 OpenSpec 和 tracked 示例中的命名一致性；archive 历史记录保持不变，仓库外 wiki 更新记录为后续人工事项。

## 6. 验证与发布准备

- [x] 6.1 在排除 `openspec/changes/archive/` 和显式拒绝旧契约的单元测试后扫描 shipped source、tracked templates、docs 与活跃 specs，确认不存在 `APP_*`、`DB_*`、运行时 `DATABASE_URL` 或自创基础设施变量，也不存在 alias 或 fallback。
- [x] 6.2 运行 lint、typecheck、test、build、OpenSpec strict validate 和 secret scan；不得在本地运行 Docker Compose，且验证过程不得 source、读取、打印或修改真实 `.env`、`.env.local`、`.env.remote.local`。
- [x] 6.3 审核 git diff，确认没有 PostgreSQL schema、migration、seed 数据语义、数据库内容或数据卷变更，并确认 design Mermaid、spec delta 和 tasks 与一次性硬切换决策一致。
- [x] 6.4 编写人工部署检查清单，要求 `CNODE_*`、`POSTGRES_*`、`REDIS_*` 配置与新镜像/Compose 在同一维护窗口原子切换，回滚时整套恢复旧版本；不得在实施阶段连接或写入远程数据库。
