## ADDED Requirements

### Requirement: 邮件用户入口必须使用 Web 域名
系统 SHALL 对需要用户点击并进入页面的账号邮件使用 Web 域名生成链接，API 域名只作为前端提交校验请求的服务端入口。

#### Scenario: 密码找回邮件链接
- **WHEN** 用户通过 `/api/v1/auth/local/search_pass` 发起密码找回
- **THEN** 系统 MUST 持久化 `retrieve_key` 和 `retrieve_time`
- **AND** 重置邮件中的链接 MUST 指向 `${APP_WEB_BASE_URL}/reset_pass?key=<retrieve_key>`
- **AND** 链接 MUST NOT 指向 `${APP_API_BASE_URL}/reset_pass`

#### Scenario: 账号激活邮件链接
- **WHEN** 用户提交本地账号注册并需要激活邮箱
- **THEN** 系统 MUST 持久化激活用 `retrieve_key` 和 `retrieve_time`
- **AND** 激活邮件中的链接 MUST 指向 `${APP_WEB_BASE_URL}/active_account?key=<retrieve_key>`
- **AND** Web 页面 MUST 调用 API 完成激活状态写入

### Requirement: 登录页必须提供找回密码入口
本地账号登录页 SHALL 提供可发现的密码找回入口，连接到现有密码找回流程。

#### Scenario: 登录页展示找回密码链接
- **WHEN** 用户访问 `/signin`
- **THEN** 页面 MUST 显示“忘记密码”或等价文案入口
- **AND** 入口 MUST 跳转到 `/search_pass`

#### Scenario: 找回密码入口不影响 GitHub 登录
- **WHEN** 用户访问 `/signin`
- **THEN** 页面 MUST 同时保留 GitHub 登录入口
- **AND** 找回密码入口 MUST 只服务本地邮箱账号密码流程

### Requirement: GitHub OAuth state 必须校验
系统 SHALL 在 GitHub OAuth 发起和回调之间持久化并校验 `state`，避免 callback 被伪造或串用。

#### Scenario: state 校验通过
- **WHEN** 用户从 `/auth/github` 发起 GitHub OAuth 并带着原始 `state` 返回 callback
- **THEN** 系统 MUST 校验 `state` 与发起时保存的值一致
- **AND** 校验通过后才交换 GitHub access token

#### Scenario: state 缺失或不匹配
- **WHEN** GitHub callback 缺少 `state` 或 `state` 与发起时保存的值不一致
- **THEN** 系统 MUST 拒绝继续登录或绑定
- **AND** 不得创建用户、绑定 GitHub 或设置 session cookie

### Requirement: 已登录用户可绑定 GitHub 到当前账号
系统 SHALL 支持已登录用户从设置页发起 GitHub 绑定，并将授权得到的 GitHub identity 绑定到当前 session 用户。

#### Scenario: 设置页展示 GitHub 绑定状态
- **WHEN** 登录用户访问 `/setting`
- **THEN** 页面 MUST 展示当前账号是否已绑定 GitHub
- **AND** 已绑定时 MUST 显示 GitHub 用户名或等价标识
- **AND** 未绑定时 MUST 提供“绑定 GitHub”入口

#### Scenario: 当前用户绑定 GitHub
- **WHEN** 已登录用户从设置页发起 GitHub 绑定并完成 OAuth callback
- **THEN** 系统 MUST 将 GitHub id、GitHub 用户名、GitHub access token 和头像信息写入当前 session 用户
- **AND** MUST NOT 要求用户在 `/auth/github/new` 再次输入已有账号密码
- **AND** 绑定成功后 MUST 返回设置页并显示成功反馈

#### Scenario: GitHub 已绑定到其他账号
- **WHEN** 当前用户尝试绑定的 GitHub id 已属于另一个 CNode 用户
- **THEN** 系统 MUST 拒绝绑定
- **AND** 当前用户原有账号状态 MUST 保持不变
