## ADDED Requirements

### Requirement: 后台管理列表必须处理极端字段长度
后台管理页面 SHALL 为表格和卡片列表中的时间、操作、标识符、标题、描述、预览、错误信息和审计目标定义可读的宽度、截断和换行策略。

#### Scenario: 审计日志长目标不挤压时间和操作
- **WHEN** `/admin/audit` 渲染包含超长 topic title、批量 ID 或 JSON-like target 的审计记录
- **THEN** 时间列 MUST 保持单行可读
- **AND** 操作人、动作、结果列 MUST 保持可辨识
- **AND** target 内容 MUST 截断、换行或进入详情展示，不得挤压整行导致操作不可读

#### Scenario: 用户管理长邮箱和长用户名
- **WHEN** `/admin/users` 渲染长邮箱或长用户名
- **THEN** 邮箱和用户名 MUST 不撑破表格容器
- **AND** 操作按钮 MUST 保持可点击，可通过换行或固定操作列宽度实现

#### Scenario: 巡检长 preview 和错误信息
- **WHEN** `/admin/moderation` 渲染长 preview、长敏感词或长错误信息
- **THEN** 内容 MUST 在卡片内换行或折叠展示
- **AND** 不得造成页面水平溢出到 viewport 外

#### Scenario: 举报、封禁和敏感词长文本
- **WHEN** `/admin/reports`、`/admin/bans` 或 `/admin/keywords` 渲染长描述、长原因、长 IP/CIDR 或长敏感词
- **THEN** 长文本 MUST 在对应卡片或表格内换行、截断或横向滚动
- **AND** 分页和主要操作按钮 MUST 保持可见

### Requirement: 系统设置必须被业务路径消费
后台系统设置 SHALL 对应真实业务读取点；页面不得让管理员保存不会生效的运营策略。

#### Scenario: 注册开关生效
- **WHEN** admin 在 `/admin/settings` 关闭注册
- **THEN** `/signup` 页面 MUST 不再展示本地注册表单
- **AND** `POST /api/v1/auth/local/signup` MUST 返回 403

#### Scenario: 新用户发帖门槛生效
- **WHEN** admin 配置 `new_user_min_hours` 和 `new_user_min_replies`
- **THEN** 创建话题路径 MUST 按该配置判断新用户是否可发帖
- **AND** 不满足条件时 MUST 返回明确错误提示

#### Scenario: 未接入的设置不得显示为可保存生效
- **WHEN** 某个后台设置项没有任何业务读取点
- **THEN** 页面 MUST 隐藏该设置项或标记为未接入不可保存
- **AND** 不得显示保存成功让管理员误以为已生效

### Requirement: 管理概览指标必须来自真实查询
管理概览页 SHALL 使用真实数据库或队列查询展示待处理运营指标，不得使用硬编码占位值。

#### Scenario: 待审举报数真实展示
- **WHEN** 管理员访问 `/admin`
- **THEN** 待审举报数 MUST 来自 `reports.status=pending` 的真实计数
- **AND** 不得硬编码为 0

#### Scenario: 未实现指标不展示为真实数据
- **WHEN** 自动封禁用户数、趋势图或最近审计操作尚未实现真实查询
- **THEN** 页面 MUST 隐藏对应模块或明确标记未接入
- **AND** 不得展示硬编码、空数组伪装成真实结果
