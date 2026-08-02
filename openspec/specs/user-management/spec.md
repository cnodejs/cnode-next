# user-management Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
### Requirement: 管理员重置用户密码

系统 MUST 支持管理员快速重置任意用户的密码,无需知道原密码。

#### Scenario: 管理员重置密码

- **WHEN** 管理员发起重置某用户密码的操作
- **THEN** 系统生成新密码 (或随机 token)
- **AND** 用 bcryptjs (cost=10) hash 新密码
- **AND** 更新该用户的 pass 字段
- **AND** 将新密码返回给管理员 (明文, 仅此次显示) 或通过邮件发送给用户
- **AND** 清除该用户的 retrieve_key/retrieve_time (废弃未完成的重置流程)

#### Scenario: 非管理员不可重置他人密码

- **WHEN** 非管理员用户尝试调用重置密码接口
- **THEN** 返回 403

### Requirement: 管理员用户管理面板

系统 MUST 提供管理员用户管理功能，支持搜索、查看和操作用户。后台用户列表 MUST 按安全审计优先原则组织行操作，避免把不同风险等级的操作平铺为同级按钮。默认列表 SHALL 以识别用户、判断状态、查看角色和进入操作为主。

#### Scenario: 用户列表

- **WHEN** 管理员访问用户管理页面
- **THEN** 显示分页用户列表，默认列为用户、状态、角色和操作
- **AND** 用户列合并展示 loginname 和 email
- **AND** 支持按 loginname / email 搜索
- **AND** score、topic_count 和 reply_count 不作为默认独立列展示。

#### Scenario: 用户列表行操作分层

- **WHEN** 管理员查看 `/admin/users` 用户列表
- **THEN** 每个用户行 MUST NOT 直接展示超过 3 个同级操作控件
- **AND** 行操作 MUST 至少提供查看用户和打开管理菜单的入口
- **AND** block、mute、角色、重置密码和删除所有发言等管理动作 MUST 收纳到管理菜单、详情页或等价的二级操作容器中。

#### Scenario: 用户管理菜单按风险和语义分组

- **WHEN** 管理员打开某个用户的管理菜单
- **THEN** 菜单 MUST 按用户治理、角色权限、账号安全和危险操作组织动作
- **AND** block/unblock MUST 位于用户治理分组
- **AND** mute/unmute MUST 位于用户治理分组
- **AND** grant/revoke role MUST 位于角色权限分组
- **AND** reset password MUST 位于账号安全分组
- **AND** delete all user content MUST 位于危险操作分组并使用 destructive 视觉语义。

#### Scenario: block 文案表达为屏蔽用户内容

- **WHEN** 后台用户管理展示 block/unblock 操作或状态
- **THEN** block 操作 SHOULD 使用“屏蔽用户内容”或等价文案
- **AND** unblock 操作 SHOULD 使用“恢复用户内容”或等价文案
- **AND** block 状态 SHOULD 显示为“内容已屏蔽”或等价文案
- **AND** UI MUST 不把 block 和 mute 表达为同一含义。

#### Scenario: 禁言/解禁用户

- **WHEN** 管理员对某用户执行禁言操作
- **THEN** 设置 is_block = true
- **AND** 该用户不可发帖、回复、点赞
- **WHEN** 管理员执行解禁
- **THEN** 设置 is_block = false。

#### Scenario: 删除用户所有发言

- **WHEN** 管理员对某用户执行"删除所有发言"操作
- **THEN** 该用户的所有话题和回复标记为 deleted = true
- **AND** 用户的 topic_count 和 reply_count 相应扣减
- **AND** 操作入口 MUST 使用危险操作语义和二次确认。

### Requirement: 管理员权限判定

系统 MUST 在所有管理操作前验证管理员身份。

#### Scenario: 管理员身份判定

- **WHEN** 判定某用户是否为管理员
- **THEN** 检查 config.admins 中是否包含该用户的 loginname
- **AND** 或检查 user.is_admin 标记
- **AND** 管理员权限不持久化到客户端,每次请求后端验证

### Requirement: 管理员状态写入必须兼容 PostgreSQL

