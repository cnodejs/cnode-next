## MODIFIED Requirements

### Requirement: 线性评论流

评论 SHALL 保持由 `create_at` 升序及稳定唯一标识次级升序定义的规范线性时间线，但话题详情页 SHALL 默认按最新优先展示，并允许用户切换为最早优先；评论 SHALL NOT 渲染嵌套评论树。楼层编号 MUST 由规范时间线生成，不得随展示方向改变。

#### Scenario: 回复评论仍保持线性

- **WHEN** 用户回复评论 `#2`
- **THEN** 新评论出现在同一线性列表中
- **AND** 在最新优先时位于已有评论之前，在最早优先时位于已有评论之后
- **AND** 它不会作为评论 `#2` 的嵌套子项出现。

#### Scenario: 迁移回复与新回复顺序稳定

- **WHEN** 同一话题同时包含迁移的历史回复和 PostgreSQL 新增回复
- **THEN** API 按 `create_at` 升序返回所有未删除回复
- **AND** 相同 `create_at` 的回复按稳定唯一标识升序返回
- **AND** 多次请求生成相同规范时间线和楼层顺序。

#### Scenario: 最新优先不改变楼层

- **WHEN** 规范时间线包含 `#1` 至 `#20` 且用户使用最新优先
- **THEN** 话题详情页从 `#20` 至 `#1` 展示回复
- **AND** 每条回复的楼层和稳定 anchor 与最早优先时相同。

## ADDED Requirements

### Requirement: 用户可选择评论展示顺序

话题详情页 SHALL 默认按“最新优先”展示评论，并 SHALL 提供“最新优先”和“最早优先”两个明确命名的排序选项。排序状态 MUST 由 URL query 表达并由 SSR loader 解析，默认排序 SHALL NOT 要求在 URL 中保留 query。

#### Scenario: 无排序参数时默认最新优先

- **WHEN** 用户访问不含回复排序 query 的话题详情页
- **THEN** SSR 首屏从最新到最早展示回复
- **AND** 排序控件显示“最新优先”。

#### Scenario: 用户选择最早优先

- **WHEN** 用户将回复排序方式切换为“最早优先”
- **THEN** URL 包含表达该选择的 query
- **AND** 页面从最早到最新展示回复
- **AND** 刷新、前进后退或分享该 URL 后仍保持最早优先。

#### Scenario: 无效排序参数安全回退

- **WHEN** 话题详情 URL 包含未知回复排序值
- **THEN** 页面按默认的最新优先展示
- **AND** 页面不返回错误或发生 hydration 顺序跳变。

#### Scenario: 移动端和辅助技术操作排序

- **WHEN** 用户在窄屏、键盘导航或屏幕阅读器环境访问回复排序控件
- **THEN** 控件具有可访问名称“回复排序方式”和可理解的两个选项
- **AND** 控件与标题可以换行且不产生横向滚动
- **AND** 回复 DOM 阅读顺序与可见展示顺序一致。

### Requirement: 回复成功后定位新评论

用户成功提交评论后，话题详情页 SHALL 使用创建接口返回的 `reply_id`，在最新 topic 数据完成渲染后定位到新评论。定位 MUST 保留当前回复排序 query，并 MUST 尊重用户的 reduced-motion 偏好。

#### Scenario: 最新优先时从底部编辑器提交

- **WHEN** 用户在回复列表底部编辑器成功创建评论且当前为最新优先
- **THEN** 页面刷新评论数据并将新评论展示在列表顶部
- **AND** 页面定位到该新评论的稳定 anchor
- **AND** 用户不会停留在看不到新评论的编辑器位置。

#### Scenario: 最早优先时提交后保持选择

- **WHEN** 用户在最早优先模式成功创建评论
- **THEN** 页面刷新评论数据并将新评论展示在列表末尾
- **AND** 页面定位到新评论
- **AND** URL 继续表达最早优先。

#### Scenario: 提交定位尊重减少动态效果

- **WHEN** 用户启用 `prefers-reduced-motion: reduce` 并成功创建评论
- **THEN** 页面不使用平滑滚动动画定位新评论
- **AND** 成功反馈和目标评论仍然可感知。

### Requirement: 公共评论 API 排序兼容

`GET /api/v1/topic/{topic_id}` SHALL 继续按 `create_at ASC, id ASC` 返回未删除回复。Web 展示排序 MUST 作为请求级派生数据处理，不得改变公共响应 schema 或按排序方向污染、复制匿名 topic 缓存数据。

#### Scenario: Web 默认最新优先不改变 API

- **WHEN** Web 话题详情页以默认最新优先展示回复
- **THEN** 对应公共 Topic API 仍按规范升序返回回复
- **AND** API 响应 schema 不增加 Web 专用排序或楼层字段。

#### Scenario: 同一缓存数据生成两种展示顺序

- **WHEN** 两个匿名请求分别选择最新优先和最早优先并命中同一 topic 缓存 payload
- **THEN** 每个请求得到其选择的展示顺序
- **AND** 任一请求的派生排序不改变缓存中的规范升序回复数组。
