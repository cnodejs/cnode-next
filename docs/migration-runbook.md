# Mongo to PostgreSQL Migration Runbook

本文档定义 cnode 到 cnode-next 的迁移、彩排、对账和切换操作。生产切换前 MongoDB 始终是唯一真相源；新站并行期写入均视为可覆盖测试数据。

## 目标边界

- 迁移源库只读：`MONGO_URI` 必须使用只读 Mongo 账号。
- 迁移目标隔离：彩排目标必须是本地或预发布 PostgreSQL，不得是生产目标库。
- 数据库不得公网暴露：远程源库通过 SSH 隧道或内网跳板访问。
- 所有 PostgreSQL 建表、迁移、对账命令通过 compose 网络执行。

## Compose 命令

生产/预发布编排文件为 `docker-compose.prod.yml`，包含 `api`、`postgres`、`redis`，以及一次性任务 `migrate-schema`、`migrate-data`、`reconcile`。

```bash
docker compose -f docker-compose.prod.yml up -d postgres redis
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate-schema
docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate-data
docker compose -f docker-compose.prod.yml --profile migrate run --rm reconcile
docker compose -f docker-compose.prod.yml up -d api
```

服务名连通验证：

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

建表验证：

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select tablename from pg_tables where schemaname = 'public' order by tablename;"
```

## 本地连接远程彩排

默认采用 SSH 隧道，不开放 Mongo/Redis 公网端口：

```bash
ssh -N \
  -L 37017:127.0.0.1:27017 \
  -L 36379:127.0.0.1:6379 \
  QCloud_US_CNODE
```

本地 `.env` 使用演练目标库，并设置：

```bash
MONGO_URI=mongodb://<mongo-host>:37017/<legacy-db-name>
MONGO_DB=<legacy-db-name>
DB_DIALECT=pg
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cnode_rehearsal
DB_USER=cnode
DB_PASSWORD=<rehearsal-password>
POSTGRES_DB=cnode_rehearsal
POSTGRES_USER=cnode
POSTGRES_PASSWORD=<rehearsal-password>
```

只读账号验证：

```bash
mongosh "$MONGO_URI" --eval "db.users.findOne()"
mongosh "$MONGO_URI" --eval "db.users.insertOne({loginname:'write_probe_should_fail'})"
```

第二条命令必须失败。若成功，立即废弃该账号并重新配置只读权限。

完整彩排：

```bash
time docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate-schema
time docker compose -f docker-compose.prod.yml --profile migrate run --rm migrate-data
time docker compose -f docker-compose.prod.yml --profile migrate run --rm reconcile
docker compose -f docker-compose.prod.yml up -d api
```

如果在远程服务器 `/root/workspace/cnode-next` 上执行迁移任务，新 compose 的 `migrate-data` 和 `reconcile` 会加入旧站 compose 的外部网络 `cnode`。此时可使用：

```bash
MONGO_URI=mongodb://mongo:27017/${MONGO_DB}
MONGO_DB=<legacy-db-name>
LEGACY_DOCKER_NETWORK=cnode
```

真实 Mongo 库名只写入远程 `.env`，不要提交到仓库文档。迁移前必须以运行中旧站容器为准确认真实 Mongo 连接配置，并将库名填入 `.env` 的 `MONGO_DB`：

```bash
docker exec cnode-cnode-1 node -e "console.log(require('./config').db)"
```

不要假设同一 Mongo 实例中的默认库名就是线上库。迁移前需要用旧站运行配置和线上 API 抽样数据共同确认源库正确。

当前远程旧 Mongo 若未启用认证，不能通过“创建只读账号”单独实现权限收敛；启用认证需要修改并重启旧 Mongo，属于生产变更。彩排阶段优先使用只读迁移脚本、目标库隔离和命令审查控制风险，或改用 `mongodump` 快照离线迁移。

每次彩排记录：迁移耗时、对账 JSON、烟测结果、失败样本。连续两次全量重跑的核心计数与抽样结果必须一致。

最近一次远程彩排结果：连续两次全量迁移均通过对账；第二轮迁移耗时约 9 分 14 秒，对账耗时约 3.5 秒。首页前 8 条标题、置顶状态与最后回复时间抽样结果与线上 API 一致。

## 对账闸门

`scripts/reconcile-migration.ts` 会检查：

- `users`
- `topics`
- `replies`
- `messages`
- `reply_ups`，对应 Mongo `replies.ups[]` 总数

任一检查失败时命令返回非零退出码，切流不得继续。

## 烟测路径

- Auth：老用户密码 hash 抽样登录成功，登录态可读取 `/api/v1/auth/me`。
- Topic read：首页列表、话题详情、作者信息可打开。
- Topic write：内测账号可发帖，计数与详情页可见。
- Reply：内测账号可回复，话题最后回复时间更新。
- Message：回复、reply2、@ 提及消息在消息中心可见并可标记已读。

## 切换日分钟级手册

T-30：确认最近两次彩排通过，迁移耗时低于停机窗口。

T-20：公告旧站即将进入维护模式。

T-10：冻结旧站写入，确认 Mongo 不再产生新写入。

T+00：执行 `migrate-schema`。

T+05：执行最终 `migrate-data`。

T+20：执行 `reconcile`，失败则保持停机并排障后重跑。

T+25：执行烟测路径。

T+30：对账与烟测均通过后切流到 cnode-next。

T+40：确认访问、登录、发帖、回复、消息正常，关闭旧站。

## 并行期内测说明

并行验证期间，cnode-next 只供内部测试。所有在新站产生的测试写入会在下一次全量迁移中被 Mongo 权威数据覆盖，不进入最终生产数据。
