## 1. 部署入口与资产

- [x] 1.1 将版本化 Compose 资产统一为 `deployment/docker-compose.yml`，更新当前引用并确认应用服务不包含 `build:`
- [x] 1.2 将 `deployment/README.md` 精简为镜像、reviewed migration、启动、验证和回滚的唯一任务入口
- [x] 1.3 删除重复审计模板，并确保 dotenv 示例仅包含分组占位配置

## 2. 文档职责收敛

- [x] 2.1 将数据库开发和 migration 规则收敛到 `docs/database.md`
- [x] 2.2 将已完成迁移的长期背景收敛到 `wiki/migration-background.md`，删除重复 migration runbook
- [x] 2.3 更新根 README 及相关文档导航，检查设计图中的路径与最终文件一致

## 3. 规格与历史材料清理

- [x] 3.1 更新相关主 specs，使当前约束使用统一 Compose 路径和通用部署表述
- [x] 3.2 清理 archived changes 中的环境特定路径、连接方式、拓扑、凭据位置和单次运行结果，同时保留可复用决策
- [x] 3.3 搜索并移除旧 Compose 文件名及失效文档链接，确认 change 可归档

## 4. 验证

- [x] 4.1 使用占位镜像和 dotenv 示例运行 `docker compose config --quiet`
- [x] 4.2 运行 OpenSpec strict validation 和 archive secret scan
- [x] 4.3 运行 `git diff --check` 并复核最终差异不包含环境特定信息