管理员用户和话题状态操作 SHALL 在 PostgreSQL-first runtime 中使用 boolean-compatible values 读写状态列。

#### Scenario: 禁言/解禁用户

- **WHEN** 管理员对某用户执行禁言操作
- **THEN** 设置 is_block = true
- **AND** 该用户不可发帖、回复、点赞
- **WHEN** 管理员执行解禁
- **THEN** 设置 is_block = false

#### Scenario: 删除用户所有发言

- **WHEN** 管理员对某用户执行“删除所有发言”操作
- **THEN** 该用户的所有话题和回复标记为 deleted = true
- **AND** PostgreSQL-backed runtime 中不得使用 integer 值写入 boolean columns

#### Scenario: 管理员切换话题状态

- **WHEN** 管理员执行 top/good/lock/delete 操作
- **THEN** 对应 topic 状态被持久化为 true 或 false
- **AND** 后续列表和详情请求返回更新后的状态

### Requirement: 用户页封禁和解禁

系统 MUST 允许 admin 在用户主页对目标用户执行 block/unblock 操作，操作效果必须与后台用户管理中的禁言/解禁一致。

#### Scenario: 用户页封禁用户
- **WHEN** admin 在用户主页点击封禁用户
- **THEN** 系统 MUST 将目标用户 `is_block` 设置为 true
- **AND** 目标用户 MUST 无法继续发帖、回复或点赞
- **AND** 系统 MUST 写入审计日志

#### Scenario: 用户页解禁用户
- **WHEN** admin 在已封禁用户主页点击解禁用户
- **THEN** 系统 MUST 将目标用户 `is_block` 设置为 false
- **AND** 目标用户恢复普通用户可执行的发帖、回复和点赞能力
- **AND** 系统 MUST 写入审计日志

#### Scenario: 非管理员不可在用户页封禁或解禁
- **WHEN** 非 admin 用户尝试调用用户页封禁或解禁接口
- **THEN** 系统 MUST 返回权限错误
- **AND** 目标用户 `is_block` 状态保持不变

### Requirement: 用户管理必须区分 block 和 mute

系统 SHALL 为 admin 提供 block/unblock 和 mute/unmute 两组独立用户操作。block 控制目标用户内容在公共接口和公共页面中的可见性；mute 控制目标用户继续新增话题和回复的能力。

#### Scenario: 管理员 block 用户
- **WHEN** admin 对目标用户执行 block
- **THEN** 系统 MUST 将目标用户标记为 block 状态
- **AND** 目标用户创建的话题 MUST 不再出现在公共列表、sidebar、用户聚合和收藏结果中
- **AND** 后端 MUST 写入审计日志

#### Scenario: 管理员 unblock 用户
- **WHEN** admin 对处于 block 状态的目标用户执行 unblock
- **THEN** 系统 MUST 取消目标用户 block 状态
- **AND** 目标用户已有内容恢复按普通公开规则展示
- **AND** 后端 MUST 写入审计日志

#### Scenario: 管理员 mute 用户
- **WHEN** admin 对目标用户执行 mute
- **THEN** 系统 MUST 将目标用户标记为 mute 状态
- **AND** 目标用户 MUST 无法新增话题或回复
- **AND** 目标用户已有内容 MUST 不因 mute 状态自动隐藏
- **AND** 后端 MUST 写入审计日志

#### Scenario: 管理员 unmute 用户
- **WHEN** admin 对处于 mute 状态的目标用户执行 unmute
- **THEN** 系统 MUST 取消目标用户 mute 状态
- **AND** 目标用户恢复新增话题和回复能力，除非仍受其他限制
- **AND** 后端 MUST 写入审计日志

#### Scenario: 历史禁言状态兼容
- **WHEN** 系统部署 block/mute 双状态
- **THEN** 现有 `is_block=true` 用户 MUST 不恢复新增话题或回复能力
- **AND** 迁移或兼容逻辑 MUST 将这些用户视为已 mute，直到 admin 明确 unmute

### Requirement: 用户主页管理员批量删除发言入口

