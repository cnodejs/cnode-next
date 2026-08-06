# session-management Specification

## Purpose

TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.

## Requirements

### Requirement: 密码强度校验

系统 MUST 在注册和修改密码时校验密码强度。

#### Scenario: 注册时校验

- **WHEN** 用户提交注册密码
- **THEN** 密码 MUST 至少 8 位
- **AND** MUST 包含字母和数字
- **AND** 不满足时返回错误提示

#### Scenario: 修改密码时校验

- **WHEN** 用户修改密码
- **THEN** 新密码 MUST 通过同样的强度校验

### Requirement: 活跃 Session 管理

系统 MUST 让用户查看自己的活跃 session 并可强制下线。

#### Scenario: 查看活跃 session

- **WHEN** 用户访问设置页的 session 管理部分
- **THEN** 显示活跃 session 列表: IP、设备/UA 摘要、最后活跃时间
- **AND** 标记当前 session

#### Scenario: 强制下线其他 session

- **WHEN** 用户对某个 session 执行「下线」操作
- **THEN** 该 session 失效,不可再用
- **AND** 当前 session 不受影响

#### Scenario: Session 存储

- **WHEN** 用户登录
- **THEN** session 记录存入 Redis, key 包含 session_id + user_id
- **AND** 每次请求更新最后活跃时间
