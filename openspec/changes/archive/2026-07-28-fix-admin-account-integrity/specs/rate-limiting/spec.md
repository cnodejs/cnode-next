## ADDED Requirements

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
