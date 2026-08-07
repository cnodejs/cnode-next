# project-agent-skills Specification

## Purpose

定义项目级 Agent Skills 与 `AGENTS.md` 的职责分层，使文档治理和 Web 设计任务获得专项、可执行且可验证的操作规范，同时让全局 Agent 指引聚焦始终适用的项目硬边界、触发条件和最低验证要求。

## Requirements

### Requirement: 项目级 Skills 必须承载专项执行规范

项目 SHALL 为文档治理和 Web 设计提供项目级 Skills，使 Agent 在专项任务中获得详细、可执行的步骤，而无需把全部操作细则常驻于 `AGENTS.md`。

#### Scenario: Agent 执行文档任务

- **WHEN** Agent 创建、编辑、移动、审查或删除文档、根治理文件、应用 README、OpenAPI 输出、部署示例或 GitHub 协作模板
- **THEN** Agent MUST 在编辑前加载项目级 `cnode-docs` Skill
- **AND** Skill MUST 说明目录分类、权威来源、内容精简、去重、安全占位和验证方法

#### Scenario: Agent 执行 Web 设计任务

- **WHEN** Agent 修改 Web layout、route composition、component、theme、responsive behavior、Markdown presentation 或 design-system source
- **THEN** Agent MUST 在编辑前加载项目级 `cnode-web-design` Skill
- **AND** Skill MUST 说明 CNode 组件基线、semantic theme、页面原型、响应式规则和验证方法

### Requirement: AGENTS 与 Skills 必须形成明确分层

`AGENTS.md` SHALL 保留始终生效的项目硬边界、常用命令、Skill 触发映射和最低验证要求；项目级 Skills SHALL 承载任务相关的详细流程和检查清单。

#### Scenario: Agent 开始项目任务

- **WHEN** Agent 读取 `AGENTS.md`
- **THEN** 文件 MUST 明确 PostgreSQL-only、legacy 外部目录边界、secret 安全、OpenSpec 使用条件和项目 Skill 加载条件
- **AND** 文件 MUST NOT 复制 Skills 中的完整执行手册

#### Scenario: 规范可被机器验证

- **WHEN** 某项规范具有稳定、低误报且可机器判断的条件
- **THEN** 项目 SHOULD 使用 lint、test、build 或 contract check 验证该条件
- **AND** Skill MUST NOT 以固定句子文本检查替代内容审查
