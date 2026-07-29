## 1. OpenSpec 规则更新

- [x] 1.1 更新 `openspec/config.yaml` 的 proposal 规则，要求包含改造范围、Non-goals、Documentation Impact 和高风险类别判断。
- [x] 1.2 更新 `openspec/config.yaml` 的 design 规则，要求跨边界、数据、状态、权限和迁移类 change 提供 Mermaid 图或矩阵说明。
- [x] 1.3 更新 `openspec/config.yaml` 的 design 规则，要求数据库相关 change 包含 `Database Change Audit`。
- [x] 1.4 更新 `openspec/config.yaml` 的 tasks 规则，要求包含 docs/wiki 同步、图形一致性、数据库审计验证和归档前检查任务。

## 2. 治理文档

- [x] 2.1 新增 `docs/openspec-governance.md`，说明 change scope contract、Documentation Impact、图形选择指南、Database Change Audit 和归档检查清单。
- [x] 2.2 在 `docs/openspec-governance.md` 中提供 proposal 的范围和文档影响模板。
- [x] 2.3 在 `docs/openspec-governance.md` 中提供 `Database Change Audit` 模板，覆盖影响范围、兼容性、迁移计划、回滚计划、性能/锁表风险、数据完整性和验证证据。
- [x] 2.4 在 `docs/openspec-governance.md` 中明确 `docs/` 与 `wiki/` 的同步边界，避免把实现日志写入长期文档。

## 3. 贡献和文档约定同步

- [x] 3.1 更新 `docs/conventions.md` 的 OpenSpec And Design Process，链接 `docs/openspec-governance.md` 并概述范围、文档影响、图形和数据库审计要求。
- [x] 3.2 更新 `docs/conventions.md` 的 Pull Requests 或 Documentation Domains，明确涉及当前行为、数据库、安全、API、迁移和业务规则时应同步的 `docs/` / `wiki/` 页面。
- [x] 3.3 更新 `CONTRIBUTING.md` 的 Workflow，说明数据库、迁移、数据修复、安全/权限、API 和架构变更必须走 OpenSpec。
- [x] 3.4 更新 `CONTRIBUTING.md` 的 PR Notes，要求数据库相关 PR 包含数据库审计摘要或指向 OpenSpec design 的审计段落。

## 4. 活跃 Change 示例校准

- [x] 4.1 检查活跃 change 列表，确认 `add-user-roles-and-restricted-jobs` 已归档，不再编辑已归档 artifact 作为活跃示例。
- [x] 4.2 检查活跃 change 列表，确认 `web-loading-and-state` 已归档，不再编辑已归档 artifact 作为活跃示例。
- [x] 4.3 保留 `docs/openspec-governance.md` 中的模板作为后续活跃 change 示例来源，避免改写已归档历史。
- [x] 4.4 通过 `openspec list --json` 确认当前仅剩本治理 change 处于 active 状态。

## 5. 验证

- [x] 5.1 运行 `openspec validate strengthen-openspec-change-governance --strict`。
- [x] 5.2 运行 `openspec list --json`，确认 `add-user-roles-and-restricted-jobs` 和 `web-loading-and-state` 已归档且不再作为活跃示例校验对象。
- [x] 5.3 检查新增和更新文档中的 Mermaid 代码块可读，且没有与 `docs/conventions.md` 的文档分域冲突。
- [x] 5.4 检查 OpenSpec artifacts 使用简体中文表达，仓库文档保持既有英文风格，技术路径和命令保留英文原文。
- [x] 5.5 确认本变更没有修改应用运行时代码、数据库 migration、API 契约或 Web 页面行为。
