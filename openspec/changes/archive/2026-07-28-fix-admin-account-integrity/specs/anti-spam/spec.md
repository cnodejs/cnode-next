## ADDED Requirements

### Requirement: 举报功能必须形成前后台闭环

系统 SHALL 支持用户从公开内容页提交话题或回复举报，并在后台举报队列中展示可处理的目标摘要。

#### Scenario: 用户举报话题

- **WHEN** 登录用户在话题详情页举报当前话题
- **THEN** 系统 MUST 创建 `target_type=topic`、`target_id=<topic id>` 的举报记录
- **AND** 后台举报队列 MUST 展示目标话题标题、目标链接、举报类型、举报说明和举报人数量

#### Scenario: 用户举报回复

- **WHEN** 登录用户在回复项上举报该回复
- **THEN** 系统 MUST 创建 `target_type=reply`、`target_id=<reply id>` 的举报记录
- **AND** 后台举报队列 MUST 展示所属话题链接和回复目标摘要

#### Scenario: 后台处理举报

- **WHEN** 管理员或版主在 `/admin/reports` 确认或驳回举报
- **THEN** 系统 MUST 更新举报状态
- **AND** 后台列表 MUST 不出现空标题、`/topic/undefined` 链接或永远为 `0 人举报` 的错误字段
- **AND** 系统 MUST 写入审计日志

### Requirement: IP 封禁必须支持 UI 操作和 CIDR 匹配

系统 SHALL 允许管理员在后台新增和移除 IP 封禁规则，并在请求处理中支持单 IP 与 CIDR 网段匹配。

#### Scenario: 管理员新增单 IP 封禁

- **WHEN** admin 在 `/admin/bans` 添加单个 IP
- **THEN** 系统 MUST 保存规则
- **AND** 来自该 IP 的后续请求 MUST 返回 403

#### Scenario: 管理员新增 CIDR 封禁

- **WHEN** admin 在 `/admin/bans` 添加合法 CIDR 网段
- **THEN** 系统 MUST 保存规则
- **AND** 来自该网段内 IP 的后续请求 MUST 返回 403

#### Scenario: 管理员移除 IP 封禁

- **WHEN** admin 在 `/admin/bans` 移除某条 IP 或 CIDR 规则
- **THEN** 系统 MUST 删除该规则
- **AND** 后续请求 MUST 不再因该规则被拒绝

#### Scenario: 拒绝无效 IP 规则

- **WHEN** admin 提交无效 IP 或 CIDR 字符串
- **THEN** 系统 MUST 返回错误
- **AND** 不得保存无效封禁规则

### Requirement: 反垃圾承诺必须完整落地

系统 SHALL 在本变更中实现已承诺的核心反垃圾能力，包括新用户发帖限制、Turnstile、人为举报自动隐藏和渐进封禁。

#### Scenario: 新用户发帖限制落地

- **WHEN** 当前 spec 声明新用户发帖限制为 MUST
- **THEN** 创建话题路径 MUST 按配置的注册时长和回复数阈值进行限制
- **AND** 未满足条件的新用户 MUST 无法发帖

#### Scenario: 注册和找回密码触发 Turnstile

- **WHEN** 用户提交注册或密码找回表单
- **THEN** 页面 MUST 要求通过 Cloudflare Turnstile
- **AND** 后端 MUST 调用 Turnstile siteverify 校验 token
- **AND** 校验失败时 MUST 拒绝请求且不创建用户、不生成 retrieve key

#### Scenario: 风险发帖或高频写入触发 Turnstile

- **WHEN** 新用户发帖或用户短时间连续发帖/回复达到风险阈值
- **THEN** 系统 MUST 要求 Turnstile token
- **AND** 后端校验失败时 MUST 拒绝写入

#### Scenario: 举报阈值自动隐藏

- **WHEN** 同一话题或回复被达到配置阈值的不同用户举报
- **THEN** 系统 MUST 自动隐藏目标内容或将其从公共入口移除
- **AND** 系统 MUST 写入审计日志并保留后台复核入口

#### Scenario: 渐进封禁

- **WHEN** 用户的举报确认或巡检确认违规次数达到配置阈值
- **THEN** 系统 MUST 按警告、临时禁言、永久 block/mute 的顺序执行渐进处罚
- **AND** 临时禁言到期后 MUST 自动恢复新增内容能力，除非用户仍处于更高等级限制
