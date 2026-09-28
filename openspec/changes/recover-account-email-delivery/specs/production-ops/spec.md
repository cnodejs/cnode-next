## MODIFIED Requirements

### Requirement: 生产邮件路径不得假成功

生产环境中的账号激活、密码找回、回复通知和 @ 通知邮件 SHALL 在模板渲染、SMTP 配置或发送失败时可观测，并且关键账号邮件不得返回误导性的成功响应。可观测数据 MUST 能区分模板渲染失败和 SMTP 发送失败，但 MUST NOT 包含收件地址、邮件正文、密码、retrieve key 或凭据。

#### Scenario: 生产缺少 SMTP 配置

- **WHEN** 非 development 环境缺少 `SMTP_HOST`
- **THEN** 账号激活和密码找回邮件发送 MUST 返回失败或阻止对应请求成功
- **AND** 系统 MUST 记录可观测错误日志
- **AND** 用户不得看到“邮件已发送”的假成功提示

#### Scenario: 邮件模板渲染失败

- **WHEN** 账号激活或密码找回邮件在 SMTP 调用前因模板或 JSX runtime 错误而无法构建
- **THEN** API MUST 返回明确的邮件处理失败响应
- **AND** 日志 MUST 将失败阶段标记为模板渲染
- **AND** 用户资料和 retrieve key 状态 MUST 保持可重试或明确可恢复

#### Scenario: SMTP 发送失败

- **WHEN** SMTP 已配置但发送账号激活或密码找回邮件最终失败
- **THEN** API MUST 返回失败响应
- **AND** 日志 MUST 将失败阶段标记为 SMTP 发送并记录安全的错误分类
- **AND** 用户资料和 retrieve key 状态 MUST 保持可重试或明确可恢复

#### Scenario: development 允许跳过邮件

- **WHEN** `CNODE_ENV=development` 且未配置 SMTP
- **THEN** 系统 MAY 跳过真实发送
- **AND** 必须在日志中明确标记邮件被跳过
