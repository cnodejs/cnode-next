## MODIFIED Requirements

### Requirement: shadcn Form 组件统一渲染

表单字段 MUST 使用当前 Base Nova Field family（`FieldGroup`、`Field`、`FieldLabel`、`FieldDescription`、`FieldError`、适用时的 `FieldSet`/`FieldLegend`）组合 Input、Textarea、Select、NativeSelect、Checkbox、RadioGroup 或 Switch。React Hook Form SHALL 通过 Controller 与 Field composition 集成，resolver 或服务端字段错误 SHALL 由 `FieldError` 自动渲染；无效状态 MUST 同时在 Field 上使用 `data-invalid` 并在控件上使用 `aria-invalid`。页面 MUST NOT 使用裸 `div + Label`、`space-y-*`、手动管理的字段状态/错误元素或页面自定义控件间距替代 Field composition。

#### Scenario: 字段错误自动显示

- **WHEN** 用户提交登录表单且 `pass` 为空或密码字段无效
- **THEN** FieldError 自动展示 shared schema 定义的“密码不能为空”或对应 schema/服务端字段错误，无需手写条件错误元素
- **AND** Field、控件、说明和错误之间保持 Base Nova 定义的可访问关系与间距。

## ADDED Requirements

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
