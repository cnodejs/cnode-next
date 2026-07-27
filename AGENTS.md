# AGENTS.md

## 项目上下文

cnode-next 是 CNode 社区的重写版本。老代码在 `../nodeclub/` (Express + MongoDB, 线上运行) 和 `egg-cnode/` (Egg.js, 未完成迁移),作为业务逻辑参考。新项目对照它们的逻辑实现。`../nodeclub/` 不属于当前仓库，不参与 lint/test/build。

## 技术栈

- 前端: React Router v7 (SSR), Tailwind CSS v4 + shadcn/ui
- 后端: Hono (@hono/node-server), Node.js
- 数据库: Drizzle ORM, PostgreSQL-first
- 共享: packages/db (schema), packages/shared (types, Zod, 常量)

## 目录约定

| 路径            | 职责                                      |
| --------------- | ----------------------------------------- |
| apps/web        | React Router v7 前端 (SSR, CF Workers)    |
| apps/api        | Hono API server                           |
| packages/db     | Drizzle schema, PostgreSQL-first          |
| packages/shared | API 契约类型, Zod schemas, 常量, 纯函数   |

## 常用命令

```bash
pnpm dev          # 同时启动 web + api
pnpm build        # 构建所有包
pnpm test         # 运行测试
pnpm lint         # ESLint
pnpm typecheck    # TypeScript 类型检查
pnpm db:push:pg   # 创建/更新 PostgreSQL 表
pnpm db:seed      # 灌入测试数据
pnpm migrate:mongo-to-pg  # MongoDB 到 PostgreSQL 全量迁移
pnpm migrate:reconcile    # 迁移后对账
```

## 代码风格约定

- TypeScript strict 模式
- Zod 做请求验证 (前后端共享 schema)
- 纯函数放 packages/shared
- ESM (type: module)
- 无注释,除非业务逻辑不直观

## 迁移参考

| 功能      | 参考文件                                                     |
| --------- | ------------------------------------------------------------ |
| 话题 CRUD | ../nodeclub/controllers/topic.js                                |
| 回复      | ../nodeclub/controllers/reply.js                                |
| 用户      | ../nodeclub/controllers/user.js                                 |
| 认证      | ../nodeclub/controllers/sign.js, ../nodeclub/controllers/github.js |
| 消息      | ../nodeclub/common/message.js                                   |
| @提及     | ../nodeclub/common/at.js                                        |
| 邮件      | ../nodeclub/common/mail.js                                      |
| 限流      | ../nodeclub/middlewares/limit.js                                |
| API 契约  | ../nodeclub/api_router_v1.js, ../nodeclub/api/v1/               |
| 积分规则  | 见 specs/scoring/spec.md (注意 egg-cnode 的 bug)             |

## OpenSpec 工作流

```bash
openspec list                    # 列出变更
openspec show rewrite-to-cnode-next  # 查看当前变更
openspec instructions apply --change rewrite-to-cnode-next  # 实施指引
```
