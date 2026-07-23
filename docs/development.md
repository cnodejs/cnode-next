# Development

本文档描述本地开发环境的搭建和调试。

## 前置条件

- Node.js >= 22.0.0
- pnpm >= 11.0.0

## 快速开始

```bash
# 安装依赖
pnpm install

# 初始化本地 SQLite 数据库
pnpm db:push
pnpm db:seed

# 启动开发服务
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

## 零外部依赖

本地开发不需要 PostgreSQL / Redis / Cloudflare:

- SQLite 文件在 `.local/dev.db`
- Redis 本地可选 (或用内存 Map 替代)
- 邮件本地不发送 (console.log)
- KV 通过 wrangler.jsonc 的 local bindings 模拟

## 数据库

### 切换 dialect

本地默认用 SQLite,通过环境变量切换:

```bash
# SQLite (默认)
DB_DIALECT=sqlite

# PostgreSQL
DB_DIALECT=pg DB_HOST=localhost DB_PORT=5432 DB_NAME=cnode DB_USER=cnode DB_PASSWORD=xxx
```

### 常用命令

```bash
pnpm db:push        # 创建/更新本地 SQLite 表
pnpm db:push:pg     # 创建/更新 PostgreSQL 表
pnpm db:seed        # 灌入测试数据
pnpm db:generate    # 生成 migration 文件
```

## 调试

- Web: Vite dev server,支持 HMR
- API: `tsx watch` 模式,文件变更自动重启
- 日志: API 使用 console,Web 使用浏览器 DevTools
