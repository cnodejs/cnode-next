# user-roles Specification

## Purpose
TBD - created by archiving change add-user-roles-and-restricted-jobs. Update Purpose after archive.
## Requirements
### Requirement: 用户角色分配表

系统 SHALL 提供 DB-backed 用户角色分配能力，用于授予非 admin 的运营身份。首批 role key SHALL 固定为 `moderator` 和 `recruiter`，管理员身份 SHALL 继续由代码/env 级别判定，不依赖 `user_roles`。

#### Scenario: user_roles 表字段

- **WHEN** 系统 schema 包含用户角色分配表
- **THEN** 表包含 `id`、`user_id`、`role`、`granted_by`、`reason`、`create_at`、`update_at`、`revoked_at`
- **AND** `user_id` 外键关联 users
- **AND** `granted_by` 可为空或关联授予操作的管理员用户

#### Scenario: 同一用户同一角色只能有一个有效授权

- **WHEN** 一个用户已有 `role='recruiter'` 且 `revoked_at IS NULL` 的记录
- **THEN** 系统 MUST 拒绝或幂等处理重复授予同一有效角色
- **AND** 不得产生两个同时有效的相同角色记录

### Requirement: 角色 key 由代码控制

系统 SHALL 将可授予 role key 限定为代码/shared schema 定义的枚举，管理后台 SHALL NOT 支持新增、删除或修改 role key。

#### Scenario: 管理员授予已知角色

- **WHEN** 管理员为用户授予 `moderator` 或 `recruiter`
- **THEN** 系统保存有效角色记录
- **AND** 写入审计日志

#### Scenario: 拒绝未知角色

- **WHEN** 管理员或客户端提交未知 role key
- **THEN** API MUST 返回校验错误
- **AND** 不得写入 `user_roles`

### Requirement: 管理员角色管理 API

系统 SHALL 在管理员用户管理能力中提供角色查看、授予和撤销 API，所有角色管理 API MUST 要求 admin 权限。

#### Scenario: 查看用户角色

- **WHEN** 管理员查看用户列表或用户详情
- **THEN** 响应包含用户当前有效 roles 数组
- **AND** roles 至少支持 `moderator` 和 `recruiter`

#### Scenario: 授予角色

- **WHEN** 管理员为目标用户授予 `recruiter` 并填写 reason
- **THEN** 系统创建或恢复有效角色记录
- **AND** 审计日志记录授予人、目标用户、role 和 reason

#### Scenario: 撤销角色

- **WHEN** 管理员撤销目标用户的 `recruiter`
- **THEN** 系统设置该角色记录的 `revoked_at`
- **AND** 审计日志记录撤销人、目标用户和 role

#### Scenario: 非管理员不可管理角色

- **WHEN** 非 admin 用户调用角色管理 API
- **THEN** 系统 MUST 返回 403
- **AND** 目标用户角色保持不变

### Requirement: 当前用户会话暴露角色

系统 SHALL 在当前用户/session 数据中暴露有效 roles，供 Web SSR 和客户端决定受限 UI 是否可见。管理员 MAY 在响应中体现为 `is_admin=true`，不要求写入 roles 数组。

#### Scenario: recruiter 登录后获得角色数据

- **WHEN** 拥有有效 `recruiter` 角色的用户访问 Web
- **THEN** root/session loader 数据包含 `roles` 数组并含 `recruiter`
- **AND** 发帖页可基于该角色展示招聘发布入口

#### Scenario: 撤销后角色消失

- **WHEN** 管理员撤销某用户 `recruiter` 角色后该用户重新加载页面
- **THEN** root/session loader 数据不再包含 `recruiter`
- **AND** 该用户不再看到可用的招聘发布入口

### Requirement: 角色能力映射由后端代码强制执行

系统 SHALL 在后端代码中将角色映射到具体能力，不能仅依赖前端显示隐藏。`recruiter` SHALL 授予招聘发布能力；`moderator` SHALL 授予明确范围内的内容治理能力。

#### Scenario: recruiter 具备招聘发布能力

- **WHEN** 用户拥有有效 `recruiter` 角色
- **THEN** 后端权限判定允许其创建 `tab='job'` 的话题
- **AND** 仍需满足普通发帖的登录、mute/block、新用户和限流要求

#### Scenario: moderator 不自动具备招聘发布能力

- **WHEN** 用户只有有效 `moderator` 角色但没有 `recruiter` 角色且不是 admin
- **THEN** 后端 MUST 拒绝其创建 `tab='job'` 的话题
- **AND** 返回招聘发布需要授权的错误
