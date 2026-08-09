## MODIFIED Requirements

### Requirement: tabs 注册表

系统 SHALL 使用 `tabs` 表存储首页 tab 按钮的 key、标签、可见性、排序和访问范围。`tabs.key` SHALL 与代码支持的有效 `topics.tab` 字段值对应并保持 UNIQUE。tab 的存在性 SHALL 由代码/migration/bootstrap 控制，管理后台 SHALL NOT 支持运行时新增或删除 tab。

#### Scenario: tabs 表字段

- **WHEN** 系统 schema 包含 `tabs` 表
- **THEN** 表包含字段：`id` (serial PK)、`key` (text, UNIQUE)、`label` (text)、`visible` (bool, default true)、`sort_order` (int, default 0)、`scope` (text, default `public`)、`create_at` (timestamp)、`update_at` (timestamp)
- **AND** `scope` 支持 `public` 和 `admin`

#### Scenario: migration/bootstrap 默认值

- **WHEN** 系统通过 reviewed migration 或受控 bootstrap 初始化当前 tabs
- **THEN** 注册 `share/ask/tech/ai/ideas/career/life/event/job/dev/good`
- **AND** 除 `dev` 外均为 `scope='public'`，`dev` 为 `scope='admin'`
- **AND** 不注册 `test`
- **AND** 初始化保持幂等，重复执行不得重置已有 visible 运营值或 topic 数据

#### Scenario: 退役 test 前检查数据

- **WHEN** migration 准备删除 `tabs.key='test'`
- **THEN** migration MUST 断言不存在精确或忽略大小写与首尾空格后等于 `test` 的 topic tab
- **AND** 发现任一关联 topic 时 MUST 回滚并停止迁移

### Requirement: 首页 tab 按钮从 DB 加载

首页 `_index.tsx` SHALL 从 root loader data 读取 tabs 配置并按 `visible` 和 `scope` 过滤。页面 SHALL 固定组合 `all`、中间可配置项、允许时的 `dev` 和最右侧 `good`，而不是仅依赖 sort order 确定端点位置。

#### Scenario: 首页公开 Tab 按配置渲染

- **WHEN** 匿名或普通登录用户访问首页
- **THEN** 页面只展示 `visible=true` 且 `scope='public'` 的注册项
- **AND** 中间项按 sort order 升序排列
- **AND** `all` 固定最左、可见 `good` 固定最右

#### Scenario: 管理员看到 dev

- **WHEN** 管理员访问首页且 `dev.visible=true`
- **THEN** 页面在全部普通公开项之后展示 `dev`
- **AND** 在 `dev` 之后只显示可见的 `good`

#### Scenario: 普通用户不可见 dev

- **WHEN** 非管理员访问首页
- **THEN** 页面 MUST NOT 展示 `dev`
- **AND** 页面 MUST NOT 展示已退役的 `test`

#### Scenario: Tab 隐藏后直接访问

- **WHEN** 管理员将某个 public tab 的 visible 设为 false
- **THEN** 首页不展示该 tab 按钮
- **AND** 直接访问对应 `?tab=` 仍按 API 合法 key、权限和公开规则处理

### Requirement: 管理后台 Tab 管理页面

`admin/tabs.tsx` SHALL 展示当前所有注册 tabs，支持编辑标签、切换可见性、调整允许调整的中间排序，并展示 scope。页面 SHALL 将 `dev` 标记为管理员可见，不得展示已退役的 `test`，也不得允许通过配置破坏 `all/dev/good` 的端点顺序。

#### Scenario: 访问 Tab 管理页

- **WHEN** 管理员访问 `/admin/tabs`
- **THEN** 页面展示当前注册 tabs 的 key、标签、scope、可见性、排序和保存操作
- **AND** `dev` 标记为管理员可见
- **AND** 不显示 `test`

#### Scenario: 切换 Tab 可见性

- **WHEN** 管理员更新某个 public tab 的 visible
- **THEN** 首页按钮可见性随配置变化
- **AND** API 对合法 key 的处理不因按钮隐藏而改变

#### Scenario: dev 不可改为 public

- **WHEN** 管理员请求将 `dev.scope` 改为 `public`
- **THEN** API MUST 拒绝或忽略该字段
- **AND** `dev` 保持管理员可见范围

#### Scenario: 固定项不可被重排越界

- **WHEN** 管理员编辑 `dev` 或 `good` 的 sort order
- **THEN** 首页仍将 `dev` 放在普通项之后
- **AND** 首页仍将可见 `good` 放在最右侧
