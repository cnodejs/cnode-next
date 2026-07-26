## ADDED Requirements

### Requirement: 后台置顶切换
系统 SHALL 允许 `mod` 和 `admin` 在后台对一个或多个话题执行置顶切换操作，切换行为 MUST 与 legacy nodeclub 的 `POST /topic/:tid/top` 保持一致。

#### Scenario: 版主置顶未置顶话题
- **WHEN** `mod` 在后台话题管理页对未置顶话题执行置顶切换
- **THEN** 系统将该话题 `top` 设置为 true
- **AND** 返回操作成功
- **AND** 后台话题列表显示该话题的“置顶”状态

#### Scenario: 管理员取消已置顶话题
- **WHEN** `admin` 在后台话题管理页对已置顶话题执行置顶切换
- **THEN** 系统将该话题 `top` 设置为 false
- **AND** 返回操作成功
- **AND** 后台话题列表不再显示该话题的“置顶”状态

#### Scenario: 批量切换置顶状态
- **WHEN** `mod` 或 `admin` 选择多个话题并执行置顶切换
- **THEN** 系统对每个选中话题分别翻转 `top` 状态
- **AND** 操作不改变话题的 `good`、`lock`、`status`、`deleted`、`reply_count`、`visit_count`、`create_at` 或 `last_reply_at`

#### Scenario: 普通用户不可置顶
- **WHEN** 非 `mod` 且非 `admin` 的用户请求置顶切换接口
- **THEN** 系统拒绝请求并返回权限错误
- **AND** 目标话题的 `top` 状态保持不变

### Requirement: 置顶话题公开展示
系统 MUST 在公开话题列表中优先展示置顶话题，并对置顶话题显示“置顶”标记。

#### Scenario: 首页排序置顶优先
- **WHEN** 用户访问公开话题列表
- **THEN** `top=true` 的话题排在普通话题前面
- **AND** 置顶话题之间按 `last_reply_at` 倒序排序
- **AND** 普通话题之间仍按 `last_reply_at` 倒序排序

#### Scenario: 置顶标记展示
- **WHEN** 公开话题列表返回的话题 `top=true`
- **THEN** Web 列表项显示“置顶”状态标记
