## ADDED Requirements

### Requirement: 话题详情编辑入口与原文编辑

话题详情页 SHALL 为有编辑权限的用户提供可发现的编辑入口，并且话题编辑页 MUST 使用原始 Markdown 内容初始化编辑器，行为对齐 legacy `nodeclub/views/topic/index.html`、`nodeclub/controllers/topic.js` 和 `egg-cnode/app/controller/topic.js`。

#### Scenario: 作者看到编辑入口

- **WHEN** 已登录用户查看自己发布的未删除话题详情页
- **THEN** action 区域 MUST 显示“编辑话题”或等价编辑入口
- **AND** 入口 MUST 导航到 `/topic/:tid/edit`

#### Scenario: 管理员看到编辑入口

- **WHEN** admin 用户查看他人发布的未删除话题详情页
- **THEN** action 区域 MUST 显示“编辑话题”或等价编辑入口
- **AND** 入口 MUST 导航到 `/topic/:tid/edit`

#### Scenario: 非作者普通用户不看到编辑入口

- **WHEN** 普通登录用户查看他人发布的未删除话题详情页
- **THEN** action 区域 MUST NOT 显示可用的编辑话题入口

#### Scenario: 编辑页加载 Markdown 原文

- **WHEN** 有权限用户打开 `/topic/:tid/edit`
- **THEN** 编辑页 MUST 通过 `mdrender=false` 或等价 API 行为获取 topic content
- **AND** MarkdownEditor MUST 使用数据库中的原始 Markdown 文本初始化
- **AND** 不得把已渲染 HTML 作为可编辑正文写入编辑器

#### Scenario: 提交编辑继续复用兼容 API

- **WHEN** 用户在话题编辑页提交合法 title、tab 和 content
- **THEN** Web app MUST 调用 `POST /api/v1/topics/update`
- **AND** 成功后 MUST 返回或导航到该话题详情页
