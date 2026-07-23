# SEO & Social Sharing

## ADDED Requirements

### Requirement: Open Graph 标签

系统 MUST 在页面 head 中输出 Open Graph 和 Twitter Card 标签,使社交分享时显示预览卡片。

#### Scenario: 话题详情页 OG 标签

- **WHEN** 用户或爬虫访问话题详情页
- **THEN** 页面 head 包含 og:title, og:description, og:image, og:url
- **AND** og:title 为话题标题
- **AND** og:description 为话题内容前 100 字符
- **AND** og:image 从话题内容提取第一张图片,无图用站点默认图

#### Scenario: 列表页 OG 标签

- **WHEN** 访问首页或列表页
- **THEN** 输出站点默认的 OG 标签 (站点名、描述、logo)

#### Scenario: Twitter Card

- **WHEN** 任何页面
- **THEN** 输出 twitter:card = summary_large_image

### Requirement: JSON-LD 结构化数据

系统 MUST 在话题详情页输出 JSON-LD 结构化数据,帮助搜索引擎理解内容。

#### Scenario: 话题详情页 JSON-LD

- **WHEN** 访问话题详情页
- **THEN** 页面输出 DiscussionForumPosting 类型的 JSON-LD
- **AND** 包含 headline, author, datePublished, interactionStatistic (回复数)

### Requirement: Canonical URL

系统 MUST 输出 canonical URL,避免分页/重复路径被搜索引擎判定为重复内容。

#### Scenario: 话题详情 canonical

- **WHEN** 访问 /topic/123 或 /topic/123/page/2
- **THEN** canonical 指向 /topic/123 (不带分页参数)

#### Scenario: 列表页 canonical

- **WHEN** 访问 /?tab=share 或 /?page=2
- **THEN** canonical 指向 / (不带 query)
