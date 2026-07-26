## ADDED Requirements

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
