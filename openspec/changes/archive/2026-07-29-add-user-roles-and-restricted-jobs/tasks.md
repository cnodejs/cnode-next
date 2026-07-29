## 1. 数据模型和共享契约

- [x] 1.1 在 `packages/db` 新增 `user_roles` Drizzle schema，包含 `user_id`、`role`、`granted_by`、`reason`、`revoked_at` 和时间字段。
- [x] 1.2 新增 PostgreSQL migration 创建 `user_roles` 表、外键和 active role partial unique index。
- [x] 1.3 在 `packages/shared` 增加 role key schema/类型，固定支持 `moderator` 和 `recruiter`。
- [x] 1.4 扩展 `tabs` schema/migration/bootstrap，注册 `dev` / `test` 并增加或等价表达 `scope='admin'` 的访问范围。
- [x] 1.5 更新 seed/bootstrap 逻辑，确保 `dev` / `test` 幂等存在且不删除、不重置业务数据。

## 2. API 角色管理

- [x] 2.1 在 API DB query 层增加查询用户有效 roles、授予角色、撤销角色的函数。
- [x] 2.2 扩展当前用户/session 响应，返回有效 roles 数组并保留现有 admin 判定。
- [x] 2.3 在管理员用户列表或用户详情 API 中返回目标用户有效 roles。
- [x] 2.4 新增或扩展 admin API，支持授予和撤销 `moderator` / `recruiter`。
- [x] 2.5 为角色授予和撤销写入 audit log，包含操作者、目标用户、role 和 reason。
- [x] 2.6 拒绝非 admin 的角色管理请求，并拒绝未知 role key。

## 3. 招聘发布限制

- [x] 3.1 实现后端 `canPostJob` 判定：admin 或有效 `recruiter`。
- [x] 3.2 在 `POST /api/v1/topics` 中对 `tab='job'` 增加强制权限校验。
- [x] 3.3 在 topic update 路径中限制普通 topic 转招聘必须具备 `canPostJob`。
- [x] 3.4 限制非 admin 将招聘 topic 改为普通 tab，避免 `job_meta` 语义不一致。
- [x] 3.5 确保已有招聘话题作者可编辑自己的招聘内容和 `job_meta`，不因后续撤销 `recruiter` 自动失去历史编辑能力。
- [x] 3.6 更新 OpenAPI 生成结果，确保 403 错误语义覆盖招聘发布授权失败。

## 4. Tabs 内部可见性

- [x] 4.1 扩展 tabs API/DTO 返回 `scope` 或等价访问范围字段。
- [x] 4.2 调整 root loader 和首页 tab 渲染逻辑：匿名/普通用户只展示 public tabs，admin 额外展示 `dev` / `test`。
- [x] 4.3 调整 `GET /api/v1/topics?tab=dev|test` 行为，非 admin 保持不公开，admin 可查询内部 tabs。
- [x] 4.4 更新 `/admin/tabs` 页面展示 `scope`，并标记 `dev` / `test` 为管理员专用。
- [x] 4.5 确保后台不能将 `dev` / `test` 改为 public，也不能新增或删除 tabs。

## 5. Web 角色和招聘 UI

- [x] 5.1 在 Web root/session 数据类型中接入 roles。
- [x] 5.2 在发帖页根据 `is_admin` 或 `roles.includes("recruiter")` 控制“招聘”分类可用性。
- [x] 5.3 无招聘发布资格用户不得进入可提交 `JobMetaForm` 的状态；如展示禁用项，文案说明“招聘发布需要授权”。
- [x] 5.4 在管理员用户管理页面展示 roles，并提供授予/撤销 `moderator` / `recruiter` 的操作。
- [x] 5.5 角色操作 UI 使用确认反馈和 toast，避免误授予/误撤销。

## 6. Moderator 治理边界

- [x] 6.1 定义后端 `moderatorRequired` 或等价 staff 权限判定，admin 自动通过。
- [x] 6.2 将明确允许的内容治理 API 接入 moderator 权限，例如处理举报、隐藏/删除违规内容、锁定内容。
- [x] 6.3 确保 moderator 不能访问角色管理、站点设置、tabs/zones 管理和高风险用户操作。
- [x] 6.4 Web 后台入口按 admin/moderator 角色展示对应菜单，后端仍强制校验。

## 7. 验证

- [x] 7.1 增加或更新 API 测试：普通用户创建 `tab='job'` 返回权限错误。
- [x] 7.2 增加或更新 API 测试：`recruiter` 和 admin 可以创建 `tab='job'` 且写入 `job_meta`。
- [x] 7.3 增加或更新 API 测试：授予/撤销角色需要 admin，未知 role 被拒绝。
- [x] 7.4 增加或更新 API/Web 验证：普通用户不可见 `dev` / `test`，admin 可见并可查询。
- [x] 7.5 增加或更新验证：moderator 可执行授权内容治理动作，但不能管理角色或 tabs/zones。
- [x] 7.6 运行 `pnpm typecheck`。
- [x] 7.7 运行 `pnpm lint`。
- [x] 7.8 运行 `pnpm test`。
- [x] 7.9 运行 `pnpm gen:openapi` 并确认生成文件已更新。
- [x] 7.10 运行 `openspec validate add-user-roles-and-restricted-jobs --strict`。
