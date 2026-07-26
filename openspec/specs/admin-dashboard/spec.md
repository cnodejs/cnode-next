# admin-dashboard Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
### Requirement: 管理概览页

系统 MUST 提供管理概览页,展示社区运营数据和待处理事项。

#### Scenario: 统计卡片

- **WHEN** 管理员访问 /admin 概览页
- **THEN** 显示当前值卡片: 用户总数、话题总数、回复总数、今日发帖、今日回复、今日注册、待审举报、巡检命中待处理数

#### Scenario: 7 天趋势图

- **WHEN** 管理员查看概览页趋势图
- **THEN** 显示最近 7 天的折线图,可切换查看: 新增话题数、新增回复数、新增注册用户数、活跃用户数

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

