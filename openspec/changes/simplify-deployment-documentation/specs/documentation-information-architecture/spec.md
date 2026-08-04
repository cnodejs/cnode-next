## ADDED Requirements

### Requirement: 部署信息必须提供唯一长期入口
仓库 SHALL 使用 `deployment/README.md` 作为唯一的日常部署入口，并按文档生命周期分离数据库开发规则、历史迁移背景和 archived change 记录。

#### Scenario: 维护者查找日常部署步骤
- **WHEN** 维护者从根 README 或 `deployment/` 查找部署说明
- **THEN** 文档 MUST 引导到 `deployment/README.md`
- **AND** 该入口 MUST 只保留镜像更新、可选 reviewed migration、启动、验证和回滚步骤

#### Scenario: 维护者查找数据库与迁移知识
- **WHEN** 维护者查找数据库开发规则或已完成迁移的背景
- **THEN** 数据库开发规则 MUST 位于 `docs/database.md`
- **AND** 已完成迁移的背景 MUST 位于 `wiki/`，不得作为日常部署步骤重复维护

#### Scenario: 历史材料包含短期执行信息
- **WHEN** archived change 中存在环境特定路径、连接方式、拓扑或单次运行结果
- **THEN** 当前树中的对应内容 MUST 被删除或改写为可复用的通用工程约束
- **AND** 清理 MUST NOT 要求重写 Git 历史
