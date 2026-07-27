# admin-dashboard Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
### Requirement: 管理概览页

系统 MUST 提供管理概览页，展示社区运营数据和待处理事项。

#### Scenario: 统计卡片
- **WHEN** 管理员访问 /admin 概览页
- **THEN** 显示当前值卡片: 用户总数、话题总数、回复总数、今日发帖、今日回复、今日注册、待审举报、巡检命中待处理数

#### Scenario: 7 天趋势图
- **WHEN** 管理员查看概览页趋势图
- **THEN** 显示最近 7 天的折线图，可切换查看: 新增话题数、新增回复数、新增注册用户数、活跃用户数

#### Scenario: 最近注册用户
- **WHEN** 管理员查看概览页
- **THEN** 显示最近 10 个注册用户 (头像、用户名、注册时间、状态)
- **AND** 点击可跳转用户主页

#### Scenario: 最近发布话题
- **WHEN** 管理员查看概览页
- **THEN** 显示最近 10 条话题 (标题、作者、发布时间、状态)
- **AND** 点击可跳转话题详情

#### Scenario: 待处理事项
- **WHEN** 管理员查看概览页
- **THEN** 显示待审举报数、巡检命中待处理数、自动封禁用户数
- **AND** 巡检命中待处理数 MUST 来自待处理巡检命中队列
- **AND** 每项带跳转链接到对应管理页面

#### Scenario: 最近审计操作
- **WHEN** 管理员查看概览页
- **THEN** 显示最近 10 条审计日志 (时间、操作人、动作、目标、结果)

### Requirement: 注册开关

系统 MUST 支持管理员在系统设置中控制是否开放注册。

#### Scenario: 关闭注册

- **WHEN** 管理员在系统设置中关闭注册开关
- **THEN** /signup 页面不再显示注册表单
- **AND** 访问 /signup 自动跳转 GitHub OAuth 登录
- **AND** POST /auth/local/signup 接口返回 403

#### Scenario: 开放注册

- **WHEN** 管理员开启注册开关
- **THEN** /signup 页面正常显示注册表单
- **AND** 注册接口正常工作

### Requirement: 巡检结果队列

管理后台 MUST 展示敏感词巡检命中队列，支持管理员对话题和回复命中进行复核处理。

#### Scenario: 查看巡检命中
- **WHEN** 管理员访问 `/admin/moderation`
- **THEN** 系统 MUST 展示待处理巡检命中列表
- **AND** 每条命中 MUST 显示目标类型、目标 ID、所属话题、作者、命中词、上下文预览和扫描时间
- **AND** 管理员 MUST 能跳转查看原始话题或回复所在话题

#### Scenario: 处理话题命中
- **WHEN** 管理员确认话题命中违规
- **THEN** 系统 MUST 执行话题删除或隐藏动作
- **AND** 将命中记录标记为已处理
- **AND** 写入审计日志

#### Scenario: 处理回复命中
- **WHEN** 管理员确认回复命中违规
- **THEN** 系统 MUST 执行回复删除动作
- **AND** 将命中记录标记为已处理
- **AND** 写入审计日志

#### Scenario: 标记误报或忽略
- **WHEN** 管理员将巡检命中标记为误报或忽略
- **THEN** 系统 MUST 保留原内容可见
- **AND** 将命中记录从待处理队列移除
- **AND** 写入审计日志

### Requirement: 巡检任务管理

管理后台 MUST 展示巡检扫描任务状态，并允许管理员对任务进行基础控制。

#### Scenario: 查看扫描任务状态
- **WHEN** 管理员查看巡检任务列表
- **THEN** 系统 MUST 展示任务状态、扫描范围、触发原因、已扫描数量、命中数量、游标、开始时间、结束时间和错误信息

#### Scenario: 手动创建扫描任务
- **WHEN** 管理员手动发起全量或增量扫描
- **THEN** 系统 MUST 创建扫描任务
- **AND** 管理员 MUST 能选择扫描话题、回复或全部内容

#### Scenario: 暂停和恢复扫描任务
- **WHEN** 管理员暂停或恢复扫描任务
- **THEN** 系统 MUST 更新任务状态
- **AND** worker MUST 按更新后的状态继续或停止扫描

### Requirement: 后台列表分页访问

系统 MUST 在后台管理中为完整数据列表提供分页访问，避免管理员只能查看接口固定返回的最近记录。

#### Scenario: 话题管理分页

- **WHEN** 管理员或版主访问后台话题管理页
- **THEN** 页面显示分页后的话题列表
- **AND** 可以通过页码访问超过当前第一页的数据

#### Scenario: 用户管理分页

- **WHEN** 管理员访问后台用户管理页
- **THEN** 页面显示分页后的用户列表
- **AND** 可以通过页码访问超过当前第一页的数据

#### Scenario: 内容治理列表分页

- **WHEN** 管理员访问举报队列、敏感词管理或封禁管理页
- **THEN** 页面显示分页后的管理列表
- **AND** 翻页时保留当前筛选或搜索条件

#### Scenario: 审计日志分页

- **WHEN** 管理员访问审计日志页
- **THEN** 页面显示分页后的审计日志
- **AND** 可以访问历史审计记录

### Requirement: 后台话题置顶管理权限

系统 MUST 在后台话题管理中允许 `mod` 和 `admin` 执行置顶/取消置顶，并且不得因此扩大其他高风险话题管理动作的权限边界。

#### Scenario: 版主访问话题管理置顶操作

- **WHEN** `mod` 访问后台话题管理页
- **THEN** 系统允许其查看话题列表中的置顶状态
- **AND** 系统提供置顶切换操作入口

#### Scenario: 管理员访问话题管理置顶操作

- **WHEN** `admin` 访问后台话题管理页
- **THEN** 系统允许其查看话题列表中的置顶状态
- **AND** 系统提供置顶切换操作入口

#### Scenario: 其他话题管理动作权限不被扩大

- **WHEN** `mod` 在话题管理页执行非置顶的管理动作
- **THEN** 系统 MUST 按该动作既有权限要求进行校验
- **AND** 不得仅因为 `mod` 可置顶而允许其执行删除等 admin-only 操作

### Requirement: 前台管理动作入口

系统 MUST 在前台用户页、帖子详情页和回复项中向有权限的管理人员展示就地管理动作入口，并且所有动作必须通过后端管理 API 校验权限和写入审计日志。

#### Scenario: 管理员在用户页看到用户管理入口
- **WHEN** admin 访问任意用户主页
- **THEN** 页面 MUST 显示 block 或 unblock 操作入口
- **AND** 当前用户状态 MUST 决定显示封禁或解禁动作

#### Scenario: 版主或管理员在帖子页看到内容管理入口
- **WHEN** admin 或 mod 访问帖子详情页
- **THEN** 页面 MUST 显示删除帖子、置顶切换和高亮切换入口
- **AND** 普通登录用户和匿名用户 MUST NOT 看到这些管理入口

#### Scenario: 版主或管理员在回复项看到删除入口
- **WHEN** admin 或 mod 查看帖子详情页中的回复列表
- **THEN** 每条未删除回复 MUST 提供删除回复入口
- **AND** 删除回复入口 MUST 明确表示目标是回复而不是整帖

#### Scenario: 管理动作反馈和审计
- **WHEN** 管理人员执行任意前台管理动作
- **THEN** 系统 MUST 显示成功或失败反馈
- **AND** 成功后 MUST 刷新当前页面数据
- **AND** 后端 MUST 写入包含操作人、动作和目标对象的审计日志

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
