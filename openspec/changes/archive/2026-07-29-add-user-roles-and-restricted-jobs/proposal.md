## Why

招聘专区已经具备结构化发布能力，但 `tab=job` 当前仍可能被普通发帖路径使用。线上 CNode 的招聘内容具备商业属性，若不限制发布资格，容易成为广告、钓鱼和低质量招聘入口；同时 `dev` / `test` 这类历史内部 tab 已在公开 API 契约中存在语义，但没有纳入 tabs 注册表和管理员可见的配置面。

本变更引入代码控制的用户角色授予能力，用 `recruiter` 角色限制招聘发布，用 `moderator` 角色承接社区治理扩展，并补全 `dev` / `test` tab 的管理员可见边界。

## What Changes

- 新增 DB-backed 用户角色分配能力，角色 key 由代码控制，首批角色为 `moderator` 和 `recruiter`。
- 保持管理员为代码/env 级别最高权限，不迁入角色表。
- 管理员可在用户管理中授予或撤销 `moderator` / `recruiter`，并记录审计日志。
- `tab=job` 的创建能力限制为管理员或拥有 `recruiter` 角色的用户。
- 前端发布页根据当前用户角色控制“招聘”分类可用性；无权限用户不得通过 UI 或 API 发布招聘。
- 将 `dev` / `test` 注册进 tabs 表和后台 tabs 管理页，作为管理员可见、公共用户不可见的内部 tab。
- 版主作为受限治理角色，可执行明确的内容治理操作，但不能管理角色、站点设置、tabs/zones 或高风险用户权限。

## Non-goals

- 不实现完整 RBAC，不新增 `permissions` / `role_permissions` 动态权限映射。
- 不支持后台动态新增或删除角色；角色 key 由代码和 migration 控制。
- 不支持后台动态新增或删除 tabs；新增普通分类仍走代码变更和 migration。
- 不实现企业认证、招聘审核流、付费招聘或公司域名验证。
- 不把管理员从现有代码/env 配置迁移到数据库角色表。

## Capabilities

### New Capabilities

- `user-roles`: 定义 `moderator` / `recruiter` 用户角色、授予/撤销、审计和运行时权限判定。

### Modified Capabilities

- `admin-tab-management`: 补全 `dev` / `test` 内部 tabs 注册表语义，并要求其只对管理员前台可见。
- `jobs-structured-fields`: 增加招聘发布资格要求，`tab=job` 创建必须由管理员或 `recruiter` 执行。
- `content-lifecycle`: 明确 `moderator` 作为非 admin 的内容治理角色可执行的内容操作边界。

## Impact

- 数据库：新增 `user_roles` 表或等价角色分配表；补充 tabs bootstrap/migration 注册 `dev` / `test`。
- API：扩展 session/current-user 数据中的 roles；新增/扩展 admin 用户角色管理 API；`POST /api/v1/topics` 和 topic update 路径增加 `job` 发布资格校验。
- Web：用户管理页展示角色授予/撤销；发帖页按角色控制“招聘”分类；首页 tabs 对 `dev` / `test` 做管理员可见过滤。
- OpenAPI/shared：补充角色 DTO/schema，保持 `tab` 的代码控制枚举，不改为运行时动态字符串。
