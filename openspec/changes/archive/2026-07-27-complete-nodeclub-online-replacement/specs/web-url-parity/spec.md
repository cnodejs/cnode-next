## ADDED Requirements

### Requirement: legacy Web URL 必须可替代

系统 SHALL 对 `nodeclub/web_router.js` 中的线上公开 URL 提供等价页面、等价响应或明确兼容跳转。

#### Scenario: 静态公开 URL

- **WHEN** 用户访问 `/about`、`/faq`、`/getstart`、`/api`、`/rss`、`/sitemap.xml`、`/robots.txt`
- **THEN** 新系统返回与 nodeclub 线上语义等价的页面或响应类型
- **AND** `/robots.txt` 返回 `text/plain`
- **AND** `/rss` 和 `/sitemap.xml` 返回 XML 响应

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
