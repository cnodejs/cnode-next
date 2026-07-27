# content-lifecycle Specification

## Purpose
TBD - created by archiving change rewrite-to-cnode-next. Update Purpose after archive.
## Requirements
### Requirement: 话题状态

系统 MUST 用 status 字段管理话题生命周期,替代单一 deleted 布尔值。

#### Scenario: 草稿状态

- **WHEN** 用户保存草稿
- **THEN** 话题 status = draft,仅作者可见
- **AND** 不计入 topic_count,不触发积分
- **AND** 不显示在列表,不参与搜索

#### Scenario: 发布草稿

- **WHEN** 作者将草稿发布
- **THEN** status 变为 published,正常显示
- **AND** 触发积分 +5, topic_count +1

#### Scenario: 巡检隐藏

- **WHEN** 巡检任务发现敏感内容
- **THEN** status 变为 muted,对普通用户不可见
- **AND** 不扣分,仅隐藏

#### Scenario: 删除

- **WHEN** 作者或管理员删除话题
- **THEN** status 变为 deleted
- **AND** 作者 score -5, topic_count -1

### Requirement: 草稿自动保存

系统 MUST 在用户编辑时定时自动保存草稿,防止内容丢失。

#### Scenario: 自动保存触发

- **WHEN** 用户编辑话题内容时,每 30 秒 (可配置)
- **THEN** 自动保存当前内容为草稿
- **AND** 不打断用户编辑

#### Scenario: 恢复草稿

- **WHEN** 用户重新打开编辑器
- **AND** 存在未发布的草稿
- **THEN** 提示是否恢复未保存的内容

### Requirement: 编辑历史

系统 MUST 记录话题和回复的编辑历史,可追溯和回退。

#### Scenario: 保存编辑快照

- **WHEN** 用户或管理员编辑话题
- **THEN** 在 topic_revisions 表保存编辑前的内容快照
- **AND** 记录 editor_id, create_at

#### Scenario: 查看编辑历史

- **WHEN** 管理员或高分用户查看话题
- **THEN** 可查看所有编辑历史版本
- **AND** 可对比不同版本的差异

#### Scenario: 回退到历史版本

- **WHEN** 管理员选择回退到某历史版本
- **THEN** 将话题内容恢复为该版本
- **AND** 保存当前内容为新的历史快照

### Requirement: 内容归档

系统 MUST 自动归档长期无回复的老话题。

#### Scenario: 自动归档

- **WHEN** 定时任务 (Cron) 扫描话题
- **AND** 话题超过配置天数 (如 365 天) 无新回复
- **THEN** 设置 archived = true
- **AND** 话题不可回复 (等同于 lock)
- **AND** 仍可浏览和收藏

#### Scenario: 管理员手动归档

- **WHEN** 管理员对某话题执行归档
- **THEN** 设置 archived = true
- **WHEN** 管理员取消归档
- **THEN** 设置 archived = false

### Requirement: 已有话题编辑必须持久化

作者和管理员 SHALL 能通过 Web 编辑页使用的 legacy-compatible API 编辑已有话题。

#### Scenario: 作者编辑话题

- **WHEN** 话题作者向 `POST /api/v1/topics/update` 提交合法 title、tab、content
- **THEN** API 更新已有话题记录
- **AND** 下一次请求话题详情时返回编辑后的值

#### Scenario: 未授权话题编辑被拒绝

- **WHEN** 非作者且非管理员用户尝试编辑话题
- **THEN** API 返回权限错误
- **AND** 原话题记录保持不变

### Requirement: 已有回复编辑必须持久化

作者和管理员 SHALL 能通过与现有 Web 回复编辑页匹配的 API 路由编辑已有回复。

#### Scenario: 回复编辑页加载回复

- **WHEN** 登录用户打开 `/reply/:id/edit`
- **THEN** `GET /api/v1/reply/:id` 返回表单所需的回复内容和关联话题标识数据
- **AND** 缺失或未授权的回复返回错误，而不是伪造空成功响应

#### Scenario: 作者编辑回复

- **WHEN** 回复作者向 `POST /api/v1/reply/:id/edit` 提交合法内容
- **THEN** API 更新回复内容和更新时间
- **AND** 下一次请求话题详情时返回编辑后的回复

### Requirement: 回复删除必须对齐 nodeclub 线上行为

作者或管理员 SHALL 能删除回复，删除操作必须维护回复状态、作者积分、作者回复数和话题回复数。

#### Scenario: 作者删除自己的回复

