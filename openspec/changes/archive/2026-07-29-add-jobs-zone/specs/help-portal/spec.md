# help-portal Specification

## Purpose

定义指引内容合并能力：将分散的 `/getstart` / `/about` / `/faq` / `/api` 四个页面合并为统一指引入口 `/help`，减少导航碎片化。原有路由保留以避免外链 404，但导航栏不再直接暴露。

## ADDED Requirements

### Requirement: /help 单页合并指引内容

系统 SHALL 新增 `/help` 路由，合并 `/getstart` / `/about` / `/faq` 的指引内容为单页。`/api` 因含 SwaggerUI 组件体量大，SHALL 在 `/help` 页面提供链接而非内嵌。

#### Scenario: 访问 /help 单页

- **WHEN** 用户访问 `/help`
- **THEN** 页面渲染合并后的内容，包含入门指南、关于社区、FAQ 三个区块
- **AND** 每个区块通过锚点定位（`#getstart` / `#about` / `#faq`）
- **AND** 页面提供"API 文档"链接指向 `/api`

#### Scenario: 导航栏指向 /help

- **WHEN** 导航栏渲染指引入口
- **THEN** 入口链接指向 `/help`
- **AND** 不再单独暴露"入门"/"关于"/"FAQ"链接

### Requirement: 原有路由保留软合并

`/getstart` / `/about` / `/faq` / `/api` 原有路由 SHALL 保留可访问，避免外链和书签 404。

#### Scenario: 直接访问原有路由

- **WHEN** 用户直接访问 `/getstart`
- **THEN** 页面正常渲染原有内容
- **AND** 不发生重定向或 404

#### Scenario: /api 保留独立路由

- **WHEN** 用户访问 `/api`
- **THEN** 页面渲染 SwaggerUI 文档（与现状一致）
- **AND** 不被内嵌到 `/help` 单页

### Requirement: /help 页内导航锚点

`/help` 页 SHALL 提供页内锚点导航，支持快速跳转到入门/关于/FAQ/API 文档区块。

#### Scenario: 锚点导航跳转

- **WHEN** 用户在 `/help` 页点击"FAQ"锚点链接
- **THEN** 页面滚动到 FAQ 区块
- **AND** URL 更新为 `/help#faq`

#### Scenario: 直接访问锚点 URL

- **WHEN** 用户直接访问 `/help#faq`
- **THEN** 页面加载后滚动到 FAQ 区块

### Requirement: /help 页移动端适配

`/help` 页 SHALL 在移动端以可折叠的区块展示内容，避免长文难以扫读。

#### Scenario: 移动端区块折叠

- **WHEN** viewport 为移动端宽度
- **THEN** 入门/关于/FAQ 区块以可折叠的 disclosure 展示
- **AND** 默认展开入门区块
- **AND** 其他区块默认折叠
