# seo Specification

## Purpose

TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.

## Requirements

### Requirement: Open Graph 标签

系统 MUST 在页面 head 中输出 Open Graph 和 Twitter Card 标签，使社交分享时显示预览卡片；所有公开可分享页面 MUST 提供站点名、页面标题、描述、绝对 URL 和图片，并在页面没有专属图片时使用 CNode 默认分享图。

#### Scenario: 话题详情页 OG 标签

- **WHEN** 用户或爬虫访问话题详情页
- **THEN** 页面 head 包含 `og:type`、`og:site_name`、`og:title`、`og:description`、`og:image` 和 `og:url`
- **AND** `og:type` 为 `article`
- **AND** `og:title` 为话题标题
- **AND** `og:description` 为话题内容清洗后的前 100-160 个字符
- **AND** `og:image` 优先使用话题内容中可提取的第一张图片，无图时使用站点默认图 `/cnode/og.png`
- **AND** `og:url` 为该话题详情页的绝对 URL。

#### Scenario: 列表页 OG 标签

- **WHEN** 用户或爬虫访问首页、分页列表、分类列表或专区列表页
- **THEN** 页面 head 输出站点默认 OG 标签，包括 `og:type=website`、`og:site_name`、`og:title`、`og:description`、`og:image` 和 `og:url`
- **AND** `og:image` 使用 CNode 默认分享图 `/cnode/og.png`。

#### Scenario: 用户页 OG 标签

- **WHEN** 用户或爬虫访问用户主页、用户话题、用户回复或用户收藏页面
- **THEN** 页面 head 输出用户相关的 `og:title`、`og:description`、`og:image` 和 `og:url`
- **AND** `og:title` 包含用户登录名和 CNode 站点名
- **AND** `og:image` 使用用户头像或 CNode 默认分享图。

#### Scenario: Twitter Card

- **WHEN** 用户或爬虫访问任何公开 Web 页面
- **THEN** 页面 head 输出 `twitter:card=summary_large_image`
- **AND** 输出与当前页面 OG 内容一致的 `twitter:title`、`twitter:description` 和 `twitter:image`。

### Requirement: JSON-LD 结构化数据

系统 MUST 在话题详情页输出 JSON-LD 结构化数据,帮助搜索引擎理解内容。

#### Scenario: 话题详情页 JSON-LD

- **WHEN** 访问话题详情页
- **THEN** 页面输出 DiscussionForumPosting 类型的 JSON-LD
- **AND** 包含 headline, author, datePublished, interactionStatistic (回复数)

### Requirement: Canonical URL

系统 MUST 输出 canonical URL，避免分页、分类 query 或重复路径被搜索引擎判定为重复内容；canonical MUST 使用站点绝对 URL。

#### Scenario: 话题详情 canonical

- **WHEN** 访问 `/topic/123` 或 `/topic/123/page/2`
- **THEN** canonical 指向 `https://cnodejs.org/topic/123`，不带分页路径或 query。

#### Scenario: 列表页 canonical

- **WHEN** 访问 `/`、`/?tab=share` 或 `/?page=2`
- **THEN** canonical 指向 `https://cnodejs.org/`，不带 query。

#### Scenario: 用户页 canonical

- **WHEN** 访问 `/user/:name`、`/user/:name/topics`、`/user/:name/replies` 或 `/user/:name/collections`
- **THEN** canonical 指向对应用户页面的绝对 URL
- **AND** canonical 不包含分页或筛选 query。

### Requirement: 公开页面 HTTPS 子资源

系统 MUST 在 HTTPS 页面中输出 HTTPS 或同源相对路径子资源，避免浏览器因图片、头像、manifest icon 或 OG 图片产生 mixed content 告警。

#### Scenario: Gravatar 头像使用 HTTPS

- **WHEN** API、数据库或 legacy 数据提供 `http://gravatar.com/...` 或 `http://www.gravatar.com/...` 头像 URL
- **THEN** Web 页面渲染的头像 `src` SHALL 使用 `https://gravatar.com/...` 或 `https://www.gravatar.com/...`
- **AND** 首页、列表页、侧边栏、用户页和话题详情页 SHALL NOT 输出 HTTP Gravatar 图片。

#### Scenario: 公开静态元数据图片使用 HTTPS 或同源路径

- **WHEN** 页面 head 输出 `og:image`、`twitter:image`、manifest icons 或 favicon links
- **THEN** 这些资源 SHALL 使用 `https://cnodejs.org/...` 绝对 URL 或 `/...` 同源相对路径
- **AND** 页面 HTML MUST NOT 包含会被浏览器作为子资源加载的 `http://` 图片 URL。

### Requirement: Web App Manifest 元数据

系统 MUST 在根路径提供 `/manifest.json`，并在页面 head 中声明 manifest link，使浏览器、移动端收藏和爬虫能够读取 CNode 站点身份与图标信息。

#### Scenario: Manifest 路径可访问

- **WHEN** 客户端请求 `/manifest.json`
- **THEN** Web 应用返回 JSON manifest 而不是 404
- **AND** manifest 包含 `name`、`short_name`、`description`、`start_url`、`scope`、`display`、`background_color`、`theme_color` 和 `icons`。

#### Scenario: Manifest 不承诺安装型 PWA

- **WHEN** 客户端读取 `/manifest.json`
- **THEN** `display` SHALL 为 `browser`
- **AND** manifest MUST NOT 暗示离线缓存、Service Worker 或独立安装应用能力。

#### Scenario: Manifest 图标使用 CNode 资源

- **WHEN** 客户端读取 manifest icons
- **THEN** icons SHALL 引用 `/cnode/icon-192.png` 和 `/cnode/icon-512.png`
- **AND** 图标资源 SHALL 使用 CNode 自有品牌标识。
