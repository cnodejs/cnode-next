# admin-tab-management Specification

## Purpose

定义社区话题分类的注册表、数据库配置、首页加载以及管理后台维护边界，确保分类展示、标签解析和管理操作共享同一份受控配置。

## Requirements

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

- **WHEN** 管理员将某个 public tab 的 `visible` 设为 `false`
- **THEN** 首页不展示该 tab 按钮
- **AND** 直接访问对应 `?tab=` 仍按 API 层 tab 权限和公开规则处理

### Requirement: getTabLabel 从 DB 加载

`getTabLabel`（`apps/web/app/lib/brand.ts:17`）SHALL 改为从 root loader data 的 `tabs` 读取 label，替代硬编码 map。SSR 上下文无 loader data 时 SHALL fallback 到硬编码默认值。

#### Scenario: getTabLabel 从配置读取

- **WHEN** 组件调用 `getTabLabel('job')` 且 root loader data 可用
- **THEN** 从 `tabs` 配置返回 `key='job'` 对应的 `label`
- **AND** 不依赖硬编码 map

#### Scenario: SSR fallback

- **WHEN** SSR 上下文无 loader data（如独立 API 调用场景）
- **THEN** `getTabLabel` fallback 到硬编码默认值（share→分享, ask→问答, job→招聘, good→精华）

### Requirement: 管理后台 Tab 管理页面

`admin/tabs.tsx` SHALL 展示当前所有注册 tabs，支持编辑标签、切换可见性、调整允许调整的中间排序，并展示 scope。页面 SHALL 将 `dev` 标记为管理员可见，不得展示已退役的 `test`，也不得允许通过配置破坏 `all/dev/good` 的端点顺序。

#### Scenario: 访问 Tab 管理页

- **WHEN** 管理员访问 `/admin/tabs`
- **THEN** 页面展示当前注册 tabs 的 key、标签、scope、可见性、排序和保存操作
- **AND** `dev` 标记为管理员可见
- **AND** 不显示 `test`

#### Scenario: 切换 tab 可见性

- **WHEN** 管理员在 Tab 管理页取消勾选 `job` 的可见性
- **THEN** 调用 `PATCH /api/v1/admin/tabs/:id` 更新 `visible=false`
- **AND** 首页不再展示"招聘"tab 按钮
- **AND** `/zone/jobs` 可见性仍由 zones 独立控制

#### Scenario: dev 不可改为 public

- **WHEN** 管理员请求将 `dev.scope` 改为 `public`
- **THEN** API MUST 拒绝或忽略该字段
- **AND** `dev` 保持管理员可见范围

#### Scenario: 固定项不可被重排越界

- **WHEN** 管理员编辑 `dev` 或 `good` 的 sort order
- **THEN** 首页仍将 `dev` 放在普通项之后
- **AND** 首页仍将可见 `good` 放在最右侧

### Requirement: 管理后台 Tab API

系统 SHALL 新增 Tab 管理 API：`GET /api/v1/admin/tabs` 列表、`PATCH /api/v1/admin/tabs/:id` 更新。API SHALL 要求 admin 权限。

#### Scenario: 获取 Tab 列表

- **WHEN** 管理员请求 `GET /api/v1/admin/tabs`
- **THEN** 返回所有 tabs 行（含 `visible=false` 和 `scope='admin'`）
- **AND** 按 `sort_order` 升序排列

#### Scenario: 更新 Tab 配置

- **WHEN** 管理员请求 `PATCH /api/v1/admin/tabs/:id` 并提供 `visible` / `sort_order` / `label` 字段
- **THEN** 更新对应 tabs 行
- **AND** 写入审计日志
- **AND** 返回更新后的完整行

#### Scenario: 不支持修改 key 字段

- **WHEN** 管理员请求 `PATCH /api/v1/admin/tabs/:id` 并提供 `key` 字段
- **THEN** `key` 字段被忽略（不可修改）
- **AND** 返回成功但不更新 `key`

#### Scenario: 不支持新增或删除 tab

- **WHEN** 管理员访问 Tab 管理 API
- **THEN** API 不提供创建或删除 tab 的公开操作
- **AND** 加新 tab 需通过代码变更和 migration/bootstrap 完成

### Requirement: root loader 加载 tabs 配置

`root.tsx` loader SHALL 加载 `tabs` 表中所有行，注入全局 route loader data，供首页 tab 渲染和 `getTabLabel` 查询。

#### Scenario: root loader 返回 tabs

- **WHEN** 任意页面通过 `useRouteLoaderData("root")` 读取数据
- **THEN** 数据包含 `tabs` 数组（所有行，含 `visible=false`）
- **AND** 前端按 `visible` 过滤展示

### Requirement: v1 不支持运行时新增 tab

管理后台 v1 SHALL 只支持编辑现有 tabs 行的标签、可见性、排序，SHALL NOT 支持运行时新增或删除 tab 行。

#### Scenario: 管理后台无新增按钮

- **WHEN** 管理员访问 `/admin/tabs`
- **THEN** 页面不展示"新增 Tab"按钮
- **AND** 加新 tab 需通过 migration/bootstrap 完成