- **WHEN** 回复作者删除一条未删除回复
- **THEN** 系统设置 `replies.deleted=true`
- **AND** 作者 score -5
- **AND** 作者 reply_count -1
- **AND** 话题 reply_count -1
- **AND** 计数器不得小于 0

#### Scenario: 管理员删除任意回复

- **WHEN** 管理员删除一条未删除回复
- **THEN** 系统设置 `replies.deleted=true`
- **AND** 回复作者 score -5
- **AND** 回复作者 reply_count -1
- **AND** 话题 reply_count -1

#### Scenario: 无权限删除回复

- **WHEN** 非作者且非管理员用户尝试删除回复
- **THEN** 系统返回权限错误
- **AND** 回复状态、积分和计数器保持不变

#### Scenario: 重复删除回复

- **WHEN** 用户或管理员再次删除已删除回复
- **THEN** 系统返回失败或幂等成功响应
- **AND** 不重复扣减 score、reply_count 或 topic reply_count

### Requirement: 前台帖子和回复管理删除

系统 MUST 允许 admin 和 mod 在帖子详情页执行内容删除动作，删除帖子和删除回复必须保持不同目标粒度，并且删除后公共列表与详情不再展示对应内容。

#### Scenario: 版主或管理员删除帖子
- **WHEN** admin 或 mod 在帖子详情页删除帖子
- **THEN** 系统 MUST 将目标话题标记为已删除
- **AND** 目标话题 MUST 不再出现在公开话题列表
- **AND** 普通用户访问目标话题详情 MUST 得到不存在或不可见响应
- **AND** 系统 MUST 写入审计日志

#### Scenario: 版主或管理员删除回复
- **WHEN** admin 或 mod 在回复项上删除回复
- **THEN** 系统 MUST 只将目标回复标记为已删除
- **AND** 系统 MUST 维护回复作者积分、回复数和话题回复数
- **AND** 该回复 MUST 不再出现在帖子详情回复列表
- **AND** 所属话题 MUST 保持可见，除非另有独立删除帖子动作
- **AND** 系统 MUST 写入审计日志

#### Scenario: 删除动作目标粒度明确
- **WHEN** 管理人员查看帖子详情页的删除按钮
- **THEN** UI MUST 使用“删除帖子”和“删除回复”等明确文案
- **AND** 不得用同一个模糊动作同时表示删除帖子和删除回复

#### Scenario: 非管理人员不可执行前台内容删除
- **WHEN** 非 admin 且非 mod 用户尝试调用前台内容管理删除接口
- **THEN** 系统 MUST 返回权限错误
- **AND** 目标帖子或回复状态保持不变

### Requirement: 公共查询必须遵循内容可见性

公共查询 SHALL 使用统一内容可见性规则：隐藏已删除话题、内部 tab 话题、被 block 用户创建的话题，以及所属话题不可见的回复聚合。mute 用户只受写入限制，不因 mute 自动隐藏历史内容。

#### Scenario: 已删除话题不可公开
- **WHEN** 话题 `deleted=true` 或 `status='deleted'`
- **THEN** 该话题 MUST 不出现在任何公共列表、sidebar、用户聚合或收藏结果中
- **AND** 普通用户访问详情 MUST 得到不存在或不可见响应

#### Scenario: 内部 tab 话题不可公开
- **WHEN** 话题 `tab=dev` 或 `tab=test`
- **THEN** 该话题 MUST 不出现在首页 feed、最新回复、无人回复、用户话题、用户参与或用户收藏中

#### Scenario: 被 block 用户创建的话题不可公开
- **WHEN** 话题作者处于 block 状态
- **THEN** 该话题 MUST 不出现在公共列表、sidebar、用户聚合或收藏结果中
- **AND** 其他用户在该话题下的回复也 MUST 不通过最新回复或用户参与聚合曝光该话题

#### Scenario: 被 mute 用户不能新增内容但历史内容不自动隐藏
- **WHEN** 用户处于 mute 状态且未处于 block 状态
- **THEN** 该用户 MUST 不能新增话题或回复
- **AND** 该用户已有话题 MUST 不因 mute 状态被公共查询隐藏

#### Scenario: 管理后台不受公共过滤影响
- **WHEN** 管理员访问后台话题、用户、巡检或审计页面
- **THEN** 系统 MAY 展示 dev/test、已删除或 block 用户内容用于运营处理
- **AND** 这些后台入口 MUST 继续由后端权限校验保护

