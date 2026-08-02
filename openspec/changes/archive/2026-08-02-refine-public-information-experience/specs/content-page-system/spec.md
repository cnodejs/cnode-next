## MODIFIED Requirements

### Requirement: 共享内容页布局

静态内容页 SHALL 使用共享布局，包括 hero、结构化内容 sections，以及适用时的 related navigation 或 TOC。社区介绍和指引内容 SHALL 只在 `/about` 中提供，API 文档 SHALL 继续使用独立 `/api` 页面。

#### Scenario: 内容页有设计结构

- **WHEN** `/about` 或 API 文档页渲染
- **THEN** 页面包含 hero、正文 sections 和辅助导航或 CTA
- **AND** 它不是单行占位文本
- **AND** `/about` 不依赖 `/help`、`/faq` 或 `/getstart` 才能完整表达社区信息。

### Requirement: About 页面表达社区身份

About 页面 SHALL 说明 CNode 身份、社区目的和价值观，并 SHALL 在同一页面提供参与指南、讨论与内容规范、常见问题和参与社区的入口。

#### Scenario: About 页面表达品牌与参与方式

- **WHEN** `/about` 渲染
- **THEN** 页面说明中文 Node.js 社区的目的与价值观
- **AND** 页面按清晰顺序展示社区介绍、参与指南、讨论与内容规范和常见问题
- **AND** 页面提供“发布话题”与参与指南页内入口。

#### Scenario: About 页内定位

- **WHEN** 用户访问 `/about#guide`、`/about#discussion` 或 `/about#faq`
- **THEN** 页面定位到对应的参与指南、讨论规范或常见问题区块
- **AND** 移动端和桌面端均保持内容可读且目标不被固定 Header 遮挡。

## REMOVED Requirements

### Requirement: Getstart 新用户引导

**Reason**: 独立 `/getstart` 内容较少，与 `/about` 的参与指南和讨论规范重复。

**Migration**: 将账号、分类、提问、Markdown 和礼仪内容重新组织到 `/about#guide` 与 `/about#discussion`；不保留 `/getstart` 路由或重定向。

### Requirement: FAQ 分组问答

**Reason**: 独立 `/faq` 页面访问频率低，内容适合作为 `/about` 的常见问题区块统一呈现。

**Migration**: 将问题分组迁移到 `/about#faq`；不保留 `/faq` 路由或重定向。
