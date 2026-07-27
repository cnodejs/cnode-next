## ADDED Requirements

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
