## ADDED Requirements

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
