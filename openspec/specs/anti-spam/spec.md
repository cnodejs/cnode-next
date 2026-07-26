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

系统 MUST 记录管理员操作和关键用户行为,可查询追溯。

#### Scenario: 审计日志记录

- **WHEN** 管理员执行操作 (禁言/解禁/删除/置顶/加精/锁定/重置密码/巡检隐藏/处理举报)
- **OR** 用户举报/被举报
- **OR** 系统自动隐藏/自动封禁
- **THEN** 记录: 时间、操作人、动作、目标、结果

#### Scenario: 审计日志查询

- **WHEN** 管理员访问审计日志面板
- **THEN** 可按操作人/目标/时间范围/动作类型筛选
- **AND** 日志至少保留 90 天

