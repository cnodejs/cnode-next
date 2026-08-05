# user-profile-experience Specification

## Purpose

定义用户主页及其话题、参与、收藏列表对齐 nodeclub 线上分页语义、公开可见性过滤规则和管理员治理入口的要求。

## Requirements

### Requirement: 用户内容列表必须支持 legacy 分页语义

用户主页相关列表 SHALL 对齐 `nodeclub/controllers/user.js` 的分页行为，不能只展示 profile recent 数据。

#### Scenario: 用户话题分页

- **WHEN** 用户访问 `/user/:name/topics?page=N`
- **THEN** 系统展示该用户创建的话题列表
- **AND** 结果按 create_at 降序排列
- **AND** 页面返回总页数并渲染分页控件

#### Scenario: 用户参与分页

- **WHEN** 用户访问 `/user/:name/replies?page=N`
- **THEN** 系统展示该用户参与过回复的话题列表
- **AND** 按该用户回复时间降序去重话题
- **AND** 页面返回总页数并渲染分页控件

#### Scenario: 用户收藏分页

- **WHEN** 用户访问 `/user/:name/collections?page=N`
- **THEN** 系统展示该用户收藏的话题列表
- **AND** 保持收藏记录顺序
- **AND** 页面返回总页数并渲染分页控件

### Requirement: 用户内容列表必须过滤不可公开内容

用户主页、用户话题、用户参与和用户收藏列表 SHALL 只展示公开可见内容，并保持分页 total 与过滤后的结果一致。block 用户内容不可公开；仅处于 mute 状态的用户内容不应因此被隐藏。

#### Scenario: 用户话题列表过滤内部和受限内容

- **WHEN** 用户访问 `/user/:name/topics?page=N`
- **THEN** 列表 MUST 排除 `tab=dev` 或 `tab=test` 的话题
- **AND** MUST 排除已删除话题
- **AND** MUST 排除作者已被 block 的话题
- **AND** MUST NOT 仅因作者被 mute 而排除话题
- **AND** total MUST 按相同过滤条件计算

#### Scenario: 用户参与列表过滤不可公开所属话题

- **WHEN** 用户访问 `/user/:name/replies?page=N`
- **THEN** 列表 MUST 排除已删除回复
- **AND** MUST 排除所属话题为 dev/test、已删除或作者已被 block 的回复聚合
- **AND** total MUST 按过滤后的去重话题计算

#### Scenario: 用户收藏列表过滤不可公开话题

- **WHEN** 用户访问 `/user/:name/collections?page=N`
- **THEN** 列表 MUST 排除 dev/test、已删除或作者已被 block 的话题
- **AND** total MUST 按过滤后的收藏话题计算

#### Scenario: 用户主页 recent 数据过滤不可公开内容

- **WHEN** 用户访问 `/user/:name`
- **THEN** `recent_topics` 和 `recent_replies` MUST 只包含公开可见话题

### Requirement: 用户主页展示完整公开资料

用户主页 Hero SHALL 展示用户头像、用户名、注册时间、公开身份和已填写的所在地、个人网站、GitHub、签名，不得展示微博或敏感账号字段。

#### Scenario: 用户填写了公开资料

- **WHEN** 用户访问已填写所在地、个人网站、GitHub 和签名的 `/user/:name`
- **THEN** Hero 以清晰层级展示这些资料
- **AND** 个人网站和 GitHub 使用安全外部链接
- **AND** 签名作为纯文本展示，不执行 Markdown 或 HTML。

#### Scenario: 用户资料为空

- **WHEN** 用户未填写一个或多个公开资料字段
- **THEN** 页面隐藏对应空行
- **AND** 不展示空占位标签或微博字段。

### Requirement: 用户主页展示真实社区统计

用户主页 SHALL 使用持久化总计字段展示积分、话题、回复和收藏统计，不得用 recent 数组长度冒充总数。

#### Scenario: recent 数量小于总数

- **WHEN** 用户 `topic_count` 大于 `recent_topics.length` 或 `reply_count` 大于 `recent_replies.length`
- **THEN** 页面展示 `topic_count`、`reply_count` 和 `collect_topic_count`
- **AND** recent 列表继续只承担最近内容展示。

### Requirement: 用户主页突出身份而非治理操作

公开用户 Hero SHALL 将公开身份与资料置于主要视觉层级；管理员治理操作 SHALL 作为次级入口出现。

#### Scenario: 普通访客查看用户主页

- **WHEN** 匿名用户或无用户治理权限的登录用户访问 `/user/:name`
- **THEN** 页面展示公开身份和资料
- **AND** 不展示治理操作入口。

#### Scenario: 管理员查看其他用户主页

- **WHEN** 管理员访问非本人用户主页
- **THEN** 页面展示一个克制的管理入口
- **AND** 不平铺多个红色治理按钮。
