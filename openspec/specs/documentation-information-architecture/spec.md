# documentation-information-architecture Specification

## Purpose

定义长期文档分类、内容质量、根治理文件和应用 README 的职责边界，确保稳定知识具有单一权威来源，协作者能够按任务定位内容，并避免文档与源码、生成契约或配置重复。

## Requirements

### Requirement: 项目文档必须任务导向并适度使用图形

项目文档 SHALL 以读者任务为中心；图形 MUST 用于解释结构、流程、状态或关系，不得作为装饰或重复正文。

#### Scenario: 文档使用图形

- **WHEN** 文档包含 Mermaid 图
- **THEN** 图形前 MUST 说明需要理解的问题
- **AND** 图形后 MUST 只保留必要边界或结论

### Requirement: docs 目录必须简化和合并

`docs/` SHALL 是长期文档和公开部署示例资产的统一根目录，并 MUST 只使用 `arch/`、`biz/`、`deployment/` 三个职责分类。

#### Scenario: 选择文档位置

- **WHEN** 内容描述架构、业务知识或部署示例
- **THEN** 内容 MUST 分别进入 `docs/arch/`、`docs/biz/` 或 `docs/deployment/`
- **AND** 项目 MUST NOT 保留并列的 `wiki/`、顶层 `api/` 或顶层 `deployment/` 文档域

#### Scenario: 文档目录不建立索引

- **WHEN** 贡献者新增或重组文档
- **THEN** 项目 MUST NOT 创建 `docs/README.md`、`docs/index.md` 或子目录 README/index
- **AND** 根 README MUST 只提供少量必要入口，不得复制完整文档树

### Requirement: 文档内容必须简洁且具有单一权威来源

长期文档 SHALL 只描述当前、稳定且跨局部实现仍有阅读价值的行为、边界和知识，不得镜像源码、测试、生成契约、schema、package scripts 或配置。

#### Scenario: 审计现有内容

- **WHEN** 维护者整理文档
- **THEN** 内容 MUST 被判定为保留、压缩、合并或删除
- **AND** 一次性过程、进度、评级、重复规则和过时说明 MUST 被删除

#### Scenario: 业务知识存在不确定性

- **WHEN** `docs/biz/` 的声明无法由源码、legacy 参考、已接受规格或维护者确认支持
- **THEN** 内容 MUST 标记为 `To Confirm` 或不予写入
- **AND** Agent MUST NOT 将推断写成事实

#### Scenario: 文档使用示例值

- **WHEN** 文档或配置需要示例数据
- **THEN** 示例 MUST 使用 `example.com`、`${ENV_VAR}`、`<secret>` 或等价明显占位值
- **AND** 内容 MUST NOT 包含真实凭据、私有主机、数据库 URL 或用户数据

### Requirement: 仓库根目录必须保持简约

根目录 SHALL 只保留开源入口、治理文件和工具自动发现所需文件；长期文档与部署示例资产 MUST 位于 `docs/`。

#### Scenario: 根治理文件去重

- **WHEN** 维护者整理根文件
- **THEN** README MUST 只承担项目介绍和快速入口，CONTRIBUTING MUST 只承担贡献流程，SECURITY MUST 只承担安全报告与必要规则
- **AND** 文件之间 MUST NOT 复制长篇规范

### Requirement: AGENTS 必须保持执行型简洁

`AGENTS.md` SHALL 只保留 Agent 始终需要的项目事实、硬边界、命令、Skill 加载映射和最低验证要求；专项方法 MUST 下沉到项目级 Skills。

#### Scenario: Agent 读取 AGENTS

- **WHEN** Agent 开始项目任务
- **THEN** `AGENTS.md` MUST 明确 PostgreSQL-only、legacy 边界、secret 安全、OpenSpec 和项目 Skill 触发条件
- **AND** 文件 MUST NOT 复制完整专项操作手册

### Requirement: 仓库治理文档必须齐备

仓库 SHALL 提供简洁的项目治理文件和应用级 README，使协作者无需文档索引即可找到贡献、安全报告和应用开发方式。

#### Scenario: 开发者进入应用目录

- **WHEN** 开发者查看 `apps/api` 或 `apps/web`
- **THEN** 对应目录 MUST 提供职责、关键目录、命令和应用特有边界
- **AND** 应用 README MUST NOT 重复根 README 或架构文档

#### Scenario: 安全问题报告

- **WHEN** 外部用户需要报告安全问题
- **THEN** 根 `SECURITY.md` MUST 提供私密报告方式
- **AND** 文档 MUST 禁止在公共 Issue 粘贴凭据或用户隐私数据