系统 SHALL 在用户主页为 admin 提供删除目标用户所有发言的入口，行为对齐 `nodeclub/web_router.js` 中 `POST /user/:name/delete_all` 的管理员操作。

#### Scenario: 管理员在用户主页删除用户所有发言
- **WHEN** admin 访问任意用户主页
- **THEN** 页面 MUST 显示“删除该用户所有发言”或等价明确文案的操作入口
- **AND** 操作前 MUST 要求确认目标用户和影响范围
- **AND** 成功后 MUST 刷新用户页数据
- **AND** 后端 MUST 写入审计日志

#### Scenario: 非管理员不可批量删除用户发言
- **WHEN** 非 admin 用户访问用户主页或直接调用批量删除接口
- **THEN** 页面 MUST NOT 显示批量删除入口
- **AND** 后端 MUST 返回权限错误
- **AND** 目标用户内容状态保持不变

#### Scenario: 批量删除后公开接口不可见
- **WHEN** admin 成功删除某用户所有发言
- **THEN** 该用户话题 MUST 不再出现在首页、用户话题、用户参与、用户收藏、最新回复和无人回复等公共入口
- **AND** 该用户回复 MUST 不再出现在话题详情回复列表和最新回复模块

### Requirement: 管理员不得对自己执行限制或破坏性用户操作
系统 SHALL 阻止管理员对当前登录账号执行会限制自身能力或破坏自身内容的高风险用户管理动作。

#### Scenario: 管理员不能 block 自己
- **WHEN** admin 调用用户 block 接口且目标用户是当前登录 admin
- **THEN** 系统 MUST 返回错误响应
- **AND** 当前 admin 的 `is_block` 状态 MUST 保持不变
- **AND** 系统 MUST NOT 写入成功审计日志

#### Scenario: 管理员不能 mute 自己
- **WHEN** admin 调用用户 mute 接口且目标用户是当前登录 admin
- **THEN** 系统 MUST 返回错误响应
- **AND** 当前 admin 的 `is_muted` 状态 MUST 保持不变
- **AND** 系统 MUST NOT 写入成功审计日志

#### Scenario: 管理员不能删除自己所有发言
- **WHEN** admin 调用删除用户所有发言接口且目标用户是当前登录 admin
- **THEN** 系统 MUST 返回错误响应
- **AND** 当前 admin 的话题和回复删除状态 MUST 保持不变
- **AND** 系统 MUST NOT 扣减当前 admin 的内容计数

#### Scenario: 前端隐藏自操作入口
- **WHEN** admin 在后台用户管理页或用户主页查看自己的账号
- **THEN** 页面 MUST NOT 提供 block、mute 或删除所有发言的可执行入口
- **AND** 后台用户管理菜单 MUST NOT 提供影响当前 admin 自身角色或自身能力的可执行入口
- **AND** 直接调用后端接口仍 MUST 被拒绝

### Requirement: 后台用户搜索结果必须随查询生效

系统 SHALL 允许管理员在后台用户管理页按 loginname 或 email 搜索用户，搜索提交、翻页和管理操作后的重新校验结果 MUST 与当前 URL 查询参数一致。

#### Scenario: 管理员搜索用户
- **WHEN** 管理员在 `/admin/users` 输入搜索词并提交
- **THEN** 页面 MUST 展示匹配当前搜索词的用户列表
- **AND** 列表总数 MUST 反映匹配后的 total
- **AND** 搜索框 MUST 保留当前搜索词

#### Scenario: 搜索结果翻页
- **WHEN** 管理员在带有搜索词的用户列表中翻页
- **THEN** 页面 MUST 保留当前搜索词
- **AND** 下一页数据 MUST 仍按当前搜索词过滤

#### Scenario: 用户管理操作后保留搜索上下文
- **WHEN** 管理员在搜索结果中执行 block、unblock、mute、unmute、角色变更、重置密码或删除所有发言并成功
- **THEN** 页面 MUST 重新加载当前查询上下文的数据
- **AND** MUST NOT 回退到未搜索的用户列表

### Requirement: 后台批量解除禁言

