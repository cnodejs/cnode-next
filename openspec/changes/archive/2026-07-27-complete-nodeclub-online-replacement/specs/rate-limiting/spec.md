## MODIFIED Requirements

### Requirement: 限流行为对齐

限流 MUST 与 nodeclub `middlewares/limit.js` 的行为对齐。系统 MUST 通过 Redis INCR + EXPIRE 实现 peruserperday 和 peripperday 限流，将限流中间件挂载到 legacy 等价写入入口，并返回 X-RateLimit headers。

#### Scenario: peruserperday 发帖限流

- **WHEN** 登录用户创建话题
- **THEN** 系统以 `YYYYMMDD + create_topic + loginname` 的等价 key 在 Redis INCR
- **AND** 超过每日限制时返回 403
- **AND** API 路径返回 `{ success: false, error_msg }`
- **AND** Web 路径展示等价错误提示
- **AND** 返回 `X-RateLimit-Limit` 和 `X-RateLimit-Remaining` headers

#### Scenario: peruserperday 回复限流

- **WHEN** 登录用户创建回复
- **THEN** 系统以 `YYYYMMDD + create_reply + loginname` 的等价 key 在 Redis INCR
- **AND** 超过每日限制时返回 403
- **AND** API 路径返回 `{ success: false, error_msg }`
- **AND** Web 路径展示等价错误提示
- **AND** 返回 `X-RateLimit-Limit` 和 `X-RateLimit-Remaining` headers

#### Scenario: peripperday 注册限流

- **WHEN** 某 IP 注册本地账号或创建 GitHub 新账号
- **THEN** 系统以 `YYYYMMDD + create_user_per_ip + IP` 的等价 key 在 Redis INCR
- **AND** 超过每日限制时返回 403
- **WHEN** 处于 development/debug 模式
- **THEN** 允许缺失真实 IP 并使用 dev identity

#### Scenario: 限流中间件必须挂载

- **WHEN** 检查创建话题、创建回复、本地注册、GitHub 新用户创建路由
- **THEN** 每个路由均挂载对应 Redis 限流中间件
- **AND** 不存在只定义 middleware 但未使用的限流路径
