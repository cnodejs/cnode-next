# web-ui-forms Specification

## MODIFIED Requirements

### Requirement: 表单覆盖清单

以下 route 的表单 MUST 改造为 react-hook-form + zod + shadcn Form:`signin`、`signup`、`topic.create`、`topic.$tid.edit`、`reply.$id.edit`、`setting`(个人资料 + 改密码)、`admin/settings`、`admin/bans`、`admin/keywords`(如有表单)。`topic.create` 和 `topic.$tid.edit` SHALL 在 `tab='job'` 时于右侧渲染 `JobMetaForm` 面板，按 tab 条件渲染。

#### Scenario: signin 改造

- **WHEN** 查看 `routes/signin.tsx`
- **THEN** 文件内出现 `useForm`、`zodResolver`、`<Form>`、`<FormField>`、`<FormControl>`,不再出现 `useState(name)`/`useState(pass)`/`useState(error)`

#### Scenario: setting 两个表单都改造

- **WHEN** 查看 `routes/setting.tsx`
- **THEN** 个人资料表单与修改密码表单都用 hookform,且分别用 `profileSchema` 与 `changePassSchema` 的扩展版

#### Scenario: 发帖页 tab=job 时渲染 JobMetaForm

- **WHEN** 用户在 `routes/topic.create.tsx` 将 tab 选择为 `job`
- **THEN** 右侧面板渲染 `JobMetaForm` 组件，展示招聘结构化字段表单（公司/logo/职位/地点/远程/薪资/经验/技术栈/联系方式）
- **AND** 左侧主表单（标题/tab/正文）不变
- **AND** 提交时 job_meta 与 topic 主体在单次 POST 一起提交

#### Scenario: 发帖页 tab≠job 时渲染发布建议

- **WHEN** 用户在 `routes/topic.create.tsx` 将 tab 选择为非 `job` 值
- **THEN** 右侧面板恢复渲染"发布建议"卡片（与现状一致）
- **AND** 不渲染 `JobMetaForm`

#### Scenario: 编辑页 tab=job 时渲染 JobMetaForm

- **WHEN** 用户在 `routes/topic.$tid.edit.tsx` 编辑 `tab='job'` 的 topic
- **THEN** 右侧面板渲染 `JobMetaForm` 组件，预填现有 `job_meta` 值
- **AND** 提交时 job_meta 与 topic 主体在单次 PUT 一起提交
