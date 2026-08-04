## ADDED Requirements

### Requirement: 长期运维约束不得依赖单次运行记录
项目 SHALL 以可重复验证的镜像、migration、健康检查和回滚约束描述生产运维，不得将单次发布观察或环境拓扑作为长期规范。

#### Scenario: 验证部署资产
- **WHEN** 维护者审查 `deployment/docker-compose.yml`
- **THEN** API、Web 和 worker MUST 引用可追溯的已发布镜像
- **AND** 这些服务 MUST NOT 定义本地镜像构建

#### Scenario: 验证发布结果
- **WHEN** 新版本完成启动
- **THEN** 维护者 MUST 验证 API health 和本次发布适用的 smoke 检查
- **AND** 验证说明 MUST 使用变量或通用端点，不得固化环境特定地址或运行结果

#### Scenario: 记录历史决策
- **WHEN** archived change 需要保留生产运维决策
- **THEN** 记录 MUST 仅保留可复用的约束、取舍和验收标准
- **AND** 记录 MUST 删除环境特定路径、连接方式、拓扑、凭据位置和单次运行数据
