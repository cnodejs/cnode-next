# Authentication Flow

## ADDED Requirements

### Requirement: 本地账号注册流程

系统 MUST 支持本地账号注册,包括密码 hash、激活邮件和密码找回流程。密码 hash MUST 使用 bcryptjs (cost=10),以兼容 nodeclub 迁移过来的老 hash。

#### Scenario: 注册新账号

- **WHEN** 用户提交 loginname + pass + email
- **THEN** 后端 bcrypt hash 密码 (cost=10)
- **AND** 生成 retrieve_key + 发激活邮件
- **AND** 用户 active=false (未激活不能登录)

#### Scenario: 账号激活

- **WHEN** 用户点击激活邮件中的链接 (含 retrieve_key)
- **THEN** 验证 key 有效
- **AND** 设置 active=true
- **AND** 用户可以登录

#### Scenario: 兼容老用户密码

- **WHEN** nodeclub 迁移过来的用户登录
- **THEN** 使用 bcryptjs (cost=10) 验证老 hash
- **AND** 老 hash 可直接验证,用户无需重设密码

### Requirement: 密码找回流程

系统 MUST 提供密码找回功能,通过邮件发送重置链接(retrieve_key),用户通过链接验证后可设置新密码。

#### Scenario: 发起密码找回

- **WHEN** 用户提交 email
- **THEN** 生成 retrieve_key + retrieve_time
- **AND** 发送重置邮件 (含 key 链接)

#### Scenario: 重置密码

- **WHEN** 用户通过重置链接提交新密码
- **THEN** 验证 retrieve_key 和 retrieve_time 时效
- **AND** 更新 pass (bcrypt hash)

### Requirement: GitHub OAuth 流程

系统 MUST 支持 GitHub OAuth 登录,包括两段式流程:已有用户直接登录,新用户可选择"注册新账号"或"关联老账号"。此流程 MUST 完整实现(egg-cnode 丢失了关联老账号的流程)。

#### Scenario: GitHub 登录 - 已有关联用户

- **WHEN** GitHub callback 返回 profile 且 github_id 已存在用户
- **THEN** 更新用户资料 (avatar, githubUsername, githubAccessToken)
- **AND** 设 cookie session
- **AND** 重定向到首页

#### Scenario: GitHub 登录 - 无关联用户

- **WHEN** GitHub callback 返回 profile 且 github_id 不存在
- **THEN** 渲染选择页面 (new_oauth)
- **AND** 用户可选择"注册新账号"或"关联老账号"
- **NOTE** egg-cnode 丢失了此选择流程,直接创建新用户,新项目必须补回

#### Scenario: GitHub 登录 - 关联老账号

- **WHEN** 用户选择"关联老账号"并输入已有账号密码
- **THEN** 验证账号密码
- **AND** 绑定 github_id/githubUsername/githubAccessToken 到该用户
- **AND** 设 cookie session

#### Scenario: GitHub 无公开 email

- **WHEN** GitHub profile 无公开 email
- **THEN** 渲染 no_github_email 错误页
- **AND** 提示用户去 GitHub 设置公开 email

### Requirement: Session cookie

系统 MUST 通过 cookie 维护登录状态,cookie MUST 跨子域 `.cnodejs.org` 生效,使 SSR loader 和 client-side fetch 都能携带认证。

#### Scenario: 登录后设 cookie

- **WHEN** 用户通过本地账号或 GitHub OAuth 登录成功
- **THEN** 设 cookie (名: node_club, 域: .cnodejs.org)
- **AND** cookie 值格式: `<userId>$$$$<...>`
- **AND** signed: true, httpOnly: true, maxAge: 30 天

### Requirement: API accessToken

系统 MUST 为每个用户维护 accessToken,API 请求 MUST 可通过 accesstoken 参数认证。用户 MUST 能通过 `/user/refresh_token` 刷新 token。

#### Scenario: API token 认证

- **WHEN** API 请求带 accesstoken query/body
- **THEN** 查 users.accessToken 验证
- **AND** 验证通过则注入 user 到 ctx.request.user

#### Scenario: 刷新 token

- **WHEN** 用户调用 `POST /api/v1/user/refresh_token`
- **THEN** 生成新 accessToken (uuid)
- **AND** 返回 `{ success, accessToken }`
