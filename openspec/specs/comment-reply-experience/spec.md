# comment-reply-experience Specification

## Purpose

定义话题详情页评论/回复体验的展示、引用、交互和可用性要求，确保评论流保持论坛式线性阅读、回复目标清晰、控件行为真实可用。

## Requirements

### Requirement: 评论头像归一化

评论作者 SHALL 使用可工作的 avatar URL 或确定性的品牌 fallback，数据通过 API/data shaping 的统一 `avatar_url` 字段提供。

#### Scenario: 缺失头像 fallback

- **WHEN** 评论作者没有可用 avatar URL
- **THEN** 评论渲染确定性 fallback avatar，且看起来不是坏图。

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

### Requirement: 评论楼层编号

每条评论 SHALL 展示楼层编号或稳定 anchor 标识，用于论坛式引用和直接链接。

#### Scenario: 评论 anchor

- **WHEN** 评论被展示
- **THEN** 它包含可见或可访问的楼层标识，例如 `#1`
- **AND** 该评论可通过 anchor 链接。

### Requirement: 定向回复编辑器

触发评论回复 action SHALL 打开定向回复编辑器，展示回复目标、支持取消，并在提交时包含 `reply_id`。当回复编辑器不在当前 viewport 内时，系统 SHALL 滚动到回复编辑器并聚焦 Markdown 输入区。

#### Scenario: 回复 action 打开编辑器

- **WHEN** 用户点击某条评论上的“回复”
- **THEN** 回复编辑器显示“正在回复 @<loginname>”或等价目标上下文
- **AND** 提交时发送目标评论 id 作为 `reply_id`
- **AND** 页面滚动到回复编辑器并聚焦 Markdown 输入区。

#### Scenario: 添加回复 action 定位编辑器

- **WHEN** 登录用户点击回复区标题旁的“添加回复”
- **THEN** 页面滚动到通用回复编辑器
- **AND** Markdown 输入区获得焦点
- **AND** 如先前存在定向回复目标，则目标状态被清除。

#### Scenario: 长评论列表中回复按钮有可见反馈

- **WHEN** 当前话题存在大量评论且回复编辑器位于列表底部
- **THEN** 点击“添加回复”或单条“回复”后用户会被带到可输入位置
- **AND** 不得只在视口外更新状态导致按钮看起来无效果。

### Requirement: 定向回复引用预览

带有 `reply_id` 的评论 SHALL 在目标数据可用时展示单层引用预览。

#### Scenario: 引用预览展示目标

- **WHEN** 评论指向另一条评论且目标摘要可用
- **THEN** 该评论展示目标作者和纯文本摘要，并链接到目标 anchor。

#### Scenario: 被删除目标

- **WHEN** 定向评论引用了缺失或已删除的目标
- **THEN** 引用预览展示“原评论已删除”状态，或在不破坏布局的前提下省略。

### Requirement: 禁止评论死控件

可见评论控件 SHALL 执行其宣称的动作、导航，或以带说明的 disabled 状态展示。

#### Scenario: 回复按钮可用

- **WHEN** 评论上显示“回复”按钮
- **THEN** 点击它会启动定向回复行为，或提示登录并保留跳转意图。

### Requirement: 评论支持点赞状态和切换

评论 SHALL 在 API 提供数据时展示回复点赞数量和当前用户点赞状态。登录用户 SHALL 能在话题详情页切换点赞/取消点赞。

#### Scenario: 回复展示点赞状态

- **WHEN** 某条回复存在一个或多个 `ups`
- **THEN** 回复项展示点赞数量
- **AND** 如果 `is_uped` 为 true，点赞控件以选中状态或等价方式表达当前状态

#### Scenario: 登录用户点赞回复

- **WHEN** 登录用户点击一条尚未点赞的回复
- **THEN** Web app 调用 `POST /api/v1/reply/:reply_id/ups`
- **AND** 成功收到 `action: "up"` 后刷新或更新可见状态

#### Scenario: 登录用户取消点赞回复

- **WHEN** 登录用户点击一条已经点赞的回复
- **THEN** Web app 调用 `POST /api/v1/reply/:reply_id/ups`
- **AND** 成功收到 `action: "down"` 后刷新或更新可见状态

#### Scenario: 匿名用户尝试点赞回复

- **WHEN** 匿名用户尝试点赞回复
- **THEN** UI 提示登录或展示带说明的禁用态
- **AND** 不展示静默失败的死控件

### Requirement: 回复项管理删除入口

系统 MUST 在回复项上为 admin 和 mod 提供删除回复入口，入口必须符合现有线性评论流体验，并且不得误导为删除整帖。

#### Scenario: 回复项显示删除回复入口

- **WHEN** admin 或 mod 查看帖子详情页回复列表
- **THEN** 每条未删除回复 MUST 显示删除回复操作
- **AND** 操作文案 MUST 明确目标为回复

#### Scenario: 删除回复后刷新评论流

- **WHEN** admin 或 mod 成功删除回复
- **THEN** 页面 MUST 刷新评论流或移除该回复
- **AND** 评论楼层或 anchor 展示不得出现坏链接或死控件

#### Scenario: 普通用户不看到管理删除入口

- **WHEN** 普通登录用户或匿名用户查看回复列表
- **THEN** 页面 MUST NOT 显示管理删除回复入口

### Requirement: 回复编辑器提交操作位置统一

话题详情页的添加评论/回复表单 SHALL 将提交型主动作放在编辑器底部右侧操作区，与发布话题和编辑内容页面的主提交按钮位置保持一致。

#### Scenario: 添加评论按钮右侧对齐

- **WHEN** 登录用户查看话题详情页底部回复编辑器
- **THEN** “回复”提交按钮位于表单底部操作区右侧
- **AND** 不与 MarkdownEditor、Turnstile 或引用预览混在同一视觉层级。

#### Scenario: 定向回复保持同一提交位置

- **WHEN** 用户点击某条评论的“回复”进入定向回复状态
- **THEN** 引用预览展示在编辑器上方或等价上下文区域
- **AND** “回复”提交按钮仍位于表单底部操作区右侧。
