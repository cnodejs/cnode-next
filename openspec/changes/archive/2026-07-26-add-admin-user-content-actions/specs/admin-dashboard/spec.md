## ADDED Requirements

### Requirement: 前台管理动作入口

系统 MUST 在前台用户页、帖子详情页和回复项中向有权限的管理人员展示就地管理动作入口，并且所有动作必须通过后端管理 API 校验权限和写入审计日志。

#### Scenario: 管理员在用户页看到用户管理入口

- **WHEN** admin 访问任意用户主页
- **THEN** 页面 MUST 显示 block 或 unblock 操作入口
- **AND** 当前用户状态 MUST 决定显示封禁或解禁动作

#### Scenario: 版主或管理员在帖子页看到内容管理入口

- **WHEN** admin 或 mod 访问帖子详情页
- **THEN** 页面 MUST 显示删除帖子、置顶切换和高亮切换入口
- **AND** 普通登录用户和匿名用户 MUST NOT 看到这些管理入口

#### Scenario: 版主或管理员在回复项看到删除入口

- **WHEN** admin 或 mod 查看帖子详情页中的回复列表
- **THEN** 每条未删除回复 MUST 提供删除回复入口
- **AND** 删除回复入口 MUST 明确表示目标是回复而不是整帖

#### Scenario: 管理动作反馈和审计

- **WHEN** 管理人员执行任意前台管理动作
- **THEN** 系统 MUST 显示成功或失败反馈
- **AND** 成功后 MUST 刷新当前页面数据
- **AND** 后端 MUST 写入包含操作人、动作和目标对象的审计日志
