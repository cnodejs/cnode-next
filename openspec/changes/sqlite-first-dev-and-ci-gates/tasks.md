## 1. 环境契约与文档

- [ ] 1.1 在文档中明确 sqlite-first 默认开发契约，并声明无 Docker 前置依赖
- [ ] 1.2 定义本地与 Codespaces 通用的 pg/redis 可选环境契约
- [ ] 1.3 增加简明模式选择指南（sqlite 默认 vs pg/redis 可选）与验证命令
- [ ] 1.4 验证：在干净环境按 sqlite-first 文档执行，确认无 Docker 也可跑通核心开发命令

## 2. Codespaces 仅服务型基础设施

- [ ] 2.1 增加 Codespaces/devcontainer 配置，仅提供 PostgreSQL 与 Redis 服务
- [ ] 2.2 确保应用进程仍运行于 workspace 环境，不依赖应用镜像打包
- [ ] 2.3 定义 Codespaces 中 pg/redis 的服务命名与连接约定
- [ ] 2.4 验证：创建 Codespace，确认 workspace 命令可连通 pg/redis 服务

## 3. Pull Request 必过门禁

- [ ] 3.1 增加 sqlite 快速检查 CI 工作流，并设为 PR required gate
- [ ] 3.2 增加 pg/redis 集成检查 CI 工作流，并设为 PR required gate
- [ ] 3.3 配置分支保护，要求以上两个 PR gates 必过
- [ ] 3.4 验证：在测试分支运行两个 PR 工作流，确认任一失败都会阻断合并

## 4. Release 必过门禁

- [ ] 4.1 增加 release full functional 工作流（具备 pg/redis 能力）
- [ ] 4.2 配置发布策略，full functional 失败时阻断发布
- [ ] 4.3 确保 release 工作流输出清晰的通过/失败证据，便于排障
- [ ] 4.4 验证：执行一次 release 演练，确认 full functional 失败会阻止发布完成
