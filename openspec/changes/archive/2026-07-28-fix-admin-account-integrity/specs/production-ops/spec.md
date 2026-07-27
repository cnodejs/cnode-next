## ADDED Requirements

### Requirement: 生产邮件路径不得假成功
生产环境中的账号激活、密码找回、回复通知和 @ 通知邮件 SHALL 在 SMTP 缺失或发送失败时可观测，并且关键账号邮件不得返回误导性的成功响应。

#### Scenario: 生产缺少 SMTP 配置
- **WHEN** 非 development 环境缺少 `SMTP_HOST`
- **THEN** 账号激活和密码找回邮件发送 MUST 返回失败或阻止对应请求成功
- **AND** 系统 MUST 记录可观测错误日志
- **AND** 用户不得看到“邮件已发送”的假成功提示

#### Scenario: SMTP 发送失败
- **WHEN** SMTP 已配置但发送账号激活或密码找回邮件最终失败
- **THEN** API MUST 返回失败响应
- **AND** 用户资料和 retrieve key 状态 MUST 保持可重试或明确可恢复

#### Scenario: development 允许跳过邮件
- **WHEN** `APP_ENV=development` 且未配置 SMTP
- **THEN** 系统 MAY 跳过真实发送
- **AND** 必须在日志中明确标记邮件被跳过

### Requirement: Turnstile 生产配置必须完整
生产环境 SHALL 配置 Cloudflare Turnstile 所需的站点 key 和 secret key，并确保 secret 不暴露到浏览器。

#### Scenario: Turnstile site key 注入前端
- **WHEN** Web 渲染注册、找回密码或高风险写入表单
- **THEN** 页面 MUST 能读取公开的 Turnstile site key
- **AND** site key MAY 暴露给浏览器

#### Scenario: Turnstile secret 仅服务端使用
- **WHEN** API 校验 Turnstile token
- **THEN** API MUST 使用服务端环境变量中的 Turnstile secret 调用 siteverify
- **AND** secret MUST NOT 注入到 Web HTML、前端 bundle 或公开配置

#### Scenario: 缺少 Turnstile 配置时生产拒绝启动或拒绝风险请求
- **WHEN** 非 development 环境缺少 Turnstile 必需配置
- **THEN** 系统 MUST 拒绝依赖 Turnstile 的请求或在启动/健康检查中明确失败
- **AND** 不得绕过人机验证继续接受高风险请求
