# rate-limiting Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
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

#### Scenario: peripperday 限流

- **WHEN** 某 IP 注册本地账号或创建 GitHub 新账号
- **THEN** 系统以 `YYYYMMDD + create_user_per_ip + IP` 的等价 key 在 Redis INCR
- **AND** 超过每日限制时返回 403
- **WHEN** 处于 development/debug 模式
- **THEN** 允许缺失真实 IP 并使用 dev identity

#### Scenario: 返回 RateLimit headers

- **WHEN** 限流中间件执行后
- **THEN** 返回 `X-RateLimit-Limit` (限制总数) 和 `X-RateLimit-Remaining` (剩余次数) header

#### Scenario: 限流中间件必须挂载

- **WHEN** 检查创建话题、创建回复、本地注册、GitHub 新用户创建路由
- **THEN** 每个路由均挂载对应 Redis 限流中间件
- **AND** 不存在只定义 middleware 但未使用的限流路径

### Requirement: 后台限流配置必须被写入路径读取
系统 SHALL 让后台系统设置中的发帖和回复限流配置影响对应写入路径，而不是只保存配置值。

#### Scenario: 发帖限流读取后台配置
- **WHEN** admin 在系统设置中修改 `rate_topic`
- **THEN** 创建话题限流 MUST 使用最新配置值作为每日上限
- **AND** 超过该上限时 MUST 返回 403 和 RateLimit headers

#### Scenario: 回复限流读取后台配置
- **WHEN** admin 在系统设置中修改 `rate_reply`
- **THEN** 创建回复限流 MUST 使用最新配置值作为每日上限
- **AND** 超过该上限时 MUST 返回 403 和 RateLimit headers

#### Scenario: 配置缺失时使用安全默认值
- **WHEN** `site_settings` 中不存在 `rate_topic` 或 `rate_reply`
- **THEN** 系统 MUST 使用代码默认上限
- **AND** 不得因为配置缺失导致写入路径报错
