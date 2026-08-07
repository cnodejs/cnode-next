## MODIFIED Requirements

### Requirement: docs 目录必须简化和合并

`docs/` SHALL 是长期项目文档和公开部署示例资产的统一根目录，并 MUST 只使用 `arch/`、`biz/`、`deployment/` 三个职责分类；项目 MUST NOT 保留并列的 `wiki/`、顶层 `api/` 或顶层 `deployment/` 文档域。

#### Scenario: 贡献者选择文档位置

- **WHEN** 内容描述跨模块架构、业务知识或部署示例
- **THEN** 内容 MUST 分别位于 `docs/arch/`、`docs/biz/` 或 `docs/deployment/`
- **AND** 当前开发、贡献、安全或应用使用说明 MUST 分别进入根治理文件或 `apps/*/README.md`，不得创建无明确分类的 `docs/*.md`

#### Scenario: 文档目录不建立索引

- **WHEN** 贡献者新增或重组 `docs/` 内容
- **THEN** 项目 MUST NOT 创建 `docs/README.md`、`docs/index.md` 或子目录中的 README/index 文档
- **AND** 根 README MUST 只保留必要的直接入口，不得复制完整文档树

#### Scenario: 旧文档域完成迁移

- **WHEN** 新文档结构生效
- **THEN** `wiki/`、顶层 `api/` 与顶层 `deployment/` MUST 被移除
- **AND** 当前源码、配置、主规格、README、CI 和脚本 MUST 使用新路径

### Requirement: 仓库根目录必须保持简约

仓库根目录 SHALL 只保留开源项目入口、治理文件和工具自动发现所必需的文件；长期文档与部署示例资产 MUST 收敛到 `docs/` 的明确分类。

#### Scenario: 根目录文件复核

- **WHEN** 读者查看仓库根目录
- **THEN** 根目录 MUST 提供 `README.md`、`AGENTS.md`、`CODE_OF_CONDUCT.md`、`CONTRIBUTING.md`、`SECURITY.md` 和 `LICENSE`
- **AND** 根目录 MUST NOT 放置独立 OpenAPI 文档、生产 Compose、部署模板或文档知识库目录

#### Scenario: 根治理文件去重

- **WHEN** 维护者整理根治理文件
- **THEN** README MUST 只承担项目介绍和快速入口，CONTRIBUTING MUST 只承担贡献流程，SECURITY MUST 只承担安全报告与必要安全规则
- **AND** 这些文件 MUST NOT 相互复制长篇研发或 Agent 操作规范

### Requirement: AGENTS 必须保持执行型简洁

`AGENTS.md` SHALL 只保留协作 Agent 始终需要执行的项目事实、硬边界、命令、Skill 加载映射和最低验证要求；详细专项操作规范 MUST 下沉到项目级 Skills。

#### Scenario: Agent 读取 AGENTS

- **WHEN** Agent 开始在项目中工作
- **THEN** `AGENTS.md` MUST 明确技术栈、PostgreSQL-only、legacy `../nodeclub/` 只读参考、secret 安全、OpenSpec 工作流和项目 Skill 触发条件
- **AND** `AGENTS.md` MUST NOT 复制长篇架构、部署、API 或设计系统操作手册

### Requirement: 仓库治理文档必须齐备

仓库 SHALL 提供简洁的项目治理文件和应用级 README，使外部协作者能够找到参与、安全报告以及各应用开发方式，而无需文档索引页。

#### Scenario: 外部协作者查看贡献说明

- **WHEN** 外部协作者准备提交 Issue、PR 或本地验证
- **THEN** `CONTRIBUTING.md` MUST 说明贡献流程、OpenSpec 使用条件、验证要求和安全占位规则
- **AND** 详细 Agent 规范 MUST NOT 放入贡献文档

#### Scenario: 开发者进入应用目录

- **WHEN** 开发者查看 `apps/api` 或 `apps/web`
- **THEN** 对应目录 MUST 提供简洁 README，说明职责、关键目录、开发命令和应用特有边界
- **AND** README MUST NOT 重复根 README 或架构文档的完整内容

#### Scenario: 安全问题报告

- **WHEN** 外部用户需要报告安全问题
- **THEN** 根 `SECURITY.md` MUST 提供清晰的私密报告方式
- **AND** 文档 MUST 提醒不得在公共 Issue 中粘贴 secret、token、数据库 URL 或用户隐私数据

## ADDED Requirements

### Requirement: 文档内容必须简洁且具有单一权威来源

长期文档 SHALL 只描述当前、稳定且跨源码局部实现仍有阅读价值的行为、边界和知识；文档 MUST NOT 镜像可由源码、测试、生成契约、schema、package scripts 或配置直接获得的细节。

#### Scenario: 迁移现有文档

- **WHEN** 维护者迁移现有文档
- **THEN** 每份内容 MUST 被判定为保留、压缩、合并或删除
- **AND** 一次性实现过程、内部评级、变更日志、任务进度、重复规则和过时说明 MUST 被删除而非原样搬迁

#### Scenario: 多处描述同一规则

- **WHEN** 同一规则出现在多个长期文档
- **THEN** 项目 MUST 选择一个权威位置并删除重复说明
- **AND** 其他文档 MAY 使用短链接引用权威来源

#### Scenario: 业务或历史知识存在不确定性

- **WHEN** `docs/biz/` 内容无法由当前源码、legacy `../nodeclub/`、已接受规格或维护者确认支持
- **THEN** 文档 MUST 将该内容标记为 `To Confirm` 或不予写入
- **AND** Agent MUST NOT 将推断写成已确认事实

#### Scenario: 文档使用示例数据

- **WHEN** 文档、配置或命令需要示例值
- **THEN** 示例 MUST 使用 `example.com`、`${ENV_VAR}`、`<secret>` 或等价明显占位值
- **AND** 内容 MUST NOT 包含真实 secret、生产主机、数据库 URL、用户数据或环境特定连接信息

## REMOVED Requirements

### Requirement: wiki 知识库必须有独立写作规范

**Reason**: 业务与兼容知识统一迁入 `docs/biz/`，写作规范由 `AGENTS.md` 的硬边界和 `cnode-docs` Skill 共同承担，不再维护独立 `wiki/` 域。

**Migration**: 将有价值的业务规则、社区规则、legacy 行为和迁移背景压缩迁入 `docs/biz/`；删除 `wiki/README.md` 与 `wiki/writing-guidelines.md`。

### Requirement: 部署信息必须提供唯一长期入口

**Reason**: 顶层 `deployment/README.md` 被无索引页的 `docs/deployment/deployment.md` 取代，旧 requirement 固化了已废弃的目录和入口形式。

**Migration**: 按 `production-deployment-governance` 的新要求迁移 runbook、Compose、示例配置和辅助脚本，并更新全部当前引用。
