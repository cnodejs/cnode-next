## ADDED Requirements

### Requirement: 用户管理必须区分 block 和 mute

系统 SHALL 为 admin 提供 block/unblock 和 mute/unmute 两组独立用户操作。block 控制目标用户内容在公共接口和公共页面中的可见性；mute 控制目标用户继续新增话题和回复的能力。

#### Scenario: 管理员 block 用户

- **WHEN** admin 对目标用户执行 block
- **THEN** 系统 MUST 将目标用户标记为 block 状态
- **AND** 目标用户创建的话题 MUST 不再出现在公共列表、sidebar、用户聚合和收藏结果中
- **AND** 后端 MUST 写入审计日志

#### Scenario: 管理员 unblock 用户

- **WHEN** admin 对处于 block 状态的目标用户执行 unblock
- **THEN** 系统 MUST 取消目标用户 block 状态
- **AND** 目标用户已有内容恢复按普通公开规则展示
- **AND** 后端 MUST 写入审计日志

#### Scenario: 管理员 mute 用户

- **WHEN** admin 对目标用户执行 mute
- **THEN** 系统 MUST 将目标用户标记为 mute 状态
- **AND** 目标用户 MUST 无法新增话题或回复
- **AND** 目标用户已有内容 MUST 不因 mute 状态自动隐藏
- **AND** 后端 MUST 写入审计日志

#### Scenario: 管理员 unmute 用户

- **WHEN** admin 对处于 mute 状态的目标用户执行 unmute
- **THEN** 系统 MUST 取消目标用户 mute 状态
- **AND** 目标用户恢复新增话题和回复能力，除非仍受其他限制
- **AND** 后端 MUST 写入审计日志

#### Scenario: 历史禁言状态兼容

- **WHEN** 系统部署 block/mute 双状态
- **THEN** 现有 `is_block=true` 用户 MUST 不恢复新增话题或回复能力
- **AND** 迁移或兼容逻辑 MUST 将这些用户视为已 mute，直到 admin 明确 unmute

### Requirement: 用户主页管理员批量删除发言入口

系统 SHALL 在用户主页为 admin 提供删除目标用户所有发言的入口，行为对齐 `nodeclub/web_router.js` 中 `POST /user/:name/delete_all` 的管理员操作。

#### Scenario: 管理员在用户主页删除用户所有发言

- **WHEN** admin 访问任意用户主页
- **THEN** 页面 MUST 显示“删除该用户所有发言”或等价明确文案的操作入口
- **AND** 操作前 MUST 要求确认目标用户和影响范围
- **AND** 成功后 MUST 刷新用户页数据
- **AND** 后端 MUST 写入审计日志

#### Scenario: 非管理员不可批量删除用户发言

- **WHEN** 非 admin 用户访问用户主页或直接调用批量删除接口
- **THEN** 页面 MUST NOT 显示批量删除入口
- **AND** 后端 MUST 返回权限错误
- **AND** 目标用户内容状态保持不变

#### Scenario: 批量删除后公开接口不可见

- **WHEN** admin 成功删除某用户所有发言
- **THEN** 该用户话题 MUST 不再出现在首页、用户话题、用户参与、用户收藏、最新回复和无人回复等公共入口
- **AND** 该用户回复 MUST 不再出现在话题详情回复列表和最新回复模块
