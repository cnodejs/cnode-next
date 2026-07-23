## ADDED Requirements

### Requirement: react-hook-form + zod 作为表单标准

所有表单(登录、注册、发帖、回复编辑、设置、管理后台设置)SHALL 用 `react-hook-form` 管理状态,用 `@hookform/resolvers/zod` 接 zod resolver 做校验。MUST NOT 用 `useState` 管理表单字段值。

#### Scenario: 登录表单用 hookform

- **WHEN** 渲染 signin 页
- **THEN** 使用 `useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) })`,`loginSchema` 从 `@cnode/shared` 导入

### Requirement: 复用 packages/shared 的 Zod schemas

表单校验 SHALL 复用 `packages/shared` 已有的 Zod schemas(登录、注册、发帖等)。如 shared schema 与表单字段不完全对应(如确认密码字段),SHALL 用 schema `.extend()` 或 `.merge()` 在表单层扩展,不修改 shared 契约。

#### Scenario: 注册表单扩展确认密码

- **WHEN** 注册表单需要 `confirmPass` 字段
- **THEN** 在 `routes/signup.tsx` 内 `signupSchema.extend({ confirmPass: z.string() }).refine(d => d.pass === d.confirmPass)`,不改 shared 的 `signupSchema`

### Requirement: shadcn Form 组件统一渲染

表单字段 MUST 用 shadcn Form 组件(`Form`/`FormItem`/`FormField`/`FormLabel`/`FormControl`/`FormMessage`)渲染,错误信息由 `FormMessage` 自动从 resolver 错误渲染。MUST NOT 手写 `<input>` + `useState` + 手写错误 `<div>`。

#### Scenario: 字段错误自动显示

- **WHEN** 用户提交登录表单且 `pass` 为空
- **THEN** `FormMessage` 自动渲染 "密码不能为空"(或 shared schema 定义的 message),无需手写 `{error && <div>...</div>}`

### Requirement: 提交流程用 toast 反馈

表单提交成功 MUST 用 `toast.success()` 反馈,失败(非校验错误)MUST 用 `toast.error()` 反馈。MUST NOT 用页面内 `{success && <div>...</div>}` 凑合提示。

#### Scenario: 设置保存成功

- **WHEN** 用户在设置页提交个人资料成功
- **THEN** 弹 `toast.success("设置已保存")`,页面不出现内联 success 文本块

#### Scenario: 登录失败

- **WHEN** 用户提交登录表单且后端返回 `error_msg`
- **THEN** 弹 `toast.error(res.error_msg)`,表单不清空

### Requirement: 表单覆盖清单

以下 route 的表单 MUST 改造为 react-hook-form + zod + shadcn Form:`signin`、`signup`、`topic.create`、`topic.$tid.edit`、`reply.$id.edit`、`setting`(个人资料 + 改密码)、`admin/settings`、`admin/bans`、`admin/keywords`(如有表单)。

#### Scenario: signin 改造

- **WHEN** 查看 `routes/signin.tsx`
- **THEN** 文件内出现 `useForm`、`zodResolver`、`<Form>`、`<FormField>`、`<FormControl>`,不再出现 `useState(name)`/`useState(pass)`/`useState(error)`

#### Scenario: setting 两个表单都改造

- **WHEN** 查看 `routes/setting.tsx`
- **THEN** 个人资料表单与修改密码表单都用 hookform,且分别用 `profileSchema` 与 `changePassSchema` 的扩展版
