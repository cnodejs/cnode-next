## ADDED Requirements

### Requirement: 共享内容页布局

静态内容页 SHALL 使用共享布局，包括 hero、结构化内容 sections，以及适用时的 related navigation 或 TOC。

#### Scenario: 内容页有设计结构

- **WHEN** `/about`、`/faq`、`/getstart` 或 API 文档页渲染
- **THEN** 页面包含 hero、正文 sections 和辅助导航或 CTA
- **AND** 它不是单行占位文本。

### Requirement: About 页面表达社区身份

About 页面 SHALL 说明 CNode 身份、社区目的、价值观、项目信息和参与链接。

#### Scenario: About 页面表达品牌

- **WHEN** `/about` 渲染
- **THEN** 它说明中文 Node.js 社区的目的，并包含参与或了解更多的链接。

### Requirement: Getstart 新用户引导

Getstart 页面 SHALL 引导首次访问用户完成账号创建、浏览分类、提问、分享内容、Markdown 使用和社区礼仪理解。

#### Scenario: 新用户指南

- **WHEN** `/getstart` 渲染
- **THEN** 它以有序或分组方式展示加入和参与社区的指南。

### Requirement: FAQ 分组问答

FAQ 页面 SHALL 按主题分组问题，并提供易扫读答案。

#### Scenario: FAQ 分组

- **WHEN** `/faq` 渲染
- **THEN** 问题按账号、发帖、Markdown、通知和社区规则等类别分组。

### Requirement: API 文档页

API 页面 SHALL 展示开发者文档，包括认证说明、endpoint 分组、示例和错误/rate-limit 说明。

#### Scenario: API endpoint 文档

- **WHEN** API 页面渲染
- **THEN** 它包含 endpoint cards 或 sections，展示 method、path、用途和 request/response 示例。

### Requirement: 内容页响应式行为

内容页导航、TOC 和 related sections SHALL 在移动端适配且不产生横向溢出。

#### Scenario: 移动端内容页

- **WHEN** 内容页在移动端渲染
- **THEN** hero、sections、code blocks 和 TOC/related navigation 保持可读且无布局溢出。
