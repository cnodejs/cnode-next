## ADDED Requirements

### Requirement: Web 消息回复摘要不得暴露 HTML 标签

`/my/messages` 的“新消息”和“过往消息”分组 MUST 将关联回复展示为紧凑纯文本摘要，不得把 Markdown 渲染结果中的 HTML 标签作为可见文本，也不得使用未净化 HTML 注入。该展示规则 MUST 保持消息公共 API 的 `mdrender` 参数兼容行为不变。

#### Scenario: 新消息展示普通回复

- **WHEN** 新消息关联回复的渲染结果为 `<p>不错哦</p>`
- **THEN** “新消息”分组展示 `不错哦`
- **AND** 页面不显示 `<p>` 或 `</p>` 标签。

#### Scenario: 过往消息展示普通回复

- **WHEN** 过往消息关联回复包含 Markdown 或 HTML 渲染结果
- **THEN** “过往消息”分组展示相同规则生成的纯文本摘要
- **AND** 页面不直接展示 HTML 标签字符串。

#### Scenario: 消息标记已读后摘要保持一致

- **WHEN** 用户将一条消息从“新消息”标记为已读并使其进入“过往消息”
- **THEN** 回复摘要内容和文本语义保持一致
- **AND** 分组移动不会使 HTML 标签重新出现。

#### Scenario: 外部 API 请求渲染后的消息内容

- **WHEN** API 客户端调用 `GET /api/v1/messages?mdrender=true`
- **THEN** `reply.content` 继续按既有兼容契约返回 Markdown 渲染结果
- **AND** Web 消息页的纯文本摘要实现不改变该公共 API 语义。
