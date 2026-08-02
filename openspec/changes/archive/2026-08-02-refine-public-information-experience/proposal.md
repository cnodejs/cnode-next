## Why

当前主站同时保留 `/about`、`/faq`、`/getstart` 和 `/help` 四个低频静态入口，Header、移动端、CommandPalette 与 Footer 继续重复暴露相同内容；用户详情与话题作者卡又只展示少量公开资料，并将高风险管理操作置于过高视觉层级。需要收束公开信息架构，并让用户资料、社区身份与治理操作各自具有清晰层级。

## What Changes

- **BREAKING** 删除 `/help`、`/faq`、`/getstart` 页面与路由，不提供重定向；将社区介绍、参与指南、讨论规范和常见问题重新组织到 `/about`。
- **BREAKING** 删除 legacy `/:name -> /user/:name` 兼容路由，用户主页只使用 `/user/:name`。该决策明确不再迁移 `../nodeclub/web_router.js` 的用户短路径和独立 FAQ/Getstart URL 行为。
- 将桌面 Header 的“关于”下拉改为 `/about` 一级链接，同步收束移动端导航、CommandPalette、话题详情“参与讨论前”入口和 Footer。
- 重组 Footer：左侧 CTA 使用“发布话题 / 了解社区”；社区分组使用“关于 / 发布话题 / 用户排行 / 精华话题”；资源只保留 API 与 RSS；开发者只保留 GitHub。
- 扩展 `GET /api/v1/user/:loginname` 的 CNode Next 公开资料契约，增加所在地、个人网站、签名和可多选公开身份；保持 `topic.author` 轻量结构不变。
- 用户详情 Hero 展示公开资料、多重身份和真实话题/回复/收藏计数；将屏蔽、禁言、删除所有发言收纳到次级管理菜单，危险操作继续二次确认。
- 话题详情右侧作者卡通过页面级用户资料查询展示公开资料、多重身份和社区统计；不在作者卡内展示最近话题、最近参与或最新回复。
- 管理员、版主、猎头作为互不推导的独立身份展示；管理员来自 `APP_ADMINS`，版主与猎头来自 DB-backed roles。删除已无环境模板或部署配置支持的 `APP_MODERATORS` 遗留判定。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `navigation-shell`: 将关于入口、移动端入口与 CommandPalette 收束到 `/about`。
- `content-page-system`: 将介绍、参与指南、讨论规范和常见问题合并为唯一 `/about` 内容页。
- `help-portal`: 移除 `/help` 聚合页及其旧路由保留要求。
- `footer-system`: 明确 Footer CTA 与社区、资源、开发者分组的精简结构。
- `web-url-parity`: 停止兼容 `/faq`、`/getstart` 和 `/:name` legacy URL。
- `api-contract`: 为用户详情响应定义 additive 公开资料与身份字段，同时保持 topic author 摘要契约不变。
- `user-profile-experience`: 丰富用户 Hero、使用真实统计并降低治理操作视觉优先级。
- `user-roles`: 定义可多选公开身份及独立来源，移除 `APP_MODERATORS` 判定。
- `user-management`: 将公开用户页上的管理员治理动作收纳到次级菜单。
- `topic-detail-experience`: 完善右侧作者卡，并将讨论规范入口指向 `/about` 页内区块。

## Impact

**In scope**：`apps/web` 路由、Layout/Footer、CommandPalette、About、用户详情与话题详情；`apps/api` 用户详情契约和角色解析；`packages/shared` 用户 DTO；对应 OpenSpec specs 与测试。

**Out of scope / Non-goals**：不修改 PostgreSQL schema 或 migration；不删除 `weibo` 列，仅停止公开展示；不扩充 `topic.author`；不在作者卡放动态内容列表；不保留旧 URL 重定向；不修改用户资料编辑能力。

**Affected systems**：Web SSR、Hono `/api/v1/user/:loginname`、shared Zod contract、环境角色判定和公开导航。高风险类别为公开 API additive contract、管理员/版主权限与身份边界、breaking URL 删除；不涉及数据写入或数据库迁移。

## Documentation Impact

更新当前 OpenSpec 中仍要求 `/help`、`/faq`、`/getstart` 和 `/:name` 兼容的规范。`docs/` 与 `wiki/` 当前没有面向用户维护这些入口的现行说明，无需改动；归档 change 与 legacy parity 记录作为历史事实保留，不回写。
