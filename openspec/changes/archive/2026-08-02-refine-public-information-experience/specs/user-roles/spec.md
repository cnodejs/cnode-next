## ADDED Requirements

### Requirement: 公开身份支持独立多选展示

系统 SHALL 将管理员、版主和猎头建模为相互独立的公开身份，并 SHALL 允许同一用户同时展示多个真实身份。权限继承 MUST NOT 自动产生额外公开身份。

#### Scenario: 管理员同时拥有猎头角色

- **WHEN** 用户 loginname 位于 `APP_ADMINS` 且拥有有效 `recruiter` role，但没有 `moderator` role
- **THEN** 公开身份为 `admin` 和 `recruiter`
- **AND** 不包含 `moderator`，即使管理员具备内容治理能力。

#### Scenario: 用户同时拥有全部身份

- **WHEN** 用户是管理员且同时拥有有效 `moderator` 和 `recruiter` roles
- **THEN** 公开身份包含 `admin`、`moderator` 和 `recruiter`
- **AND** 每个身份最多出现一次。

#### Scenario: 身份 Badge 使用统一文案

- **WHEN** Web 展示公开身份
- **THEN** `admin`、`moderator`、`recruiter` 分别显示为“管理员”“版主”“猎头”
- **AND** 用户详情 Hero 与话题作者卡使用同一身份映射。

### Requirement: 版主身份只来自数据库角色

系统 SHALL 使用 `APP_ADMINS` 判定管理员身份，并使用有效 `user_roles` 的 `moderator`、`recruiter` 判定版主和猎头身份。系统 MUST NOT 读取 `APP_MODERATORS`。

#### Scenario: 计算版主权限与身份

- **WHEN** 用户拥有有效 `moderator` role
- **THEN** 用户公开身份包含 `moderator`
- **AND** 后端授予对应版主能力。

#### Scenario: 管理员继承治理能力

- **WHEN** 管理员没有有效 `moderator` role
- **THEN** 后端仍可授予管理员内容治理能力
- **AND** 公开身份仅因 `APP_ADMINS` 包含 `admin`，不包含 `moderator`。

#### Scenario: 遗留环境变量不影响身份

- **WHEN** 运行环境意外存在 `APP_MODERATORS`
- **THEN** 系统忽略该变量
- **AND** 版主身份和权限只根据有效 `moderator` role 判定，管理员能力继承除外。
