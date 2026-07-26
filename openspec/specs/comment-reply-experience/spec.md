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

评论 SHALL 按时间线渲染为线性流，并 SHALL NOT 渲染嵌套评论树。

#### Scenario: 回复评论仍保持线性

- **WHEN** 用户回复评论 `#2`
- **THEN** 新评论按时间顺序出现在同一列表中
- **AND** 它不会作为评论 `#2` 的嵌套子项出现。

### Requirement: 评论楼层编号

每条评论 SHALL 展示楼层编号或稳定 anchor 标识，用于论坛式引用和直接链接。

#### Scenario: 评论 anchor

- **WHEN** 评论被展示
- **THEN** 它包含可见或可访问的楼层标识，例如 `#1`
- **AND** 该评论可通过 anchor 链接。

### Requirement: 定向回复编辑器

触发评论回复 action SHALL 打开定向回复编辑器，展示回复目标、支持取消，并在提交时包含 `reply_id`。

#### Scenario: 回复 action 打开编辑器

- **WHEN** 用户点击某条评论上的“回复”
- **THEN** 回复编辑器显示“正在回复 @<loginname>”或等价目标上下文
- **AND** 提交时发送目标评论 id 作为 `reply_id`。

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

