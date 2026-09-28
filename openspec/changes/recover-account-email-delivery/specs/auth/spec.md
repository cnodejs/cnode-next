## ADDED Requirements

### Requirement: 注册邮件失败必须保留可恢复状态

本地注册在用户和激活 key 已持久化后发生邮件模板渲染或 SMTP 发送失败时，系统 MUST 保留未激活账号和可重发状态，并 MUST 返回可区分于普通注册失败的稳定业务错误；系统 MUST NOT 向用户声称账号尚未创建。

#### Scenario: 用户创建后激活邮件失败

- **WHEN** `POST /api/v1/auth/local/signup` 已创建 `active=false` 用户并持久化激活 key，但邮件模板渲染或 SMTP 发送最终失败
- **THEN** API 返回非成功状态和机器可读的 `account_created_email_failed` 错误码
- **AND** 响应提示账号已经创建并可重新发送激活邮件
- **AND** 已持久化用户和激活状态保持可恢复

#### Scenario: 注册全部成功

- **WHEN** 用户、激活 key 和激活邮件均处理成功
- **THEN** API 返回注册成功并提示用户查收激活邮件
- **AND** 用户在点击有效激活链接前保持 `active=false`

#### Scenario: 并发注册触发唯一约束

- **WHEN** 并发请求在预查询后尝试创建相同 loginname 或 email
- **THEN** API 将数据库唯一约束转换为稳定的业务冲突响应
- **AND** API 不得暴露 SQL 错误或返回未分类的 HTTP 500

### Requirement: 未激活账号可以安全重发激活邮件

系统 SHALL 提供 `POST /api/v1/auth/local/resend_activation`，让能够验证现有账号密码的用户轮换激活 key 并重新发送激活邮件。该接口 MUST 应用 Turnstile、来源限流和账号维度限流，且错误响应 MUST NOT 泄露提交的账号是否存在。

#### Scenario: 成功重发激活邮件

- **WHEN** 用户提交未激活账号的有效用户名或邮箱、正确密码和有效 Turnstile token
- **THEN** 系统生成并持久化新的激活 key 和 retrieve time
- **AND** 旧激活 key 立即失效
- **AND** 系统向账号邮箱发送包含新 key 的激活邮件
- **AND** API 返回通用的请求已处理响应

#### Scenario: 账号不存在、密码错误或账号已经激活

- **WHEN** 请求中的账号不存在、密码错误或账号已经激活
- **THEN** API 不发送激活邮件且不修改 retrieve key
- **AND** API 返回不区分上述状态的通用响应

#### Scenario: 重发邮件构建或投递失败

- **WHEN** 已验证的未激活账号已轮换激活 key，但邮件模板渲染或 SMTP 发送失败
- **THEN** API 返回可重试的非成功响应
- **AND** 账号保持未激活且后续重发请求可以再次轮换 key
- **AND** 响应和日志不得包含邮箱、密码或 retrieve key

#### Scenario: 重发请求超过限制

- **WHEN** 同一来源或同一账号在限流窗口内超过允许次数
- **THEN** 系统拒绝继续构建或发送邮件
- **AND** 返回稳定的限流响应和适用的限流 headers

#### Scenario: Web 提供可访问的恢复入口

- **WHEN** 用户在注册部分成功后、登录收到 `account_inactive` 或主动寻找激活帮助
- **THEN** 账号类页面提供可发现的重发激活邮件入口
- **AND** 重发表单具有可访问标签、错误提示、pending 状态和键盘可操作的提交控件
- **AND** 表单在 375px、768px、1280px 和 1440px 视口保持可用且不产生非预期横向滚动

### Requirement: 所有认证入口强制执行账号激活状态

系统 MUST 仅将 `active=true` 的用户视为已认证。本地登录、GitHub 登录或关联、cookie Session 和 API access token MUST 使用一致的激活规则，并返回机器可读的 `account_inactive` 错误或等价重定向状态。

#### Scenario: 本地登录未激活账号

- **WHEN** 用户提交未激活账号的正确用户名或邮箱和密码
- **THEN** API 返回 `account_inactive`
- **AND** 不创建 Session
- **AND** Web 展示重发激活邮件入口

#### Scenario: GitHub 关联未激活老账号

- **WHEN** 用户在 GitHub 关联老账号流程中提交未激活账号的正确密码
- **THEN** 系统拒绝建立 GitHub 绑定和 Session，并引导用户先完成激活
- **AND** 不持久化 GitHub access token

#### Scenario: 已绑定 GitHub 的未激活账号登录

- **WHEN** GitHub callback 找到 `active=false` 的已绑定用户
- **THEN** 系统不创建 Session，并重定向到包含稳定未激活错误状态的账号恢复入口

#### Scenario: 已有 Session 对应未激活账号

- **WHEN** 请求携带的有效签名 cookie 指向 `active=false` 用户
- **THEN** 认证中间件不将该请求视为已登录
- **AND** 受保护接口拒绝该请求

#### Scenario: access token 对应未激活账号

- **WHEN** API 请求提供属于 `active=false` 用户的 access token
- **THEN** 系统不使用该 token 建立认证身份
- **AND** 返回稳定的认证失败响应
