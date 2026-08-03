# brand-identity Specification

## Purpose

定义 CNode Web UI 的品牌锚点、官方 logo 使用、品牌绿色 token、surface 层级和交互状态要求，确保主站、后台和系统状态页面保持一致视觉身份。
## Requirements
### Requirement: 官方 CNode 品牌锚点

Web UI SHALL 在主站、后台、footer、empty/error 等场景使用官方 CNode logo 与品牌绿 `#80bd01` 作为主要品牌锚点。

#### Scenario: Shell 使用官方 logo

- **WHEN** 主站或后台 Header 在桌面端渲染
- **THEN** Header 使用官方 CNode logo 或文档化的派生标识
- **AND** logo 链接到对应的首页上下文。

#### Scenario: 绿色 token 来源于 CNode logo

- **WHEN** 定义 primary、hover、focus、badge 和 soft surface 色值
- **THEN** 它们派生自 CNode logo 绿色 `#80bd01`，而不是 shadcn 默认蓝色或灰色。

### Requirement: Logo 对比度处理

系统 SHALL 只在白色路径清晰可见的背景上渲染官方 light logo，或在浅色 surface 上使用文档化的替代标识处理。

#### Scenario: 避免 light logo 出现在白底

- **WHEN** logo 出现在白色或接近白色的 surface 上
- **THEN** 实现使用对比度安全的品牌 surface、替代 logo 处理或 compact 派生标识
- **AND** 白色路径不会消失。

### Requirement: 品牌 surface 层级

设计系统 SHALL 定义 brand、card、raised、subtle、popover、footer 等 surface，并提供一致的 border 与 shadow 语义。

#### Scenario: 主 CTA 使用品牌处理

- **WHEN** Header 中渲染“发布话题”CTA
- **THEN** 它使用 CNode primary green token，并具有 hover、active、focus、disabled 状态
- **AND** Header 中没有其它文字导航项使用同样的 filled primary 处理。

### Requirement: 交互 token

hover、active、focus-visible、selected、disabled、destructive 状态 SHALL 使用可见且可访问的视觉处理，并在适用时使用 CNode green。

#### Scenario: 键盘焦点可见

- **WHEN** 用户通过 Tab 聚焦 link、button、menu item、search entry 和 form 控件
- **THEN** 每个可聚焦元素都显示与品牌 token 一致的 focus ring 或 focus surface。

### Requirement: 公开品牌资源目录

Web UI SHALL 在 `apps/web/public/cnode/` 提供 CNode 公开品牌资源，并将完整 logo、小尺寸 icon、favicon、manifest icon 和默认社交分享图分离维护。

#### Scenario: CNode 品牌资源路径稳定

- **WHEN** 构建或部署 Web 应用
- **THEN** `/cnode/logo.svg`、`/cnode/logo-light.svg`、`/cnode/icon.svg`、`/cnode/favicon.svg`、`/cnode/favicon.png`、`/cnode/favicon.ico`、`/cnode/apple-touch-icon.png`、`/cnode/icon-192.png`、`/cnode/icon-512.png` 和 `/cnode/og.png` SHALL 作为静态资源存在
- **AND** 这些资源 SHALL 使用 CNode 自有 logo 或其文档化派生标识。

#### Scenario: 根路径 favicon fallback 可访问

- **WHEN** 浏览器、爬虫或旧客户端请求 `/favicon.ico`、`/favicon.png` 或 `/apple-touch-icon.png`
- **THEN** Web 应用 SHALL 返回对应 CNode 图标资源而不是 404
- **AND** 根路径资源 SHALL 与 `/cnode/` 下的同类资源保持同一品牌视觉来源。

#### Scenario: CNode 与 Egg.js 使用同源几何语言

- **WHEN** 生成 CNode 小尺寸 icon 或 favicon
- **THEN** 实现 SHALL 以 `apps/web/public/egg/logo.svg` 的几何结构为基础
- **AND** 实现 SHALL 只将其颜色替换为以 `#80bd01` 为锚点的 CNode 品牌绿色体系
- **AND** 实现 MUST NOT 修改原始 `apps/web/public/egg/` 资源。

#### Scenario: 站内导航字标保持不变

- **WHEN** Header、Admin 或认证页面渲染 `CNodeLogo`
- **THEN** 实现 SHALL 继续使用 `/cnodejs.svg` 与 `/cnodejs_light.svg` 完整字标
- **AND** `/cnode/` 下的 favicon/manifest/OG 标识 MUST NOT 替换站内导航字标。
