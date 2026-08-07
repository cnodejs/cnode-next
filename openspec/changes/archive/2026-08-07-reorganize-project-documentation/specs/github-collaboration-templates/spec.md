## ADDED Requirements

### Requirement: Issue 模板必须只收集最小问题上下文

项目 SHALL 提供简洁的 Bug 与 Feature Issue 表单，不要求提交者理解内部目录、OpenSpec 流程或可由维护者和代码差异判断的影响分类。

#### Scenario: 用户报告 Bug

- **WHEN** 用户选择 Bug report
- **THEN** 表单 MUST 只要求问题描述和最小复现
- **AND** 表单 MAY 提供一个可选的 Additional context 字段用于环境、截图和脱敏日志
- **AND** 表单 MUST NOT 要求选择内部 affected area

#### Scenario: 用户提出 Feature

- **WHEN** 用户选择 Feature request
- **THEN** 表单 MUST 只要求待解决问题和期望方案
- **AND** 表单 MUST NOT 要求 OpenSpec 意愿确认、内部影响分类或独立的备选方案字段

#### Scenario: 用户报告安全问题

- **WHEN** 用户查看 Issue 入口
- **THEN** 配置 MUST 提供 GitHub private security advisory 链接
- **AND** 公共 Issue 模板 MUST NOT 引导用户粘贴 secret、token、数据库 URL 或用户隐私数据

### Requirement: PR 模板必须只收集变更特有信息

PR 模板 SHALL 只收集 Summary、Verification 和可选 Notes，避免重复 CI、贡献规范或代码差异已经能够表达的信息。

#### Scenario: 贡献者创建 PR

- **WHEN** 贡献者打开 PR 模板
- **THEN** 模板 MUST 要求说明变更内容与原因以及实际执行的验证
- **AND** 模板 MUST 提供可选 Notes 用于 OpenSpec、migration、deployment、compatibility 或 security 特殊影响
- **AND** 模板 MUST NOT 包含按目录划分的影响清单、互斥 OpenSpec 复选框或 secret handling 复选框

#### Scenario: 工作流与模板整理

- **WHEN** `.github/` 模板被精简
- **THEN** CI 与镜像 workflow MUST 保持原有职责
- **AND** workflow 仅在引用已迁移路径时进行必要同步
