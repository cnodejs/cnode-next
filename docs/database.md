# Database

本文档描述数据库 schema、migration 流程和 SQLite/pg 双 dialect 注意事项。

## ORM: Drizzle

使用 Drizzle ORM,一份 schema 定义,支持 SQLite 和 PostgreSQL 双 dialect。

- 本地开发: better-sqlite3 (SQLite)
- 生产: PostgreSQL (docker-compose 部署)
- 通过 `DB_DIALECT` 环境变量切换

## Schema

详细 schema 定义见 `packages/db/src/schema/` 和 `openspec/changes/rewrite-to-cnode-next/design.md` 的数据模型章节。

### 表结构概览

| 表             | 说明                                                       |
| -------------- | ---------------------------------------------------------- |
| users          | 用户                                                       |
| topics         | 话题 (status: draft/published/muted/deleted)               |
| replies        | 回复                                                       |
| reply_ups      | 回复点赞 (reply_id + user_id 联表, 从 Mongo 的 ups[] 拆出) |
| messages       | 消息通知 (type: reply/reply2/at)                           |
| topic_collects | 话题收藏 (user_id + topic_id 唯一)                         |

## Migration

```bash
pnpm db:generate    # 生成 migration 文件
pnpm db:push        # 推送到本地 SQLite
pnpm db:push:pg     # 推送到 PostgreSQL
```

Migration 文件分 SQLite 和 PostgreSQL 两套,放在 `packages/db/migrations/` 下。

## SQLite vs PostgreSQL 差异

| 特性     | SQLite                    | PostgreSQL         |
| -------- | ------------------------- | ------------------ |
| BOOLEAN  | INTEGER (0/1)             | BOOLEAN            |
| DATETIME | TEXT (ISO 8601)           | TIMESTAMP          |
| 自增 ID  | INTEGER PRIMARY KEY       | SERIAL / GENERATED |
| 外键     | 需 PRAGMA foreign_keys=ON | 默认开启           |
| 并发     | 写锁全库级别              | 行级锁             |

Drizzle 在 ORM 层面抹平大部分差异。本地开发单人够用,并发测试在 CI 上用 PostgreSQL 跑。
