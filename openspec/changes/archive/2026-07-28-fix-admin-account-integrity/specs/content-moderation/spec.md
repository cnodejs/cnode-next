## ADDED Requirements

### Requirement: 敏感词命中次数必须真实
敏感词管理页 SHALL 只展示有真实更新来源的命中次数；若展示 `hit_count`，实时过滤和历史巡检都必须更新该指标。

#### Scenario: 实时过滤更新命中次数
- **WHEN** 用户发帖、编辑话题、回复或编辑回复时命中敏感词并被拒绝
- **THEN** 系统 MUST 增加对应敏感词的命中次数
- **AND** `/admin/keywords` 展示的命中次数 MUST 反映该变化

#### Scenario: 历史巡检更新命中次数
- **WHEN** 巡检任务扫描历史话题或回复并发现敏感词命中
- **THEN** 系统 MUST 增加对应敏感词的命中次数或记录等价可展示统计
- **AND** 后台展示的命中次数 MUST 不长期保持默认值

#### Scenario: 无统计实现时不展示假指标
- **WHEN** 系统没有实现敏感词命中次数统计
- **THEN** `/admin/keywords` MUST 隐藏命中次数列或明确标记为未接入
- **AND** 不得展示永远为 0 或空值的运营指标
