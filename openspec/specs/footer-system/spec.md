# footer-system Specification

## Purpose

定义主站和后台 footer 的品牌区域、链接分组、合作伙伴展示、响应式布局和视觉一致性要求，避免 footer 只呈现最小化占位信息。

## Requirements

### Requirement: 品牌 Footer

站点 SHALL 渲染完整品牌 footer，而不是最小化的一行文字 footer。

#### Scenario: Footer 品牌区域

- **WHEN** 主站页面渲染
- **THEN** footer 包含官方 CNode 品牌处理、社区描述和至少一个主要社区链接。

### Requirement: Footer 链接分组

Footer SHALL 将链接分组为社区、资源、开发者和合作伙伴/生态 sections。

#### Scenario: Footer 链接分组渲染

- **WHEN** footer 在桌面端渲染
- **THEN** 它展示社区页面、RSS/API 等资源、开发者/项目链接和合作伙伴/生态链接分组。

### Requirement: Footer 合作伙伴上下文

Footer SHALL 为合作伙伴、赞助商或基础设施支持提供克制展示区域。

#### Scenario: 赞助鸣谢

- **WHEN** 配置了合作伙伴数据
- **THEN** 合作伙伴名称或 logo 出现在带明确标签的 footer 区域，并使用安全外部链接。

### Requirement: Footer 响应式布局

Footer SHALL 在移动端保持视觉完整，将品牌和链接分组以合适间距堆叠。

#### Scenario: 移动端 footer

- **WHEN** 主站页面在移动端渲染
- **THEN** footer 内容堆叠展示，无截断或横向溢出。

### Requirement: Admin Footer 行为

后台页面 MAY 使用更轻量的 footer 处理，但如果渲染 footer，SHALL 与品牌系统视觉一致。

#### Scenario: 后台 footer 一致

- **WHEN** 后台页面包含 footer 内容
- **THEN** 它使用与主站 footer 一致的品牌 token 和链接样式。
