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

