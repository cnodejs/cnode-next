## 1. MVP 配置

- [x] 1.1 在生产 Compose 和 dotenv example 中将 OpenObserve 默认 retention 配置为 30 天
- [x] 1.2 增加部署配置测试，验证 retention 变量和默认值

## 2. 完整说明与验证

- [x] 2.1 更新权威部署说明，记录全局适用范围、异步清理和不可恢复边界
- [x] 2.2 运行 targeted test、secret scan、Compose 只读渲染和 OpenSpec strict validation
- [x] 2.3 核对文档 owner、过期路径、安全示例和 PostgreSQL 无变更审计
- [x] 2.4 在生产环境应用 30 天 retention，重建 OpenObserve 并验证健康状态
