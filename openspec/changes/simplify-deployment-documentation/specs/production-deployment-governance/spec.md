## ADDED Requirements

### Requirement: 版本化部署资产必须保持通用

仓库中的部署资产 SHALL 使用稳定的相对路径和占位配置，不得记录环境特定路径、连接方式、基础设施拓扑、凭据位置或运行数据。

#### Scenario: 引用 Compose 编排

- **WHEN** 文档、规格或脚本引用版本化 Compose 编排
- **THEN** 引用 MUST 使用 `deployment/docker-compose.yml`
- **AND** 旧文件名 MUST 不再作为当前推荐命令出现

#### Scenario: 编写部署说明

- **WHEN** 维护者更新 `deployment/README.md` 或部署模板
- **THEN** 内容 MUST 使用仓库相对路径、变量和占位值
- **AND** 内容 MUST NOT 包含仅适用于某个运行环境的信息

#### Scenario: 保留长期安全约束

- **WHEN** 精简或整理部署文档
- **THEN** 文档 MUST 保留 reviewed migration、备份、健康检查和回滚约束
- **AND** 文档 MUST NOT 通过复制一次性检查表扩展日常入口
