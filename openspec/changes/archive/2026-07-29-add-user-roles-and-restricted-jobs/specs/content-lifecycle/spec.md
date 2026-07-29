## ADDED Requirements

### Requirement: moderator 角色具备受限内容治理能力

系统 SHALL 将 `moderator` 作为非 admin 的社区治理角色。moderator 可以执行明确授权的内容治理操作，但不得拥有管理员的用户角色管理、站点设置、tabs/zones 配置或高风险用户管理权限。

#### Scenario: moderator 可处理内容违规

- **WHEN** 拥有有效 `moderator` 角色的用户处理话题或回复违规内容
- **THEN** 系统允许其执行已授权的内容隐藏、删除、锁定或举报处理动作
- **AND** 后端写入审计日志，记录操作者为 moderator 用户

#### Scenario: moderator 不可管理角色

- **WHEN** moderator 调用用户角色授予或撤销 API
- **THEN** 系统 MUST 返回 403
- **AND** 目标用户角色保持不变

#### Scenario: moderator 不可管理站点配置

- **WHEN** moderator 访问 tabs、zones、站点设置或用户高风险操作 API
- **THEN** 系统 MUST 返回 403
- **AND** 配置和用户状态保持不变

### Requirement: 内容治理权限必须后端校验

系统 SHALL 在后端为 admin 和 moderator 分别校验内容治理权限，前端隐藏或显示后台入口不能作为唯一权限边界。

#### Scenario: 普通用户绕过 UI 调用治理 API

- **WHEN** 非 admin 且非 moderator 用户直接调用内容治理 API
- **THEN** 系统 MUST 返回 403
- **AND** 目标话题或回复状态保持不变

#### Scenario: admin 保持完整治理能力

- **WHEN** admin 调用内容治理 API
- **THEN** 系统按现有管理员权限允许操作
- **AND** 不要求 admin 拥有 `moderator` 角色记录
