# Rate Limiting Rules

## ADDED Requirements

### Requirement: 限流行为对齐

限流 MUST 与 nodeclub `middlewares/limit.js` 的行为对齐。系统 MUST 通过 Redis INCR + EXPIRE 实现 peruserperday 和 peripperday 限流,并返回 X-RateLimit headers。

#### Scenario: peruserperday 限流

- **WHEN** 用户发帖或回复时
- **THEN** 以 `YYYYMMDD + loginname` 为 key 在 Redis INCR
- **AND** 超过每日限制 (默认 1000 次) 时返回 403
- **AND** API 路径返回 `{ success: false, error_msg }`
- **AND** Web 路径渲染 notify 页面

#### Scenario: peripperday 限流

- **WHEN** 某 IP 注册账号时
- **THEN** 以 `YYYYMMDD + IP` 为 key 在 Redis INCR
- **AND** 超过每日限制 (默认 1000 次/IP) 时返回 403
- **WHEN** 处于 debug 模式
- **THEN** 不检查 IP (nodeclub 行为)

#### Scenario: 返回 RateLimit headers

- **WHEN** 限流中间件执行后
- **THEN** 返回 `X-RateLimit-Limit` (限制总数) 和 `X-RateLimit-Remaining` (剩余次数) header
