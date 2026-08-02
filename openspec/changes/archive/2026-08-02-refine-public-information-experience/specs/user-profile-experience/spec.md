## ADDED Requirements

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
