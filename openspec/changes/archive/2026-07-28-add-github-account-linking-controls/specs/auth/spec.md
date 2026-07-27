## MODIFIED Requirements

### Requirement: GitHub OAuth 流程

系统 MUST 支持 GitHub OAuth 登录，包括已有用户登录、新 GitHub 用户注册、关联老账号和已登录用户绑定当前账号。绑定流程 MUST 保证同一 GitHub ID 只属于一个 CNode 用户，MUST NOT 通过新的 bind intent 隐式覆盖当前用户已绑定的其他 GitHub 身份。

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
- **AND** 仅当目标 GitHub ID 未被其他用户占用时绑定 github_id、githubUsername、githubAccessToken、avatar 到该用户
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

#### Scenario: 已登录用户首次绑定 GitHub

- **WHEN** 已登录用户以 `intent=bind` 完成 GitHub OAuth 且当前账号未绑定、目标 GitHub ID 未被占用
- **THEN** 系统把 GitHub ID、username、access token 和既有流程约定的 avatar 绑定到当前用户
- **AND** 记录不含 token 的绑定成功审计

#### Scenario: 已登录用户重复绑定同一 GitHub

- **WHEN** 当前用户已绑定 GitHub A，又以 `intent=bind` 完成 GitHub A 的 OAuth
- **THEN** 系统按幂等成功处理并可刷新 username、access token 和 avatar
- **AND** 当前用户 ID 和 GitHub ID 的关联不变

#### Scenario: 已登录用户尝试覆盖为其他 GitHub

- **WHEN** 当前用户已绑定 GitHub A，又以 `intent=bind` 完成 GitHub B 的 OAuth
- **THEN** 系统拒绝绑定并返回稳定业务错误
- **AND** GitHub A 的 ID、username、access token 和 avatar 不得被修改
- **AND** GitHub B 的 access token 不得持久化或出现在日志中

#### Scenario: 目标 GitHub 已属于其他用户

- **WHEN** 登录、关联老账号、注册或 bind intent 尝试写入已属于其他 CNode 用户的 GitHub ID
- **THEN** 系统拒绝写入并返回“该 GitHub 账号已绑定到其他用户”
- **AND** 数据库唯一约束阻止并发请求产生重复关联

## ADDED Requirements

### Requirement: 用户安全解绑 GitHub

系统 SHALL 提供 `POST /api/v1/auth/github/unbind` 供已登录用户解绑 GitHub。接口 MUST 验证当前 CNode 密码，MUST 在 GitHub token 已撤销、已失效或不存在后，才以事务清空 `github_id`、`github_username` 和 `github_access_token`。

#### Scenario: 使用当前密码成功解绑

- **WHEN** 已绑定 GitHub 的登录用户提交正确的当前密码且 GitHub token 撤销成功
- **THEN** 系统清空该用户的 GitHub ID、username 和 access token
- **AND** 保留当前 Session、avatar、邮箱、用户名、内容、积分和 API accessToken
- **AND** 写入不含密码或 token 的解绑成功审计

#### Scenario: 当前密码错误或不存在

- **WHEN** 用户提交错误密码，或账号没有可验证的本地密码 hash
- **THEN** 系统拒绝解绑并返回可理解的错误
- **AND** 所有 GitHub 关联字段保持不变
- **AND** 用户可使用现有密码重置流程设置自己知道的密码后重试

#### Scenario: 未登录或未绑定用户请求解绑

- **WHEN** 未登录用户或当前没有 GitHub 绑定的用户调用解绑接口
- **THEN** 系统返回对应的认证或状态错误
- **AND** 不修改任何用户数据

#### Scenario: GitHub token 已失效或不存在

- **WHEN** 当前密码正确且 GitHub 返回 token 已失效或不存在
- **THEN** 系统将远端凭据视为已撤销并继续本地解绑

#### Scenario: GitHub 撤销暂时失败

- **WHEN** 当前密码正确但 GitHub token revoke 因网络、超时、限流或服务端错误无法确认撤销
- **THEN** 系统返回可重试错误
- **AND** 保留全部 GitHub 关联字段，以便后续重试

#### Scenario: 解绑接口防止密码猜测

- **WHEN** 同一用户或来源连续提交解绑密码失败
- **THEN** 系统应用认证类限流策略
- **AND** 响应和审计不得包含密码、GitHub token、OAuth code 或 client secret

### Requirement: GitHub ID 数据库唯一性

系统 MUST 在数据库层约束所有非空 `users.github_id` 唯一，同时允许多个未绑定用户的 `github_id` 为 `NULL`。

#### Scenario: 并发绑定同一 GitHub ID

- **WHEN** 两个用户的并发请求尝试绑定同一非空 GitHub ID
- **THEN** 数据库最多允许一个请求持久化成功
- **AND** 失败请求被转换为稳定业务冲突响应而非暴露 SQL 错误

#### Scenario: 上线前发现历史重复值

- **WHEN** migration 预检发现多个用户拥有相同非空 GitHub ID
- **THEN** migration 中止并报告重复值供人工处理
- **AND** 系统不得自动选择保留或合并账号
