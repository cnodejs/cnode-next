## 1. 品牌资源与 favicon MVP

- [x] 1.1 审查 `apps/web/public/egg/logo.svg` 的几何与渐变结构，确认只替换为 CNode 品牌绿色体系。
- [x] 1.2 创建 `apps/web/public/cnode/`，基于 Egg logo 原始几何生成 `/cnode/logo.svg`、`/cnode/logo-light.svg` 和 `/cnode/icon.svg`。
- [x] 1.3 基于同一 CNode logo 源生成 `/cnode/favicon.svg`、`/cnode/favicon.png`、`/cnode/favicon.ico`、`/cnode/apple-touch-icon.png`、`/cnode/icon-192.png` 和 `/cnode/icon-512.png`。
- [x] 1.4 保留或补齐根路径 `/favicon.ico`、`/favicon.png` 和 `/apple-touch-icon.png` fallback，确保常见浏览器默认探测路径不返回 404。
- [x] 1.5 生成 `/cnode/og.png` 默认分享图，使用 CNode 品牌视觉并满足常见社交平台的 PNG 图片要求。

## 2. Manifest 与 root head

- [x] 2.1 新增 `apps/web/public/manifest.json`，声明 CNode 的 `name`、`short_name`、`description`、`start_url`、`scope`、`display=browser`、颜色和 manifest icons。
- [x] 2.2 更新 `apps/web/app/root.tsx` 的 head links，声明 SVG favicon、ICO fallback、apple touch icon 和 manifest。
- [x] 2.3 确认 root head 不引入 Service Worker、离线缓存或安装型 PWA 行为。

## 3. SEO 元数据实现

- [x] 3.1 添加轻量 SEO helper，用于生成默认站点 title/description、绝对 URL、canonical、OG 和 Twitter Card meta。
- [x] 3.2 为首页、列表页和专区页接入默认 website OG、Twitter Card 和 canonical 输出。
- [x] 3.3 为话题详情页接入 article OG、Twitter Card、canonical 和 Markdown 纯文本摘要清洗。
- [x] 3.4 为话题详情页实现首图提取或默认 `/cnode/og.png` 回退策略。
- [x] 3.5 为用户主页、用户话题、用户回复和用户收藏页接入用户相关 title/description、OG、Twitter Card 和 canonical 输出。
- [x] 3.6 检查现有 JSON-LD 规格要求是否已有实现；若缺失，补齐或在任务执行时明确拆出后续 change。

## 4. HTTPS 子资源与头像归一化

- [x] 4.1 更新 `apps/api/src/lib/format.ts` 的头像 URL 归一化逻辑，将 `http://gravatar.com/...` 和 `http://www.gravatar.com/...` 升级为 HTTPS。
- [x] 4.2 更新 `apps/web/app/lib/brand.ts` 的 `getAvatarUrl` 兜底逻辑，将透传到 Web 的 HTTP Gravatar URL 升级为 HTTPS。
- [x] 4.3 检查首页、侧边栏、话题列表、话题详情和用户页的头像调用点，确认全部通过归一化函数输出 `AvatarImage src`。
- [x] 4.4 使用浏览器 console 或 HTML 检查确认 `https://cnodejs.org/` 不再输出 HTTP Gravatar mixed content warning。

## 5. 验证与文档

- [x] 5.1 运行 `pnpm --filter @cnode/web typecheck` 验证 React Router meta 与 helper 类型。
- [x] 5.2 运行 `pnpm --filter @cnode/web build` 验证 public 资源和 SSR 构建产物。
- [x] 5.3 在本地或预览环境请求 `/favicon.ico`、`/favicon.png`、`/apple-touch-icon.png`、`/manifest.json`、`/cnode/favicon.svg` 和 `/cnode/og.png`，确认状态码和 content-type 正确。
- [x] 5.4 使用 `curl` 检查首页、话题详情页和用户页 HTML，确认 `og:*`、`twitter:*`、`canonical` 和 manifest link 已 SSR 输出。
- [x] 5.5 检查首页 HTML 中不会出现会作为子资源加载的 `src="http://`、`srcset` 中 HTTP 图片或 HTTP Gravatar URL。
- [x] 5.6 更新 `docs/conventions.md` 或相邻前端约定文档，记录 `apps/web/public/cnode/` 资源用途、根路径 fallback、OG/manifest 维护规则和头像 HTTPS 归一化约定。
- [x] 5.7 执行 OpenSpec 校验，确认 `brand-identity` 与 `seo` delta 可归档且 design 中 Database Change Audit 仍为“不涉及”。
