## MODIFIED Requirements

### Requirement: 品牌 Footer

站点 SHALL 渲染完整品牌 footer，而不是最小化的一行文字 footer。品牌区域 SHALL 提供“发布话题”和“了解社区”两个互补 CTA，且不得链接已移除的独立指引页面。

#### Scenario: Footer 品牌区域

- **WHEN** 主站页面渲染
- **THEN** footer 包含官方 CNode 品牌处理和社区描述
- **AND** “发布话题”指向 `/topic/create`
- **AND** “了解社区”指向 `/about`
- **AND** 不展示指向 `/getstart`、`/faq` 或 `/help` 的 CTA。

### Requirement: Footer 链接分组

Footer SHALL 将链接分组为社区、资源和开发者 sections，并 SHALL 避免同一路径在不同分组重复出现。

#### Scenario: Footer 链接分组渲染

- **WHEN** footer 在桌面端渲染
- **THEN** 社区分组展示“关于”“发布话题”“用户排行”“精华话题”，分别指向 `/about`、`/topic/create`、`/users/top100`、`/stars`
- **AND** 资源分组只展示指向 `/api` 的 API 与指向 `/rss` 的 RSS
- **AND** 开发者分组只展示指向项目仓库的安全 GitHub 外链
- **AND** Footer 不展示搜索、社区介绍重复入口或重复的 RSS 订阅入口。
