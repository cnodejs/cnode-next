## ADDED Requirements

### Requirement: Admin 模板必须提供后台宽屏内容区
Admin routes SHALL 使用比前台 feed 更宽的后台 shell，以承载数据表格和运营工具，同时保留表单类内容的可读宽度。

#### Scenario: 后台 shell 使用宽屏容器
- **WHEN** 管理员在桌面端访问 `/admin/topics`、`/admin/users`、`/admin/audit` 或 `/admin/moderation`
- **THEN** admin shell 的主内容容器 MUST 使用宽屏上限，例如 `max-w-screen-2xl` 或等价宽度
- **AND** 左侧导航和主内容区域 MUST 保持 `min-w-0` 以允许内部滚动和截断生效

#### Scenario: 表单类后台页面不过度拉宽
- **WHEN** 管理员访问 `/admin/settings` 或其他表单为主的后台页面
- **THEN** 页面 SHALL 仍使用 admin shell 对齐
- **AND** 表单卡片内容 MUST 使用内部宽度或 grid 控制，避免输入框横跨整个宽屏容器

#### Scenario: 表格横向滚动与列宽协同
- **WHEN** 管理表格的内容总宽度超过主内容区域
- **THEN** 表格容器 MUST 提供横向滚动
- **AND** 页面 MUST 为关键列配置最小宽度或换行策略，避免浏览器无限压缩列宽
