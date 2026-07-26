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

