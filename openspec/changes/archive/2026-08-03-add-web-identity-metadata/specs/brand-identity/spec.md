## ADDED Requirements

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
