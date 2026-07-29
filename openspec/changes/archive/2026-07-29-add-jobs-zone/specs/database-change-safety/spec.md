# database-change-safety Specification

## Purpose

定义本变更涉及数据库 schema、生产必需配置、seed 脚本的安全边界，防止远程 rehearsal/production 数据被误清空或被未经 review 的 push 直接修改。

## ADDED Requirements

### Requirement: 远程数据库只通过 Drizzle migration 发布

远程 rehearsal/production 数据库的 schema 变更 SHALL 通过已生成、已 review 的 Drizzle migration 文件执行。`drizzle-kit push` SHALL 仅用于本地临时开发库快速验证，不得作为远程发布路径。

#### Scenario: 远程发布 schema 变更

- **WHEN** 需要在远程 rehearsal 或 production 应用 `job_meta` / `tabs` / `zones` schema 变更
- **THEN** 执行 Drizzle migration 文件
- **AND** 不执行 `pnpm db:push:pg` 直接修改远程库 schema

#### Scenario: 本地快速验证 schema

- **WHEN** 开发者使用本地临时数据库验证 schema
- **THEN** 可以使用 `pnpm db:push:pg`
- **AND** 该数据库不得是共享、rehearsal 或 production 数据库

### Requirement: 生产必需配置随 migration/bootstrap 幂等初始化

`tabs` 与 `zones` 的默认行属于生产必需配置，SHALL 通过 Drizzle migration 或受控 bootstrap 脚本幂等初始化，不依赖 `pnpm db:seed`。

#### Scenario: 初始化 tabs 与 zones

- **WHEN** migration/bootstrap 初始化配置数据
- **THEN** 使用唯一键 `tabs.key` 与 `zones.slug` 做幂等插入或 upsert
- **AND** 重复执行不得创建重复行
- **AND** 重复执行不得删除业务表数据
- **AND** 重复执行不得覆盖管理员已调整的 `visible` 值，除非 migration 明确声明这是有意的数据变更

### Requirement: seed 仅用于空库初始化和本地开发

`pnpm db:seed` SHALL 仅用于空库初始化或本地开发测试数据补齐。seed 脚本 MUST be non-destructive，不得清空或重置核心业务表。

#### Scenario: 已有业务数据时运行 seed

- **WHEN** 目标库中 `users` 表已有任意用户
- **THEN** seed 跳过 demo 用户、demo topic、demo reply 创建
- **AND** 不删除 `users` / `topics` / `replies` / `messages` / `topic_collects` / `job_meta` 任意数据
- **AND** 仅幂等补齐默认敏感词与配置行

#### Scenario: 空库初始化时运行 seed

- **WHEN** 目标库中 `users` 表为空
- **THEN** seed 可以创建本地开发所需 demo 用户、demo topic、demo reply
- **AND** seed 仍不得执行 `DELETE`、`TRUNCATE` 或 drop table 操作

### Requirement: 远程数据库变更前必须预检和备份

对远程 rehearsal/production 执行 migration/bootstrap 前，操作者 SHALL 确认目标数据库身份并确保存在可恢复备份。

#### Scenario: 执行远程 migration/bootstrap 前

- **WHEN** 准备连接远程 PostgreSQL 执行数据库变更
- **THEN** 先记录 `current_database()`、`current_user`、server host/port
- **AND** 记录核心表 row counts：`users`、`topics`、`replies`、`messages`、`topic_collects`
- **AND** 确认可恢复备份存在
- **AND** 不在未确认目标库和备份的情况下执行 migration/bootstrap/seed
