## Why

当前线上 CNode Web 的品牌资源与页面元数据不完整：`/favicon.ico`、`/manifest.json`、`/apple-touch-icon.png` 等浏览器默认探测路径返回 404，Open Graph 仅在话题详情页输出 `og:title` 和 `og:description`，缺少默认分享图、canonical、Twitter Card 和全站一致的品牌元数据。CNode 与 Egg.js 同属 CNode group 维护，`apps/web/public/egg/` 已提供可参考的 logo/favicon 资源组织方式，应将 CNode 自身的 logo、favicon、manifest 和 OG 能力整理成稳定的 Web identity 基础设施。

## What Changes

- 在 `apps/web/public/cnode/` 下建立 CNode 品牌资源目录，收纳完整 logo、浅色 logo、小尺寸 icon、favicon、apple touch icon、manifest icons 和默认 OG 分享图。
- 以 `apps/web/public/egg/logo.svg` 的几何结构作为同源社区视觉基础，仅将颜色替换为 CNode 品牌绿色体系，产出 CNode logo 与 favicon；保留 legacy CNode 字标路径用于已有调用兼容。
- 补齐根路径兼容资源，避免浏览器、爬虫或旧客户端访问 `/favicon.ico`、`/favicon.png`、`/manifest.json`、`/apple-touch-icon.png` 时出现 404。
- 更新 Web SSR head 元数据，使首页、列表页、话题详情页、用户页和通用内容页具备一致的 Open Graph、Twitter Card、canonical 和 manifest link。
- 话题详情页继续使用话题标题和摘要作为分享内容，并在没有可用话题图片时回退到 CNode 默认 OG 图。
- 归一化公开页面头像等图片 URL，避免 HTTPS 页面输出 `http://www.gravatar.com/...` 等 mixed content 子资源告警。
- 不引入 Service Worker、离线缓存或安装型 PWA 行为；manifest 仅表达站点身份和图标信息。

## Non-goals

- 不重做 CNode 主视觉、颜色体系或现有 Tailwind/shadcn 设计系统。
- 不替换导航栏、后台或认证页面当前使用的完整 CNode 字标；`/cnode/` 新标识仅供 favicon、manifest、Apple icon 和 OG 等元数据资源使用。
- 不迁移或修改 `apps/web/public/egg/` 中的 Egg.js 资源。
- 不实现动态 OG 图片生成服务；本次只提供静态默认 OG 图和页面级元数据。
- 不改变 legacy `nodeclub/` 的资源路径或线上服务配置；legacy 仅作为旧站行为参考，不作为本次实现目标。
- 不新增 CDN、OSS 上传、图片处理服务或第三方 SEO 服务。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `brand-identity`: 增加公开品牌资源目录、favicon/icon/OG 图派生资源和小尺寸品牌标识要求。
- `seo`: 明确全站 OG/Twitter/canonical/manifest 输出规则，补齐话题页、首页/列表页、用户页的分享元数据要求，并要求公开页面避免输出 mixed content 子资源。

## Impact

- Affected code: `apps/web/public/`, `apps/web/app/root.tsx`, route `meta` functions, `apps/web/app/lib/brand.ts`, `apps/api/src/lib/format.ts`, possibly shared SEO helper under `apps/web/app/lib/` if implementation需要复用元数据生成逻辑。
- Affected specs: `openspec/specs/brand-identity/spec.md`, `openspec/specs/seo/spec.md`。
- Affected systems: React Router SSR head output, browser favicon discovery, social crawler previews, mobile bookmark metadata。
- High-risk categories: 静态资源路径兼容、SSR meta 去重、Markdown 摘要清洗、头像 URL 兼容、生产缓存导致的旧 favicon/OG 预览延迟。
- Documentation Impact: 应更新 `docs/` 或 `wiki/` 中与部署资产、品牌资源或前端约定相关的说明，记录 `apps/web/public/cnode/` 的用途、默认图标路径和 manifest/OG 资产维护规则；若现有文档没有专门位置，应在 `docs/conventions.md` 或相邻前端约定文档中补充。
