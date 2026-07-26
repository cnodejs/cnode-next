## 1. PostgreSQL-first 环境契约

- [x] 1.1 在开发文档中明确 PostgreSQL-first 是当前默认开发与迁移验证路径
- [x] 1.2 从文档中移除 sqlite-first 默认开发承诺，说明 SQLite 仅为历史兼容/非验收路径
- [x] 1.3 更新 `.env.example`，让 PostgreSQL/Redis 配置成为明确的运行契约，敏感本地覆盖放入 ignored `.env.local`

## 2. 本地运行方式

- [x] 2.1 文档化研发通过 PostgreSQL/Redis 连接地址运行项目
- [x] 2.2 说明本地 docker-compose 与 SSH 隧道只是连接地址来源不同
- [x] 2.3 验证 `.env.local` 已被 git ignore，且 API 能读取 `.env.local` 覆盖配置

## 3. 迁移后项目可运行验证

- [x] 3.1 使用 PostgreSQL 配置启动本地 API
- [x] 3.2 使用本地 API 启动 Web，并确认首页可读取 PostgreSQL 话题列表
- [x] 3.3 验证核心只读路径：首页、话题详情、用户页

## 4. Future Work 边界

- [x] 4.1 在文档中明确 CI、Codespaces、branch protection、release gate 不属于当前变更
- [x] 4.2 记录后续可单独提案实现 CI/Codespaces 能力
