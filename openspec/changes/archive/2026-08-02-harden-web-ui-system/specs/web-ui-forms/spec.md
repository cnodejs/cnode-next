## ADDED Requirements

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
