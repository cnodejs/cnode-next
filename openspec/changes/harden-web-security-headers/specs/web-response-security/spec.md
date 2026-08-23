## ADDED Requirements

### Requirement: HTML 响应安全头基线
系统 SHALL 为生产环境的 Web HTML 文档响应设置 `X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、禁止站点被非授权页面嵌入的策略，以及限制未使用浏览器能力的 `Permissions-Policy`。

#### Scenario: 正常 SSR 文档响应
- **WHEN** 浏览器请求任意可公开访问的 SSR 页面
- **THEN** HTML 响应包含安全头基线且页面状态码和内容不因安全头而改变

#### Scenario: HTML 错误文档响应
- **WHEN** Web 应用返回由文档渲染流程生成的 4xx 或 5xx HTML 响应
- **THEN** 响应仍包含安全头基线

### Requirement: HTTPS 传输策略
系统 SHALL 在确认请求由生产 HTTPS 入口提供时返回 HSTS，初始策略不得包含 `includeSubDomains` 或 `preload`，并 SHALL 允许在不重新构建应用镜像的情况下回退或延长 `max-age`。

#### Scenario: 生产 HTTPS 响应
- **WHEN** 用户通过生产 HTTPS 入口请求 Web HTML 文档
- **THEN** 响应包含已配置 `max-age` 的 `Strict-Transport-Security` 且不包含未经批准的 `includeSubDomains` 或 `preload`

#### Scenario: 本地 HTTP 开发
- **WHEN** 开发者通过本地 HTTP 服务访问 Web 应用
- **THEN** 应用不依赖 HSTS 完成访问，且本地开发响应不强制声明生产 HSTS 策略

### Requirement: CSP 观测模式
系统 SHALL 在强制 CSP 前以 `Content-Security-Policy-Report-Only` 发布候选策略。候选策略 MUST 默认限制资源为同源、禁止插件对象、限制 base URI 和 frame ancestor，并仅显式允许站点运行所需的 API 与图片来源。

#### Scenario: 首次发布候选策略
- **WHEN** CSP 发布阶段配置为观测模式
- **THEN** HTML 响应包含 `Content-Security-Policy-Report-Only`，不包含强制 `Content-Security-Policy`，且关键页面仍能渲染和 hydration

#### Scenario: 未声明的外部资源
- **WHEN** 页面尝试加载候选策略未允许的外部资源
- **THEN** 浏览器生成 CSP 违规报告，观测模式不阻止该资源加载

### Requirement: CSP 违规报告处理
系统 SHALL 提供同源 CSP 报告入口，并对匿名报告执行请求体大小限制、支持的内容类型校验、字段白名单和 URL 查询参数及片段脱敏。无效或超限报告 MUST 被拒绝且不得回显报告内容。

#### Scenario: 有效违规报告
- **WHEN** 报告入口收到符合 CSP 报告格式且未超过大小限制的请求
- **THEN** 系统记录包含 directive、被阻止来源的脱敏摘要、文档同源路径和发布阶段的结构化事件，并返回无正文成功响应

#### Scenario: 包含敏感 URL 数据
- **WHEN** CSP 报告中的 document URL、blocked URL 或 source file 包含查询参数或片段
- **THEN** 结构化事件不保留查询参数、片段、Cookie、请求头或页面内容

#### Scenario: 无效或超限报告
- **WHEN** 报告入口收到不支持的内容类型、无法解析的内容或超过配置上限的请求体
- **THEN** 系统返回 4xx 响应且不记录未经约束的原始请求体

### Requirement: 内联脚本授权
系统 SHALL 为每个 HTML 文档响应生成不可预测且仅用于该响应的 CSP nonce，主题初始化脚本、公开配置脚本、React Router 运行时脚本和滚动恢复脚本 MUST 使用同一个响应 nonce。最终 `script-src` MUST NOT 依赖全局 `'unsafe-inline'`。

#### Scenario: 单个 SSR 响应
- **WHEN** 服务器渲染包含内联启动脚本的 HTML 文档
- **THEN** CSP 头声明的 nonce 与该文档全部受信内联脚本的 `nonce` 属性一致

#### Scenario: 两个独立请求
- **WHEN** 服务端分别渲染两个 HTML 文档响应
- **THEN** 两个响应使用不同 nonce，且任一响应的 nonce 不能授权另一响应中的脚本

### Requirement: CSP 强制模式
系统 SHALL 仅在候选策略的关键页面自动化测试通过、观测窗口内没有未解释的第一方违规且所有必要来源均经过评审后启用强制 CSP。强制模式 SHALL 使用与已验证候选策略等价的指令集合。

#### Scenario: 满足强制条件
- **WHEN** 发布配置切换为强制模式且所有上线门槛已满足
- **THEN** HTML 响应包含 `Content-Security-Policy`，不再仅依赖 Report-Only 头，且关键页面的渲染、hydration、导航、API 请求和头像加载成功

#### Scenario: 强制策略导致回归
- **WHEN** 发布后探测发现关键页面脚本或必要资源被 CSP 阻止
- **THEN** 操作者可以通过运行时配置将策略回退为观测模式，而无需重新构建应用镜像

### Requirement: 响应头唯一所有权
系统 SHALL 为每个安全头指定一个权威生成层。反向代理和应用不得同时生成不同 CSP；部署入口不得静默放宽或覆盖应用生成的 nonce CSP。

#### Scenario: 经过反向代理的生产响应
- **WHEN** 应用 HTML 响应经过生产反向代理
- **THEN** 客户端仅收到一份有效 CSP 策略，且 nonce、模式和应用生成的文档一致

### Requirement: 自动化与生产验证
系统 SHALL 自动验证安全头值、CSP 指令、nonce 一致性、违规报告脱敏和关键 SSR 页面兼容性，并提供不输出凭据或用户数据的生产响应探测。

#### Scenario: 仓库验证
- **WHEN** 运行 Web 目标测试和类型检查
- **THEN** 测试覆盖观测模式、强制模式、独立 nonce、错误文档和报告入口的拒绝路径

#### Scenario: 发布后探测
- **WHEN** 对生产首页和至少一个交互页面执行发布后检查
- **THEN** 检查确认安全头处于预期阶段、页面可 hydration，且输出不包含 Cookie、认证信息或 CSP 报告原文