系统 SHALL 允许 admin 在后台用户治理入口中对多个处于 mute 状态的用户执行批量解除禁言。批量解除禁言 MUST 只取消目标用户的 `is_muted` 状态，不得因此取消 `is_block` 或恢复被删除内容。

#### Scenario: 批量解除多个禁言用户
- **WHEN** admin 选择多个处于 mute 状态的用户并确认批量解除禁言
- **THEN** 系统 MUST 将这些用户的 `is_muted` 设置为 false
- **AND** 每个不再受其他限制的用户 MUST 恢复新增话题和回复能力
- **AND** 系统 MUST 写入审计日志，记录操作者、目标用户和处理数量

#### Scenario: 批量解除禁言不恢复内容可见
- **WHEN** admin 对同时处于 mute 和 block 状态的用户执行批量解除禁言
- **THEN** 系统 MUST 取消目标用户的 `is_muted`
- **AND** 系统 MUST 保留目标用户的 `is_block`
- **AND** 目标用户历史内容仍按 block 规则在公共入口不可见

#### Scenario: 批量解除禁言禁止自操作
- **WHEN** admin 提交的批量解除禁言目标包含当前登录账号
- **THEN** 系统 MUST 跳过或拒绝对当前登录账号执行限制状态变更
- **AND** 当前登录账号的 `is_muted` 状态 MUST 保持不变
- **AND** 响应 MUST 让管理员知道存在被跳过或失败的目标

### Requirement: 后台批量恢复内容可见

系统 SHALL 允许 admin 在后台用户治理入口中对多个处于 block 状态的用户执行批量恢复内容可见。批量恢复内容可见 MUST 只取消目标用户的 `is_block` 状态，不得因此取消 `is_muted` 或恢复被删除内容。

#### Scenario: 批量恢复多个用户内容可见
- **WHEN** admin 选择多个处于 block 状态的用户并确认批量恢复内容可见
- **THEN** 系统 MUST 将这些用户的 `is_block` 设置为 false
- **AND** 目标用户未删除且符合公开规则的历史内容 MUST 恢复在公共入口可见
- **AND** 系统 MUST 写入审计日志，记录操作者、目标用户和处理数量

#### Scenario: 批量恢复内容可见不解除禁言
- **WHEN** admin 对同时处于 block 和 mute 状态的用户执行批量恢复内容可见
- **THEN** 系统 MUST 取消目标用户的 `is_block`
- **AND** 系统 MUST 保留目标用户的 `is_muted`
- **AND** 目标用户仍不可新增话题或回复，直到被单独或批量解除禁言

#### Scenario: 批量恢复内容可见禁止自操作
- **WHEN** admin 提交的批量恢复内容可见目标包含当前登录账号
- **THEN** 系统 MUST 跳过或拒绝对当前登录账号执行限制状态变更
- **AND** 当前登录账号的 `is_block` 状态 MUST 保持不变
- **AND** 响应 MUST 让管理员知道存在被跳过或失败的目标

### Requirement: 公开用户页治理操作必须降级收纳

管理员在公开用户详情页执行内容屏蔽、禁言和删除所有发言时，页面 SHALL 将这些操作收纳到单一管理菜单或等价次级容器，不得将多个 destructive 按钮与用户身份资料平铺为同级操作。

#### Scenario: 管理员打开用户治理菜单

- **WHEN** 管理员查看非本人用户主页并打开管理入口
- **THEN** 菜单展示屏蔽或恢复内容、禁言或解除禁言、删除所有发言
- **AND** 屏蔽与禁言使用不同文案表达不同语义
- **AND** 删除所有发言位于危险操作区域。

#### Scenario: 危险操作二次确认

- **WHEN** 管理员从用户主页选择删除所有发言
- **THEN** 系统展示说明影响范围的确认对话框
- **AND** 只有最终确认操作使用 destructive 视觉语义
- **AND** 取消不会修改用户或内容状态。

#### Scenario: 管理员不能治理本人

- **WHEN** 管理员查看自己的用户主页
- **THEN** 页面不提供针对本人的屏蔽、禁言或删除所有发言入口。
