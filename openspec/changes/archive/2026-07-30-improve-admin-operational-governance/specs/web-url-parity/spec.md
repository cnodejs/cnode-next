## MODIFIED Requirements

### Requirement: legacy Web URL 必须可替代

系统 SHALL 对 `nodeclub/web_router.js` 中的线上公开 URL 提供等价页面、等价响应或明确兼容跳转。

#### Scenario: 静态公开 URL

- **WHEN** 用户访问 `/about`、`/faq`、`/getstart`、`/api`、`/rss`、`/sitemap.xml`、`/robots.txt`
- **THEN** 新系统返回与 nodeclub 线上语义等价的页面或响应类型
- **AND** `/robots.txt` 返回 `text/plain`
- **AND** `/rss` 和 `/sitemap.xml` 返回 XML 响应

#### Scenario: 公开 RSS feed 包含最新公开话题

- **WHEN** 用户或 RSS reader 访问 `/rss`
- **THEN** 系统 MUST 返回 RSS 2.0 XML 响应
- **AND** 响应 `Content-Type` SHOULD 为 `application/rss+xml; charset=utf-8`
- **AND** channel MUST 包含 CNode 标题、站点链接、语言和描述
- **AND** feed MUST 包含最多 50 条按创建时间倒序排列的最新公开可见话题 item
- **AND** 每个 item MUST 包含 `title`、`link`、`guid`、`description`、`author` 和 `pubDate`

#### Scenario: RSS feed 公开可见性过滤

- **WHEN** 系统生成 `/rss` item 列表
- **THEN** 系统 MUST 排除 `dev` 和 `test` 内部 tab 的话题
- **AND** 系统 MUST 排除 `deleted=true` 的话题
- **AND** 系统 MUST 排除 `status=deleted` 的话题
- **AND** 系统 MUST 排除被 block 用户创建的话题
- **AND** 系统 MAY 包含 `job` tab 的公开话题

#### Scenario: RSS XML 内容安全

- **WHEN** 系统把话题标题、作者和内容写入 RSS XML
- **THEN** 系统 MUST escape XML 特殊字符或使用安全的 XML 序列化方式
- **AND** 系统 MUST 移除 RSS XML 不允许的非法字符
- **AND** topic 内容 MUST 不破坏 RSS XML 结构

#### Scenario: app 下载兼容跳转

- **WHEN** 用户访问 `/app/download`
- **THEN** 系统重定向到 legacy nodeclub 使用的移动端下载说明地址

#### Scenario: 用户短路径兼容

- **WHEN** 生产环境用户访问 `/:name`
- **AND** `:name` 不匹配任何已知一级路由
- **THEN** 系统重定向到 `/user/:name`

#### Scenario: legacy 用户排行入口

- **WHEN** 用户访问 `/stars`
- **THEN** 系统展示 `is_star=true` 的达人列表
- **WHEN** 用户访问 `/users/top100`
- **THEN** 系统展示未禁言用户按 score 降序排列的前 100 名
