# topic-detail-experience Specification

## MODIFIED Requirements

### Requirement: Topic Header 信息层级

Topic Header SHALL 包含状态 badges、分类 tag、标题、作者、发布时间、可用时的最后回复时间、回复数、浏览数和 actions。当 `tab='job'` 且有 `job_meta` 时，content Card 内部 SHALL 在 MarkdownView 上方渲染 `JobMetaCard`。

#### Scenario: Topic Header metadata

- **WHEN** topic 详情页渲染
- **THEN** 作者、发布时间、回复数、浏览数和 tags 在标题附近以设计好的 metadata layout 可见。

#### Scenario: 招聘详情页渲染 meta 卡片

- **WHEN** `tab='job'` 且 `job_meta` 非空的 topic 详情页渲染
- **THEN** content Card 内部在 MarkdownView 上方渲染 JobMetaCard
- **AND** JobMetaCard 展示 logo/公司/职位/徽章组（地点/远程/薪资/经验）/tech_tags/contact/CTA
- **AND** CTA 按 contact 形态分发行为（mailto / 外链 / Sheet 展示）

#### Scenario: 非招聘详情页不渲染 meta 卡片

- **WHEN** `tab` 不为 `'job'` 的 topic 详情页渲染
- **THEN** content Card 内部直接渲染 MarkdownView
- **AND** 不渲染 JobMetaCard

#### Scenario: 历史招聘帖无 meta 不渲染卡片

- **WHEN** `tab='job'` 但 `job_meta` 为 null 的 topic 详情页渲染
- **THEN** content Card 内部直接渲染 MarkdownView
- **AND** 不渲染 JobMetaCard
