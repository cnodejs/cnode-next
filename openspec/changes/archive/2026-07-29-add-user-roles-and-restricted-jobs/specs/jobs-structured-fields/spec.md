## ADDED Requirements

### Requirement: 招聘发布需要 recruiter 角色

系统 SHALL 将 `tab='job'` 视为受限招聘发布能力。创建招聘话题的用户 MUST 是管理员或拥有有效 `recruiter` 角色，并且仍需满足普通发帖路径的登录、未禁言/封禁、新用户门槛、Turnstile 和限流要求。

#### Scenario: recruiter 创建招聘话题

- **WHEN** 拥有有效 `recruiter` 角色的用户提交 `{ tab: "job", title, content, job_meta }`
- **THEN** API 继续执行普通发帖校验和 `job_meta` 条件校验
- **AND** 校验通过后创建 topic 和对应 `job_meta`

#### Scenario: admin 创建招聘话题

- **WHEN** 管理员提交 `{ tab: "job", title, content, job_meta }`
- **THEN** API 允许进入招聘创建流程
- **AND** 管理员不需要在 `user_roles` 中拥有 `recruiter` 记录

#### Scenario: 普通用户不能创建招聘话题

- **WHEN** 非 admin 且没有有效 `recruiter` 角色的用户提交 `{ tab: "job", title, content, job_meta }`
- **THEN** API MUST 返回 403 或等价权限错误
- **AND** 不得创建 topic
- **AND** 不得创建 `job_meta`

### Requirement: 招聘编辑保持语义稳定

系统 SHALL 限制普通 topic 与招聘 topic 之间的任意转换，避免 `job_meta` 生命周期和内容语义混乱。

#### Scenario: 招聘作者编辑自己的招聘话题

- **WHEN** 招聘话题作者编辑原本 `tab='job'` 的话题并保持 `tab='job'`
- **THEN** 系统允许作者在未 block/mute 且通过普通编辑权限时更新内容和 `job_meta`
- **AND** 不要求作者当前仍拥有 `recruiter` 角色

#### Scenario: 普通话题改为招聘需要 recruiter

- **WHEN** 作者尝试将非 job 话题编辑为 `tab='job'`
- **THEN** API MUST 要求作者为 admin 或拥有有效 `recruiter` 角色
- **AND** 缺少资格时拒绝更新并保持原话题不变

#### Scenario: 招聘话题改为普通分类受限

- **WHEN** 非 admin 用户尝试将 `tab='job'` 话题改为非 job 分类
- **THEN** API MUST 拒绝该转换或要求管理员处理
- **AND** 不得遗留与普通 topic 不一致的 `job_meta` 状态

### Requirement: 发布页按角色控制招聘分类

Web 发布页 SHALL 根据当前用户 admin 状态和 roles 控制“招聘”分类可用性。无招聘发布资格的用户不得看到可提交的 `job` 表单状态。

#### Scenario: recruiter 看到招聘分类

- **WHEN** 拥有有效 `recruiter` 角色的用户访问 `/topic/create`
- **THEN** 分类选择中展示可用的“招聘”选项
- **AND** 选择后显示 `JobMetaForm`

#### Scenario: 普通用户不能提交招聘分类

- **WHEN** 普通登录用户访问 `/topic/create`
- **THEN** “招聘”分类不显示或以禁用状态显示并说明“招聘发布需要授权”
- **AND** 页面不得提交可成功创建招聘帖的 `tab='job'` 请求

#### Scenario: API 兜底拒绝绕过前端

- **WHEN** 普通用户手工构造 `tab='job'` 请求绕过前端
- **THEN** 后端权限校验 MUST 拒绝请求
