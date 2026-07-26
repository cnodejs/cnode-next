## MODIFIED Requirements

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

#### Scenario: GitHub 无可用 email

- **WHEN** GitHub profile 和 emails API 都无法提供 email
- **THEN** 系统展示清晰错误页
- **AND** 提示用户去 GitHub 设置公开邮箱或主邮箱
