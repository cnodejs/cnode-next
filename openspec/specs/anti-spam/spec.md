# anti-spam Specification

## Purpose

TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.

## Requirements

### Requirement: 新用户发帖限制

系统 MUST 限制新用户发帖,需满足条件后方可发帖,降低垃圾内容风险。

#### Scenario: 新用户不可发帖

- **WHEN** 用户注册时间未满配置时长 (如 24h)
- **AND** 用户回复数未达配置阈值 (如 3 条)
- **THEN** 用户不可发帖
- **AND** 返回提示 "新用户需等待 N 小时或回复 N 条后可发帖"

#### Scenario: 新用户可回复

- **WHEN** 新用户尝试回复
- **THEN** 允许回复 (回复是低风险操作)
- **AND** 回复仍受 peruserperday 限流

#### Scenario: 条件满足后可发帖

- **WHEN** 用户注册满 24h 或回复满 3 条
- **THEN** 用户可正常发帖

### Requirement: 用户举报

系统 MUST 支持用户举报话题或回复,管理员可审核处理。

#### Scenario: 提交举报

- **WHEN** 用户点击「举报」并选择类型 (垃圾广告/人身攻击/不相关内容/其他)
- **AND** 可选填写补充说明
- **THEN** 创建举报记录,进入管理员举报队列

#### Scenario: 自动隐藏阈值

- **WHEN** 同一内容被 N 人举报 (可配置, 如 3 人)
- **THEN** 自动标记为 muted (对普通用户不可见)
- **AND** 通知管理员审核

#### Scenario: 管理员处理举报

- **WHEN** 管理员审核举报
- **THEN** 可确认违规 (隐藏/删除内容 + 通知作者) 或驳回 (内容恢复)
- **WHEN** 管理员判定恶意举报
- **THEN** 举报者可被扣分或限制举报权限

### Requirement: 人机验证 (Cloudflare Turnstile)

系统 MUST 在高风险操作时触发人机验证。

#### Scenario: 注册时触发

- **WHEN** 用户提交注册表单
- **THEN** 必须通过 Cloudflare Turnstile 验证
- **AND** 后端验证 Turnstile token

#### Scenario: 密码找回时触发

- **WHEN** 用户提交密码找回表单
- **THEN** 必须通过 Turnstile 验证

#### Scenario: 风险行为触发

- **WHEN** 新用户发帖 或 短时间连续发帖/回复
- **THEN** 触发 Turnstile 验证

### Requirement: 渐进式封禁

系统 MUST 支持渐进式封禁,从警告到永久封禁。

#### Scenario: 警告

- **WHEN** 用户被举报确认 1 次或巡检命中 1 条内容
- **THEN** 发送警告通知,无功能限制

#### Scenario: 临时禁言

- **WHEN** 用户累计违规达阈值
- **THEN** 设置 ban_until 为当前时间 + 7 天 (或 30 天,逐级递增)
- **AND** 禁言期间不可发帖、回复、点赞
- **AND** 禁言期满自动恢复

#### Scenario: 永久封禁

- **WHEN** 用户多次临时禁言后仍违规
- **THEN** 设置 is_block = true,永久封禁
- **AND** 管理员可手动永久封禁

### Requirement: IP 封禁

系统 MUST 支持按 IP 封禁,阻止特定 IP 的访问。

#### Scenario: 管理员封禁 IP

- **WHEN** 管理员添加 IP 到封禁列表
- **THEN** 该 IP 的请求返回 403
- **AND** 支持封禁单个 IP 或 IP 段 (CIDR)

#### Scenario: 自动 IP 封禁

- **WHEN** 某 IP 在短时间内注册多个被禁账号
- **THEN** 自动加入 IP 封禁列表 (可配置阈值)

### Requirement: 操作审计日志

系统 MUST 记录管理员操作、系统巡检动作和关键用户行为，可查询追溯。

#### Scenario: 审计日志记录

- **WHEN** 管理员执行操作 (禁言/解禁/删除/置顶/加精/锁定/重置密码/巡检确认删除/巡检误报/巡检忽略/处理举报)
- **OR** 用户举报/被举报
- **OR** 系统创建巡检扫描任务、完成巡检扫描任务或自动隐藏内容
- **THEN** 记录: 时间、操作人或系统标识、动作、目标、结果

#### Scenario: 巡检处理审计

- **WHEN** 管理员处理巡检命中
- **THEN** 审计日志 MUST 记录命中 ID、目标类型、目标 ID、处理动作和处理结果
- **AND** 对回复命中 MUST 记录所属话题 ID

#### Scenario: 审计日志查询

- **WHEN** 管理员访问审计日志面板
- **THEN** 可按操作人/目标/时间范围/动作类型筛选
- **AND** 日志至少保留 90 天

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
