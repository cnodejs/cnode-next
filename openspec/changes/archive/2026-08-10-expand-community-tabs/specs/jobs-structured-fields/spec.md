## MODIFIED Requirements

### Requirement: 发布页按角色控制招聘分类

Web 发布页 SHALL 根据当前用户 admin 状态和 roles 控制“招聘”分类可用性。无招聘发布资格的用户不得进入可提交的 `job` 表单状态。有权限用户选择 `job` 后，右侧 SHALL 依次显示“发布规范” Card、招聘说明 Card 和 `JobMetaForm`，不得用结构化表单替换前两项。

#### Scenario: recruiter 看到完整招聘发布组合

- **WHEN** 拥有有效 `recruiter` 角色的用户访问 `/topic/create` 并选择 `job`
- **THEN** 分类选择中展示可用的“招聘”选项
- **AND** 右侧先显示“发布规范”和招聘说明
- **AND** 随后显示 `JobMetaForm`

#### Scenario: admin 看到完整招聘发布组合

- **WHEN** admin 访问 `/topic/create` 并选择 `job`
- **THEN** 页面显示与 recruiter 相同顺序的发布规范、招聘说明和 `JobMetaForm`

#### Scenario: 普通用户不能提交招聘分类

- **WHEN** 普通登录用户访问 `/topic/create`
- **THEN** “招聘”分类不显示或以禁用状态显示并说明“招聘发布需要授权”
- **AND** 页面不得提交可成功创建招聘帖的 `tab='job'` 请求

#### Scenario: API 兜底拒绝绕过前端

- **WHEN** 普通用户手工构造 `tab='job'` 请求绕过前端
- **THEN** 后端权限校验 MUST 拒绝请求

## ADDED Requirements

### Requirement: 招聘作为常规首页 Tab

招聘话题 SHALL 作为常规公开 topic 参与 `all` feed，同时保留招聘专区、发布权限和 `job_meta` 结构化能力。

#### Scenario: all 包含公开招聘话题

- **WHEN** 用户请求首页 `tab=all`
- **THEN** 合法、未删除且作者未被 block 的 `job` topic 可以出现在结果中
- **AND** 其回复、收藏、置顶和精选行为与其他公开 topic 一致

#### Scenario: 招聘专区继续使用结构化筛选

- **WHEN** 用户访问招聘专区
- **THEN** 系统继续使用 `job_meta` 提供现有结构化列表和筛选
- **AND** 首页纳入 `job` 不得删除或弱化该专区能力
