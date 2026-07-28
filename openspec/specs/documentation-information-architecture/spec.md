# documentation-information-architecture Specification

## Purpose
TBD - created by archiving change reach-production-grade-release-readiness. Update Purpose after archive.
## Requirements
### Requirement: 项目文档必须图优先
项目文档 SHALL 以架构图、信息图、流程图、时序图、类图、脑图或关系图作为主要表达方式，使读者能快速理解项目能力、逻辑处理和关联关系。

#### Scenario: 读者查看 README
- **WHEN** 读者打开 `README.md`
- **THEN** 文档 MUST 用简短说明和图示展示系统能力、主要应用、数据存储、发布链路和关键文档入口
- **AND** README MUST NOT 使用长篇文字重复 `docs/` 中的细节

#### Scenario: 读者查看架构文档
- **WHEN** 读者打开架构文档
- **THEN** 文档 MUST 包含系统架构图、请求流图、数据关系图和部署拓扑图
- **AND** 每张图后只保留必要边界、约束和跳转链接

### Requirement: docs 目录必须简化和合并
`docs/` SHALL 合并相近主题，保留少数稳定入口，避免同一概念在多个文档中重复和漂移。

#### Scenario: 文档主题重复
- **WHEN** 两个或多个 `docs/*.md` 描述同一部署、迁移、数据库或安全主题
- **THEN** 它们 MUST 被合并或明确拆分职责
- **AND** 旧入口 MUST 提供跳转或被删除，避免读者看到冲突说明

#### Scenario: 文档索引更新
- **WHEN** 文档结构调整完成
- **THEN** README MUST 列出新的文档入口
- **AND** 每个入口 MUST 用一句话说明适用读者和用途

### Requirement: AGENTS 必须保持执行型简洁
`AGENTS.md` SHALL 只保留协作代理需要执行的项目事实、命令、目录边界和关键约束。

#### Scenario: 代理读取 AGENTS
- **WHEN** 代理开始在项目中工作
- **THEN** `AGENTS.md` MUST 明确技术栈、PostgreSQL-only、legacy `../nodeclub/` 只读参考、常用命令和 OpenSpec 工作流
- **AND** `AGENTS.md` MUST NOT 复制长篇架构、部署或 API 文档内容

### Requirement: 仓库治理文档必须齐备
仓库 SHALL 提供贡献、许可证和安全入口，使外部协作者知道如何参与、如何使用代码以及如何报告安全问题。

#### Scenario: 外部协作者查看贡献说明
- **WHEN** 外部协作者准备提交 issue、PR 或本地验证
- **THEN** 仓库 MUST 提供 `CONTRIBUTING.md` 或等价贡献文档
- **AND** 文档 MUST 指向 `pnpm verify`、OpenSpec change 流程和 secret handling 规则

#### Scenario: 外部读者查看许可证
- **WHEN** 外部读者查看仓库根目录
- **THEN** 仓库 MUST 提供 `LICENSE` 或明确说明许可证状态的文档
- **AND** 许可证说明 MUST 不与 legacy `../nodeclub/` 参考代码混淆

#### Scenario: 安全问题报告
- **WHEN** 外部用户需要报告安全问题
- **THEN** 仓库 MUST 提供 `SECURITY.md` 或在安全文档中提供清晰报告方式
- **AND** 文档 MUST 提醒不要在公开 issue 中粘贴 secrets、tokens 或用户隐私数据

