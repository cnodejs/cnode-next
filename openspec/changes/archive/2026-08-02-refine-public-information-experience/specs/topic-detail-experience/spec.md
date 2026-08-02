## MODIFIED Requirements

### Requirement: Topic context rail

Topic 详情页 SHALL 包含右侧上下文 rail，展示作者公开资料摘要、topic stats 和讨论规范入口。作者卡 SHALL 通过页面级用户资料查询获得扩展信息，而不是扩充 topic DTO 的轻量 author 摘要。

#### Scenario: Context rail 包含作者上下文

- **WHEN** topic 详情页在桌面端渲染且作者资料查询成功
- **THEN** 右侧作者卡展示头像、用户名、公开身份、已填写的签名、所在地、个人网站、GitHub 和社区统计
- **AND** 提供指向 `/user/:name` 的用户主页入口
- **AND** 不在作者卡内展示最近创建、最近参与或最新回复列表。

#### Scenario: 作者扩展资料查询失败

- **WHEN** topic 正常加载但页面级作者资料查询失败
- **THEN** 右侧作者卡使用 topic author 摘要展示头像、用户名和主页入口
- **AND** 话题正文、回复和其他操作保持可用。

#### Scenario: 移动端作者上下文

- **WHEN** topic 详情页在移动端渲染
- **THEN** 作者卡进入正文之后的上下文区域并保持可读
- **AND** 不产生横向溢出或固定侧栏。

## ADDED Requirements

### Requirement: 参与讨论提示指向合并后的规范

话题详情页的“参与讨论前”模块 SHALL 指向 `/about` 内的讨论规范，不得引用已删除的新手指南页面。

#### Scenario: 查看讨论规范

- **WHEN** 用户点击话题详情页“查看讨论规范”
- **THEN** 应用导航到 `/about#discussion`
- **AND** 页面定位到讨论与内容规范区块。
