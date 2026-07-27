# auth Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
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

系统 MUST 支持 GitHub OAuth 登录，包括两段式流程：已有用户直接登录，新 GitHub 用户可选择“注册新账号”或“关联老账号”。此流程 MUST 完整实现，不能在 email 已存在时直接失败。

#### Scenario: GitHub 登录 - 已有关联用户

- **WHEN** GitHub callback 返回 profile 且 github_id 已存在用户
- **THEN** 更新用户资料（avatar、githubUsername、githubAccessToken）
- **AND** 设 cookie session
- **AND** 重定向到首页或原始 redirect 目标

#### Scenario: GitHub 登录 - 无关联用户

- **WHEN** GitHub callback 返回 profile 且 github_id 不存在
- **THEN** 系统保存短期 pending GitHub profile 状态
- **AND** 渲染 `/auth/github/new` 选择页面
- **AND** 用户可选择“注册新账号”或“关联老账号”

#### Scenario: GitHub 登录 - 注册新账号

- **WHEN** 用户在 `/auth/github/new` 选择注册新账号
- **THEN** 系统使用 GitHub profile 创建 active=true 的新用户
- **AND** 写入 github_id、githubUsername、githubAccessToken、avatar、email
- **AND** 生成 accessToken
- **AND** 设 cookie session

#### Scenario: GitHub 登录 - 关联老账号

- **WHEN** 用户选择“关联老账号”并输入已有 loginname/password
- **THEN** 系统使用 bcryptjs 验证账号密码
- **AND** 绑定 github_id、githubUsername、githubAccessToken、avatar 到该用户
- **AND** 不覆盖用户原有 loginname
- **AND** 设 cookie session

#### Scenario: GitHub email 已被老账号使用

- **WHEN** GitHub callback 得到的 email 已存在但 github_id 未绑定
- **THEN** 系统进入“关联老账号”选择流程
- **AND** 不直接返回 409 作为最终结果

#### Scenario: GitHub 无公开 email

- **WHEN** GitHub profile 和 emails API 都无法提供 email
- **THEN** 系统展示清晰错误页
- **AND** 提示用户去 GitHub 设置公开邮箱或主邮箱

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

### Requirement: retrieve key 流程必须持久化并单次使用

本地注册激活和密码找回 SHALL 持久化 retrieve key 与 retrieve time，并在成功使用后清理 key，避免激活或重置密码接口返回伪成功。

#### Scenario: 注册保存激活 key

- **WHEN** 用户提交合法注册信息
- **THEN** 后端创建 active=false 的用户
- **AND** 持久化 retrieve_key + retrieve_time
- **AND** 激活邮件包含该 retrieve_key

#### Scenario: 账号激活使用 key

- **WHEN** 用户访问包含 retrieve_key 的激活链接
- **THEN** 后端根据 retrieve_key 找到用户
- **AND** 设置 active=true
- **AND** 清除 retrieve_key/retrieve_time

#### Scenario: 无效激活 key

- **WHEN** 用户访问不存在或已使用的激活 key
- **THEN** 后端返回失败响应
- **AND** 不激活任何用户

#### Scenario: 找回密码保存 reset key

- **WHEN** 用户提交已存在 email 发起密码找回
- **THEN** 后端生成并持久化 retrieve_key + retrieve_time
- **AND** 重置邮件包含该 retrieve_key

#### Scenario: 重置密码校验 key

- **WHEN** 用户通过有效重置链接提交新密码
- **THEN** 后端校验 retrieve_key 和 retrieve_time 时效
- **AND** 更新 pass（bcrypt hash）
- **AND** 清除 retrieve_key/retrieve_time

#### Scenario: 重置 key 过期或无效

- **WHEN** 用户提交过期、不存在或已使用的 retrieve_key
- **THEN** 后端返回失败响应
- **AND** 不修改密码

### Requirement: 刷新 accessToken 必须持久化

用户刷新 API accessToken 时，系统 SHALL 将新 token 写入 `users.access_token`，使返回值可用于后续 API 认证。

#### Scenario: 刷新 token

- **WHEN** 用户调用 `POST /api/v1/user/refresh_token`
- **THEN** 生成新 accessToken（uuid）
- **AND** 持久化到 `users.access_token`
- **AND** 返回 `{ success, accessToken }`
- **AND** 旧 token 不再可用于 API 认证

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
