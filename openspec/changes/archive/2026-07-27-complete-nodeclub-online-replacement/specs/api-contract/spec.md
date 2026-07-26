## ADDED Requirements

### Requirement: mdrender 必须真实渲染 Markdown

API 端点返回 topic、reply、message 中的 content 时，SHALL 按 nodeclub API 语义处理 `mdrender` 参数。

#### Scenario: mdrender=true

- **WHEN** 客户端请求 content 字段且 `mdrender=true` 或未传 `mdrender`
- **THEN** 系统先执行 `linkUsers` 处理 @username
- **AND** 再执行 Markdown 到 HTML 的渲染
- **AND** 返回渲染后的 HTML 字符串

#### Scenario: mdrender=false

- **WHEN** 客户端请求 content 字段且 `mdrender=false`
- **THEN** 系统返回数据库中的原始 Markdown 文本
- **AND** 不执行 Markdown HTML 渲染

### Requirement: topic list 必须支持真实分页总数

话题列表 API 或 Web loader SHALL 能得到与查询条件一致的总数，用于线上首页分页。

#### Scenario: 首页分页总数

- **WHEN** 用户访问首页或 tab 列表的第 N 页
- **THEN** 系统使用与列表相同的 tab/deleted/good 条件计算总数
- **AND** Web 分页控件基于总数计算总页数
- **AND** 不使用当前页条数作为 total
