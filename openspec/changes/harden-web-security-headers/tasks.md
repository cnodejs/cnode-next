## 1. MVP：策略与服务端边界

- [x] 1.1 调查当前 React Router Node 默认 `entry.server`，用目标版本验证 `<Scripts />`、`<ScrollRestoration />` 和自有内联脚本的 nonce 透传方式，并将结论落实为失败测试。
- [x] 1.2 新增纯函数安全策略模块，生成通用安全头、`off`/`report-only`/`enforce` 阶段 CSP 和保守 HSTS 值，并为指令值及开发/生产差异添加单元测试。
- [x] 1.3 新增自定义 `apps/web/app/entry.server.tsx`，为每个文档响应生成独立密码学 nonce，在 2xx、4xx 和 5xx HTML 响应上合并安全头且不丢失现有状态、headers 或流式渲染行为。
- [x] 1.4 将 SSR nonce 传给 `apps/web/app/root.tsx` 中的主题脚本、公开配置脚本、`<Scripts />` 和 `<ScrollRestoration />`，验证两个独立响应 nonce 不同且 CSP 与 HTML 属性一致。
- [x] 1.5 添加 Web SSR 目标测试，覆盖通用安全头、观测模式、强制模式、错误文档、nonce 一致性和最终 `script-src` 不含 `'unsafe-inline'`。

## 2. MVP：CSP 观测与报告

- [x] 2.1 实现同源 CSP 报告资源路由，仅接受规定内容类型和受限请求体，解析兼容的报告 envelope 并返回无正文响应。
- [x] 2.2 对 CSP 报告使用字段白名单和 URL 脱敏，只记录 directive、去除查询参数与片段的来源摘要、同源文档路径和策略阶段；拒绝记录原始正文、Cookie、请求头或代码片段。
- [x] 2.3 为报告入口接入适用的匿名限流边界，并添加有效报告、格式错误、内容类型错误、超限、跨源 URL 和敏感查询参数测试。
- [ ] 2.4 在候选 CSP 中配置报告目标，并通过浏览器 smoke test 验证首页、登录、话题详情、管理入口和 Turnstile 相关页面在 Report-Only 下可渲染、hydration、导航、请求 API 和加载当前头像来源。

## 3. Feature-Complete：部署与强制切换

- [ ] 3.1 核实生产 Caddy 和其他入口的现有 header 配置，为 CSP、HSTS 及其他安全头指定唯一所有者，并确认最终客户端响应不存在冲突、重复或策略放宽。
- [x] 3.2 增加无需重建镜像即可切换 CSP 阶段和 HSTS `max-age` 的安全运行时配置，校验未知值时采用安全、可用且可观测的默认行为。
- [ ] 3.3 定义并执行 Report-Only 观测门槛：约定窗口内无未解释第一方违规、关键浏览器测试通过、必要来源均有评审记录，然后切换强制 CSP。
- [x] 3.4 为发布后探测增加首页、交互页面和 HTML 错误响应检查，确认预期 CSP 阶段、HSTS、安全头、hydration 和资源加载，且探测输出不包含 Cookie、凭据或报告原文。
- [ ] 3.5 演练强制模式回退到 Report-Only 及 HSTS 降档，记录完成时间、可观察信号和恢复结果，不执行 `includeSubDomains` 或 preload。

## 4. 文档与验证

- [x] 4.1 按 `cnode-docs` 将 CSP 阶段、响应头所有权、HSTS 限制、生产探测和回退步骤合并到 `docs/deployment/deployment.md`；仅在 nonce 传递构成长期开发表面时补充一个 `docs/arch/` 权威文档。
- [x] 4.2 检查文档没有复制易漂移的完整策略值、没有建立 README/index、没有陈旧路径或不安全示例，并运行 `pnpm secrets:scan`。
- [x] 4.3 运行 Web 目标测试、`pnpm --filter @cnode/web typecheck`、相关 lint/build，并在可行时运行 `pnpm verify`；记录因环境限制未执行的检查。
- [ ] 4.4 核对 design Mermaid 图、spec 场景、任务完成证据与最终实现一致，运行严格 OpenSpec 验证并确认 change 可归档。
