## REMOVED Requirements

### Requirement: /help 单页合并指引内容

**Reason**: `/help` 与 `/about`、`/getstart`、`/faq` 形成重复聚合层，增加导航和内容维护成本。

**Migration**: 社区介绍、参与指南、讨论规范和常见问题统一迁移到 `/about`；`/api` 继续保持独立页面；删除 `/help` 且不重定向。

### Requirement: 原有路由保留软合并

**Reason**: 本项目不再承担低频 legacy 静态页面的 URL 兼容，保留重复页面与当前信息架构目标冲突。

**Migration**: 只保留 `/about` 与 `/api`；删除 `/getstart`、`/faq` 和 `/help`，访问旧路径进入标准 not-found 行为。

### Requirement: /help 页内导航锚点

**Reason**: `/help` 页面被移除。

**Migration**: 使用 `/about#guide`、`/about#discussion` 和 `/about#faq` 访问对应区块。

### Requirement: /help 页移动端适配

**Reason**: `/help` 页面被移除，移动端无需维护独立折叠模型。

**Migration**: `/about` 按内容页响应式要求展示合并后的 sections。
