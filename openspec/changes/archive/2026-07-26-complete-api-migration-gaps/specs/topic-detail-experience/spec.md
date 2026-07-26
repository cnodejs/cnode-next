## ADDED Requirements

### Requirement: 话题详情必须暴露收藏状态控制

话题详情 SHALL 展示当前登录用户是否已收藏该话题，并 SHALL 支持用户不离开页面即可收藏或取消收藏。

#### Scenario: 当前用户未收藏话题

- **WHEN** topic detail data 返回 `is_collect: false`
- **THEN** action 区域展示收藏操作
- **AND** 点击后调用收藏 API
- **AND** 成功完成后刷新或更新可见状态

#### Scenario: 当前用户已收藏话题

- **WHEN** topic detail data 返回 `is_collect: true`
- **THEN** action 区域展示已收藏/取消收藏操作
- **AND** 点击后调用取消收藏 API
- **AND** 成功完成后刷新或更新可见状态

#### Scenario: 匿名用户尝试收藏

- **WHEN** 匿名用户尝试收藏或取消收藏话题
- **THEN** UI 提示登录或展示带说明的禁用态
- **AND** 不展示静默失败的死控件
