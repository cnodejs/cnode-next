# web-ui-forms Specification

## Purpose

定义 Web 表单的状态管理、共享校验、组件渲染、提交反馈、可访问性和设置页账号身份信息展示要求，确保用户输入流程一致、安全且可维护。

## Requirements

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

### Requirement: 设置页必须展示账号身份信息
用户设置页 SHALL 展示当前账号的只读身份信息，并区分可编辑个人资料和不可直接编辑的登录身份字段。

#### Scenario: 设置页显示邮箱
- **WHEN** 登录用户访问 `/setting`
- **THEN** 页面 MUST 显示当前账号邮箱
- **AND** 邮箱 MUST 作为只读身份信息展示
- **AND** 页面 MUST NOT 提供无验证的直接修改邮箱表单

#### Scenario: 设置页显示 GitHub 绑定状态
- **WHEN** 登录用户访问 `/setting`
- **THEN** 页面 MUST 显示当前 GitHub 绑定状态
- **AND** 未绑定账号 MUST 显示绑定入口
- **AND** 已绑定账号 MUST 显示绑定的 GitHub 用户名或等价标识

### Requirement: 设置页卡片内容间距必须一致
设置页所有 Card body SHALL 使用一致的 padding 和文本间距，避免侧栏说明卡片内容贴边。

#### Scenario: 通知说明卡片有 body padding
- **WHEN** `/setting` 渲染通知说明卡片
- **THEN** 卡片 header 与 body MUST 视觉分离
- **AND** body 内容 MUST 有与 API Token 卡片一致的内边距

### Requirement: 设置页账号身份使用统一列表行

设置页“账号身份”区域 SHALL 以统一、响应式的身份列表行展示邮箱和 GitHub，每行包含服务图标、身份名称、当前值或说明、状态 Badge 和适用操作，不得继续以割裂的“GitHub / 已绑定 username”两行文本表达绑定状态。

#### Scenario: 展示已绑定 GitHub

- **WHEN** 用户的 GitHub 已绑定
- **THEN** GitHub 行展示 GitHub 图标、username、`已绑定` Badge 和解绑操作
- **AND** 邮箱行与 GitHub 行使用一致的间距、边界和信息层级

#### Scenario: 展示未绑定 GitHub

- **WHEN** 用户的 GitHub 未绑定
- **THEN** 同一 GitHub 行展示未绑定说明、`未绑定` 状态和“绑定 GitHub”操作
- **AND** 已绑定和未绑定状态不得使用两套不一致的容器结构

#### Scenario: 身份列表响应式布局

- **WHEN** 设置页在桌面宽度展示
- **THEN** 身份值和状态清晰可读，操作在行尾对齐
- **WHEN** 设置页在移动端窄屏展示
- **THEN** 内容和操作可自然换行且不溢出、不遮挡、不截断关键状态

### Requirement: GitHub 解绑使用密码确认表单

GitHub 解绑 SHALL 使用可访问的确认 Dialog，并以 `react-hook-form`、共享 Zod schema、`zodResolver` 和 shadcn Form 收集当前密码。Dialog MUST 说明解绑影响并提供密码重置入口。

#### Scenario: 打开解绑确认

- **WHEN** 用户点击已绑定 GitHub 行的解绑操作
- **THEN** Dialog 展示将无法继续使用该 GitHub 登录的说明
- **AND** 要求输入当前 CNode 密码
- **AND** 提供前往 `/search_pass` 的“忘记密码，先重置密码”入口

#### Scenario: 解绑成功

- **WHEN** 解绑 API 返回成功
- **THEN** 页面用 toast 提示成功、关闭 Dialog 并清空密码字段
- **AND** 刷新账号身份数据，使 GitHub 行显示未绑定状态

#### Scenario: 解绑失败

- **WHEN** 表单校验失败、密码错误或 GitHub 撤销暂时失败
- **THEN** schema 错误通过 `FormMessage` 展示，服务端错误通过 toast 展示
- **AND** Dialog 保持打开且不得把密码回显到页面其他区域或日志

#### Scenario: 解绑提交中

- **WHEN** 解绑请求尚未完成
- **THEN** 确认按钮展示提交中状态并禁止重复提交
- **AND** 取消操作不会发送解绑请求
