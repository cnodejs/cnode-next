# jobs-detail-card Specification

## Purpose

定义招聘详情页 meta 卡片的展示形态：在 content 上方插入 `JobMetaCard`，含 logo/公司/职位/徽章组/contact/CTA，仅在 `tab='job'` 且有 meta 时渲染。

## ADDED Requirements

### Requirement: JobMetaCard 位置在 content 上方

详情页 `topic.$tid.tsx` 的 content `<Card>` 内部 SHALL 在 `<MarkdownView>` 上方插入 `<JobMetaCard>`，仅在 `tab='job'` 且 `job_meta` 非空时渲染。

#### Scenario: 招聘详情页渲染 meta 卡片

- **WHEN** 用户访问 `tab='job'` 且有 `job_meta` 的 topic 详情
- **THEN** content Card 内部在 MarkdownView 上方渲染 JobMetaCard
- **AND** JobMetaCard 展示 logo/公司/职位/徽章组/contact/CTA

#### Scenario: 非招聘详情页不渲染 meta 卡片

- **WHEN** 用户访问 `tab='share'` 的 topic 详情
- **THEN** content Card 内部不渲染 JobMetaCard
- **AND** 直接渲染 MarkdownView

#### Scenario: 历史招聘帖无 meta 不渲染

- **WHEN** 用户访问 `tab='job'` 但 `job_meta` 为 null 的 topic 详情
- **THEN** content Card 内部不渲染 JobMetaCard
- **AND** 直接渲染 MarkdownView

### Requirement: JobMetaCard 字段渲染

`JobMetaCard` SHALL 展示 logo、公司名、职位类别、地点/远程/薪资/经验徽章、技术栈标签、联系方式、CTA 按钮。

#### Scenario: 字段完整渲染

- **WHEN** JobMetaCard 渲染且所有 meta 字段非空
- **THEN** 卡片左上展示 `company_logo`（如有）或公司名首字 fallback
- **AND** 展示 `company` 公司名
- **AND** 展示 `position` 职位类别
- **AND** 展示 `location` / `remote` / `salary_min-max` / `experience` 为徽章组
- **AND** 展示 `tech_tags` 为标签
- **AND** 展示 `contact` 联系方式
- **AND** 展示 CTA 按钮

#### Scenario: 薪资为面议时的渲染

- **WHEN** `salary_min` 和 `salary_max` 均为 null
- **THEN** 薪资徽章展示"面议"
- **AND** 不展示数字范围

#### Scenario: 缺少 logo 时的 fallback

- **WHEN** `company_logo` 为 null 或空字符串
- **THEN** 展示公司名首字大写的 fallback 图标
- **AND** 复用 `getAvatarFallback`（`apps/web/app/lib/brand.ts:12`）逻辑

### Requirement: CTA 投递按钮按 contact 形态分发

`JobMetaCard` 的 CTA 按钮 SHALL 按 `contact` 字段值形态分发行为。

#### Scenario: contact 为邮箱

- **WHEN** `contact` 含 `@`
- **THEN** CTA 渲染为 `<a href="mailto:{contact}">` 链接
- **AND** 按钮文案为"立即投递"

#### Scenario: contact 为 URL

- **WHEN** `contact` 以 `http://` 或 `https://` 开头
- **THEN** CTA 渲染为 `<a href="{contact}" target="_blank" rel="noopener noreferrer">` 链接
- **AND** 按钮文案为"立即投递 ↗"

#### Scenario: contact 为其他形态（微信/QQ/电话）

- **WHEN** `contact` 不匹配邮箱或 URL 形态
- **THEN** CTA 点击触发 Sheet 弹层
- **AND** Sheet 展示联系方式原文和"复制"按钮
- **AND** 复用 `ui/sheet` 组件

### Requirement: JobMetaCard 与 JobCardGrid 的单卡是不同组件

`JobMetaCard`（详情页完整版）和 `JobCardGrid` 的单卡（列表浓缩版）SHALL 是两个独立组件，不共享渲染逻辑。

#### Scenario: 两个组件职责分离

- **WHEN** 查看 `JobMetaCard` 组件
- **THEN** 它渲染完整 meta 字段 + contact + CTA，用于详情页
- **AND** 查看 `JobCardGrid` 的单卡组件时，它只渲染浓缩字段 + JD 摘要，用于列表页
- **AND** 两者不通过 props 切换形态复用同一组件
