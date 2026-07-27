## ADDED Requirements

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
