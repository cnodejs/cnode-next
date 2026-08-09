## 1. MVP 服务部署

- [x] 1.1 检查目标主机 Docker 状态、端口占用、现有容器和可用资源，确认不覆盖现有服务
- [x] 1.2 创建 root 所有的服务目录和 `0600` dotenv 文件，并在服务端生成 PostgreSQL 与 Redis 独立随机密码
- [x] 1.3 创建仅包含 PostgreSQL 18 与 Redis 7 的 Compose 配置，启用命名卷、Redis AOF、认证健康检查和自动重启
- [x] 1.4 拉取官方服务镜像并启动 Compose 项目，不部署任何 CNode 应用镜像

## 2. 完整验证

- [x] 2.1 验证 PostgreSQL 与 Redis 均为 healthy、认证连接成功且未认证操作失败
- [x] 2.2 验证 `5432` 与 `6379` 已发布、持久卷和重启策略生效，并提醒操作者完成来源 IP 白名单
- [x] 2.3 验证目标主机未运行 CNode 应用容器，仓库与命令输出不包含凭据、主机地址或完整连接 URL
- [x] 2.4 运行 OpenSpec strict validation、文档安全检查、数据库变更审计确认和归档就绪检查

## 3. 生产基线对齐

- [x] 3.1 以 `docs/deployment/docker-compose.yml` 的 PostgreSQL、Redis、volumes 和内部网络为基线收敛测试服务器 Compose，仅保留测试端口与认证差异
- [x] 3.2 重建数据服务并验证健康状态、外部认证读写、命名卷复用及无应用容器
- [x] 3.3 重新运行 OpenSpec strict validation 和秘密扫描，确认变更可归档

## 4. Adminer 管理入口

- [x] 4.1 在测试服务器 Compose 中加入 Adminer 5，仅连接内部网络并发布 `8080`，不注入数据库凭据
- [x] 4.2 启动 Adminer 并验证健康状态、登录页面、内部 PostgreSQL 默认目标及现有数据服务不受影响
- [x] 4.3 验证外部 `8080` 访问边界，重新运行 OpenSpec strict validation 和秘密扫描

## 5. 空闲临时 Schema 清理

- [x] 5.1 盘点测试数据库非标准 schema，确认清理白名单中的临时 schema 对象数为 0 且无活动 backend
- [x] 5.2 在事务中按白名单删除空闲 `pg_temp_*` 与对应 `pg_toast_temp_*` schema，不使用 `CASCADE`
- [x] 5.3 复查非系统表与 schema，运行 OpenSpec strict validation 和秘密扫描

## 6. 生产快照恢复

- [x] 6.1 确认生产 dump 为 Git 忽略的 PostgreSQL custom format，并检查测试 PostgreSQL healthy、目标库和远端备份目录
- [x] 6.2 创建当前测试库回滚 dump，通过 SSH 上传生产 dump，并用目标容器内 `pg_restore` 单事务恢复到测试库
- [x] 6.3 验证恢复后的业务表、迁移状态、数据库连接及 PostgreSQL、Redis、Adminer 健康状态，不输出用户数据
- [x] 6.4 运行 OpenSpec strict validation、秘密扫描和归档就绪检查
