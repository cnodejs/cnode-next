## Why

生产站点当前未返回可识别的浏览器安全响应头，缺少 CSP、HSTS、内容类型嗅探防护、引用来源限制和嵌入限制。由于 React Router SSR 文档包含主题初始化与公开配置两个内联脚本，必须以可观测、可回退的方式引入 CSP，避免直接强制策略导致页面启动失败。

## What Changes

- 为 Web HTML、静态资源和适用的 API 响应定义最小安全响应头基线。
- CSP 先以 `Content-Security-Policy-Report-Only` 上线并记录违规，再满足验收条件后切换为强制策略。
- 为 SSR 内联脚本建立每响应 nonce 或等效 hash 机制，避免通过 `'unsafe-inline'` 放宽 `script-src`。
- 明确定义站点当前需要的同源资源、`api.cnodejs.org` 请求和第三方头像图片来源。
- 增加自动化测试与生产探测，验证安全头存在、CSP 可解析且关键页面仍可启动和交互。
- 记录策略所有权、灰度步骤、回退方式和新增外部资源来源的评审要求。

## Capabilities

### New Capabilities

- `web-response-security`: 定义 Web 响应安全头基线、CSP 渐进式上线、内联脚本授权和验证行为。

### Modified Capabilities

无。

## Scope

### In Scope

- `apps/web` 的 SSR 文档和 Web 资源响应。
- 与浏览器安全相关的反向代理或运行时响应头配置。
- CSP Report-Only 观测、强制切换、自动化测试和部署验证。
- `docs/arch/` 或 `docs/deployment/` 中必要的长期策略与操作说明。

### Out of Scope

- Cloudflare 橙云代理、WAF、Bot Management 和源站网络访问控制。
- DNSSEC、`www` 规范域、`robots.txt`、Sitemap 和 AI 爬虫政策。
- 头像代理、图片转码、首屏资源拆包和其他性能优化。
- API 认证、授权、CORS 行为和会话机制调整。

### Affected Systems

- React Router SSR 根文档 `apps/web/app/root.tsx`。
- Web 响应生成入口、部署反向代理配置及其测试。
- 生产响应头探测与发布验证流程。

### High-Risk Categories

- CSP 配置错误可能阻止 hydration、主题初始化、导航、API 请求或第三方头像加载。
- HSTS 配置会长期影响浏览器访问，启用 `includeSubDomains` 或 preload 前必须独立确认所有子域支持 HTTPS。
- 在代理层和应用层重复配置可能产生冲突或覆盖。

## Impact

- 不改变公开 API 请求或响应 schema，不需要数据库迁移或新增运行时依赖。
- Web 页面视觉、响应式布局和交互设计不变；适用的项目 Skill 为 `cnode-docs`，因为需要维护部署或架构说明。
- 实施时需要确认安全头的唯一所有者，并覆盖 SSR、静态资源、错误响应和重定向响应。

## Documentation Impact

- `docs/arch/`：仅在需要记录 CSP nonce 生命周期或响应头所有权这一长期架构决策时更新。
- `docs/deployment/`：记录上线阶段、生产探测、回退方式及 HSTS 限制。
- `docs/biz/`、根治理文件和 `apps/*/README.md`：预计不变。
- `apps/web/public/openapi.json` 及 Web API reference：不受影响。

## Non-goals

- 不以通过单一外部扫描评分为目标；策略以实际威胁降低和站点兼容性为准。
- 不允许用全局 `'unsafe-inline'` 作为最终 CSP 实现。
- 不在本 change 中启用 HSTS preload 或未经确认的 `includeSubDomains`。
- 不改变页面设计、业务功能或第三方内容政策。
