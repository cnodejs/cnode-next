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

表单字段 MUST 使用当前 Base Nova Field family（`FieldGroup`、`Field`、`FieldLabel`、`FieldDescription`、`FieldError`、适用时的 `FieldSet`/`FieldLegend`）组合 Input、Textarea、Select、NativeSelect、Checkbox、RadioGroup 或 Switch。React Hook Form SHALL 通过 Controller 与 Field composition 集成，resolver 或服务端字段错误 SHALL 由 `FieldError` 自动渲染；无效状态 MUST 同时在 Field 上使用 `data-invalid` 并在控件上使用 `aria-invalid`。页面 MUST NOT 使用裸 `div + Label`、`space-y-*`、手动管理的字段状态/错误元素或页面自定义控件间距替代 Field composition。

#### Scenario: 字段错误自动显示

- **WHEN** 用户提交登录表单且 `pass` 为空或密码字段无效
- **THEN** FieldError 自动展示 shared schema 定义的“密码不能为空”或对应 schema/服务端字段错误，无需手写条件错误元素
- **AND** Field、控件、说明和错误之间保持 Base Nova 定义的可访问关系与间距。

### Requirement: 提交流程用 toast 反馈

表单提交成功 MUST 用 `toast.success()` 反馈,失败(非校验错误)MUST 用 `toast.error()` 反馈。MUST NOT 用页面内 `{success && <div>...</div>}` 凑合提示。

#### Scenario: 设置保存成功

- **WHEN** 用户在设置页提交个人资料成功
- **THEN** 弹 `toast.success("设置已保存")`,页面不出现内联 success 文本块

#### Scenario: 登录失败

- **WHEN** 用户提交登录表单且后端返回 `error_msg`
- **THEN** 弹 `toast.error(res.error_msg)`,表单不清空

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

### Requirement: 选择控件使用边界

公开话题创建和编辑表单的分类字段 SHALL 使用品牌化、可访问的 Select 行为；后台以 GET 参数提交的筛选器及高密度简单筛选场景 SHALL 在适合时使用浏览器原生选择行为。两类控件 MUST 保留相同的字段名称、可选值和提交结果。

#### Scenario: 创建话题选择分类

- **WHEN** 用户在公开话题创建页打开分类选择器
- **THEN** 选择器 MUST 展示品牌化触发控件、当前值和可用分类
- **AND** 用户 MUST 能使用键盘打开选项、移动当前选项、确认选择并关闭列表
- **AND** 焦点与已选择分类 MUST 对辅助技术可识别。

#### Scenario: 编辑话题保留分类

- **WHEN** 用户打开已有话题的编辑页
- **THEN** 分类 Select MUST 显示该话题当前分类
- **AND** 用户未更改分类时提交 MUST 保留原值。

#### Scenario: 后台 GET 筛选使用原生选择行为

- **WHEN** 管理员在后台列表使用状态、类型、排序或其他高密度简单筛选器
- **THEN** 页面 SHALL 使用适合 GET 表单提交和浏览器键盘行为的原生选择控件
- **AND** 提交后 URL MUST 包含所选筛选值
- **AND** 返回、刷新和翻页后控件 MUST 恢复 URL 表示的当前值。

### Requirement: 字段名称、提示与错误关联

每个表单控件 SHALL 具有程序化关联的可见 Label；登录、注册和账号表单中的身份、密码及联系字段 MUST 提供正确的 autocomplete 提示。字段错误和补充说明 MUST 与对应控件关联，且无效状态 MUST 可由辅助技术识别。

#### Scenario: 点击 Label 聚焦字段

- **WHEN** 用户点击输入框、Textarea、Select、NativeSelect 或 RadioGroup 的可见 Label
- **THEN** 焦点 MUST 移到对应字段或选择组
- **AND** 辅助技术读取该控件时 MUST 同时读取其名称。

#### Scenario: 登录字段提供 autocomplete

- **WHEN** 登录或注册表单渲染用户名、邮箱、当前密码或新密码字段
- **THEN** 字段 MUST 使用与用途匹配的 autocomplete 语义
- **AND** 密码管理器不得因缺失或错误的字段用途而把新密码填入当前密码字段。

#### Scenario: 校验错误关联到字段

- **WHEN** 用户提交无效字段
- **THEN** 错误信息 MUST 显示在对应字段附近
- **AND** 控件 MUST 暴露无效状态并关联该错误信息
- **AND** 键盘焦点 MUST 移到第一个无效字段或通过等价方式立即定位错误。

### Requirement: 多行输入与互斥选择语义

多行纯文本输入 SHALL 使用品牌 Textarea 行为；一组互斥选项 SHALL 使用单选组语义，并提供组名称、每个选项的名称、选中状态和键盘操作。

#### Scenario: Textarea 保持标签和错误状态

- **WHEN** 用户编辑签名、原因或其他多行纯文本字段
- **THEN** Textarea MUST 保持可见 Label、可辨识 focus 状态和字段错误关联
- **AND** 内容增长时不得遮挡相邻提交操作或产生 viewport 水平溢出。

#### Scenario: 键盘操作互斥选择组

- **WHEN** 键盘用户进入一组互斥选项
- **THEN** 辅助技术 MUST 将其识别为一个有名称的单选组
- **AND** 用户 MUST 能使用方向键在选项间移动并保持仅一个选项被选中。

### Requirement: 表单异步状态播报

表单提交、保存和服务端校验的 pending、success 与 error 状态 SHALL 以可见文本呈现，并 MUST 通过适当 live status 向辅助技术播报；pending 期间 MUST 防止同一提交重复触发。

#### Scenario: 提交进行中

- **WHEN** 用户提交表单且请求尚未完成
- **THEN** 提交控件 MUST 显示进行中状态并禁止重复提交
- **AND** 辅助技术 MUST 收到非打断式的进行中状态播报。

#### Scenario: 服务端返回字段错误

- **WHEN** 服务端返回可归属到具体字段的错误
- **THEN** 页面 MUST 将错误关联到对应字段并保留用户已输入内容
- **AND** 辅助技术 MUST 收到错误状态播报。

#### Scenario: 提交完成

- **WHEN** 保存成功或失败
- **THEN** 页面 MUST 展示并播报对应结果
- **AND** 成功状态不得与仍在进行中的状态同时存在。

### Requirement: 表单密度由标准组件 API 决定

公共表单、后台筛选和表格内联编辑 SHALL 使用 Base Nova 控件的标准 default/small size 与 Field orientation；页面不得通过高度、padding 或圆角 class 建立第三种密度。

#### Scenario: 后台表格内联编辑

- **WHEN** 后台 Table cell 渲染 Input 或 NativeSelect
- **THEN** 控件使用标准 small size 或专门的紧凑 composition
- **AND** 同一行的 Input、Select、Button 和状态控件 MUST 保持一致高度。

#### Scenario: 移动端表单重排

- **WHEN** horizontal 或 responsive Field 在窄屏渲染
- **THEN** label、control、description 和 action MUST 按 Field 的 responsive orientation 自然堆叠
- **AND** 不得发生水平溢出或操作被固定宽度遮挡。
