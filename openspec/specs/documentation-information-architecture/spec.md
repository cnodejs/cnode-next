# documentation-information-architecture Specification

## Purpose

Define the public documentation information architecture for README, docs, wiki, deploy assets, and repository governance files.

## Requirements

### Requirement: 项目文档必须任务导向并适度使用图形

项目文档 SHALL 以读者任务为中心组织内容；当文档包含图形时，图形 MUST 用于解释结构、流程、状态或关系，并遵循“描述 → 图形 → 简约说明”的块结构。

#### Scenario: 读者查看 README

- **WHEN** 读者打开 `README.md`
- **THEN** README MUST 以简短项目介绍、核心能力、技术栈、快速开始、文档入口、贡献、安全和许可证为主
- **AND** README MUST NOT 以“重写版本”、legacy 迁移、生产上线验收或大量 Mermaid 图作为主要内容

#### Scenario: 读者查看包含图形的文档

- **WHEN** 文档包含 Mermaid 图、架构图、流程图、时序图或关系图
- **THEN** 图形前 MUST 有 1-2 句描述说明图形要解决的读者问题
- **AND** 图形后 MUST 使用表格或短列表给出必要说明
- **AND** 图形后说明 MUST 保持简约，不得重复图形已经表达的内容

#### Scenario: 读者查看架构文档

- **WHEN** 读者打开架构文档
- **THEN** 文档 MUST 使用图形说明系统拓扑、请求流或数据边界
- **AND** 每张图后只保留必要边界、约束和跳转链接

### Requirement: docs 目录必须简化和合并

`docs/` SHALL 按读者任务保留少数稳定入口，并提供项目文档规范和开发规范；`docs/`、`wiki/` 与 `deploy/` SHALL 作为同级内容域分别承接项目任务文档、知识沉淀和生产部署域，避免 `docs/` 变成历史材料或部署资产仓库。

#### Scenario: 文档规范入口

- **WHEN** 贡献者需要新增或修改文档
- **THEN** `docs/` MUST 提供 `docs/conventions.md` 或等价规范入口
- **AND** 该规范 MUST 覆盖文档结构、图形使用、表格优先、API 文档格式、`docs/`/`wiki/`/`deploy/` 目录边界、开发规范和 secret handling 链接

#### Scenario: 文档主题重复

- **WHEN** 两个或多个 `docs/*.md` 描述同一部署、迁移、数据库、安全或开发主题
- **THEN** 它们 MUST 被合并或明确拆分职责
- **AND** 旧入口 MUST 提供跳转、被归档或被删除，避免读者看到冲突说明

#### Scenario: 一次性上线材料

- **WHEN** 文档描述单次发布验收材料、内部评级、部署审计结果或历史验收记录
- **THEN** 该内容 MUST NOT 作为长期主文档入口
- **AND** 它 MUST 被删除、移到归档位置，或只保留在实际运维审计记录中

#### Scenario: 迁移和业务知识沉淀

- **WHEN** 文档描述 legacy `../nodeclub/` 迁移背景、历史兼容原因、社区规则或业务逻辑分析
- **THEN** 该内容 MUST 放入 `wiki/` 或等价知识库目录
- **AND** `docs/` 中只保留完成开发、运行、部署或调用任务所需的简短链接

### Requirement: wiki 知识库必须有独立写作规范

`wiki/` SHALL 作为与 `docs/` 同级的知识库目录，承接迁移背景、业务逻辑和社区知识沉淀，并 MUST 有独立写作规范约束来源、事实边界、推断标记和 AI agent 行为。

#### Scenario: wiki 文档包含来源和范围

- **WHEN** 贡献者或 AI agent 新增 `wiki/` 文档
- **THEN** 文档 MUST 标明信息来源，例如当前代码路径、legacy `../nodeclub/` 路径、线上行为观察、OpenSpec archive 或人工确认
- **AND** 文档 MUST 标明适用范围和最后复核时间或复核状态

#### Scenario: wiki 区分事实和推断

- **WHEN** `wiki/` 文档包含从代码、历史行为或讨论中推导出的结论
- **THEN** 文档 MUST 区分已确认事实、合理推断和待确认问题
- **AND** AI agent MUST NOT 将未验证推断写成确定事实

#### Scenario: wiki 避免无依据扩写

- **WHEN** AI agent 缺少源码、legacy 路径、线上观察或用户确认作为依据
- **THEN** AI agent MUST 将内容标记为待确认或不写入 wiki
- **AND** 文档 MUST NOT 使用空泛、不可验证或营销式描述替代可追溯事实

#### Scenario: wiki 与 docs 互相引用

- **WHEN** `docs/` 需要引用迁移背景或业务逻辑知识
- **THEN** `docs/` MUST 链接到 `wiki/` 对应页面
- **AND** `docs/` MUST NOT 复制 wiki 中的长篇历史背景

#### Scenario: wiki 与 docs 同级边界

- **WHEN** 贡献者判断内容应放入 `docs/` 还是 `wiki/`
- **THEN** 任务导向内容 MUST 放入 `docs/`
- **AND** 历史、迁移、业务逻辑、社区规则和长期知识沉淀 MUST 放入 `wiki/`

#### Scenario: deploy 与 docs/wiki 同级边界

- **WHEN** 贡献者判断内容应放入 `docs/`、`wiki/` 还是 `deploy/`
- **THEN** 可执行或可同步的部署资产 MUST 放入 `deploy/`
- **AND** 生产部署 runbook SHOULD 放入 `deploy/` 并链接 `deploy/` 中的实际资产
- **AND** 历史部署背景或运维知识沉淀 SHOULD 放入 `wiki/`

#### Scenario: 文档索引更新

- **WHEN** 文档结构调整完成
- **THEN** README MUST 列出新的文档入口
- **AND** 每个入口 MUST 用一句话说明适用读者和用途

### Requirement: 仓库根目录必须保持简约

仓库根目录 SHALL 只保留开源项目入口和工具自动发现所必需的文件；部署编排、部署模板、SQL、启动脚本和运行环境相关材料 MUST 收敛到 `deploy/` 或等价部署资产目录。

#### Scenario: 根目录文件复核

- **WHEN** 读者查看仓库根目录
- **THEN** 根目录 MUST 主要包含 `README.md`、`LICENSE`、`CONTRIBUTING.md`、`SECURITY.md`、package/workspace 配置、源码目录、`docs/`、`wiki/`、`deploy/` 和 OpenSpec 目录
- **AND** 生产部署实现细节文件 MUST NOT 直接堆放在根目录

#### Scenario: 部署文件组织

- **WHEN** 仓库包含生产 Docker Compose、部署 SQL、启动脚本、部署模板、部署 helper 或部署环境示例
- **THEN** 这些文件 MUST 放在 `deploy/` 或等价部署目录中
- **AND** README、docs、CI 和运维命令 MUST 引用新路径

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
- **AND** 文档 MUST 指向 `pnpm verify`、OpenSpec change 流程、`docs/conventions.md` 和 secret handling 规则

#### Scenario: 外部读者查看许可证

- **WHEN** 外部读者查看仓库根目录
- **THEN** 仓库 MUST 提供 MIT `LICENSE`
- **AND** README MUST 使用确定语气链接许可证，不得使用“license status”这类内部状态描述

#### Scenario: 安全问题报告

- **WHEN** 外部用户需要报告安全问题
- **THEN** 仓库 MUST 提供 `SECURITY.md` 或在安全文档中提供清晰报告方式
- **AND** 文档 MUST 提醒不要在公开 issue 中粘贴 secrets、tokens 或用户隐私数据
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
