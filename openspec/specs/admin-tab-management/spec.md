# admin-tab-management Specification

## Purpose

TBD - created by archiving change add-jobs-zone. Update Purpose after archive.

## Requirements

### Requirement: tabs 注册表

系统 SHALL 新增 `tabs` 表，存储首页 tab 按钮的 key、标签、可见性、排序和访问范围。`tabs.key` SHALL 与代码支持的 `topics.tab` 字段值对应，UNIQUE 约束。tab 的存在性 SHALL 由代码/migration/bootstrap 控制，管理后台 SHALL NOT 支持运行时新增或删除 tab。

#### Scenario: tabs 表字段

- **WHEN** 系统 schema 包含 `tabs` 表
- **THEN** 表包含字段：`id` (serial PK)、`key` (text, UNIQUE)、`label` (text)、`visible` (bool, default true)、`sort_order` (int, default 0)、`scope` (text, default `public`)、`create_at` (timestamp)、`update_at` (timestamp)
- **AND** `scope` 支持 `public` 和 `admin`

#### Scenario: migration/bootstrap 默认值保持现状

- **WHEN** 系统首次通过 Drizzle migration 或受控 bootstrap 初始化 `tabs` 表
- **THEN** 插入 share/ask/job/good/dev/test 六行
- **AND** share/ask/job/good 为 `scope='public'` 且 `visible=true`
- **AND** dev/test 为 `scope='admin'` 且默认 `visible=true` 或在管理员可见范围内可展示
- **AND** share/ask/job/good sort_order 分别为 1/2/3/4
- **AND** dev/test 排在公共 tabs 之后
- **AND** 该初始化为幂等操作，重复执行不得删除或重置已有业务数据

### Requirement: 首页 tab 按钮从 DB 加载

首页 `_index.tsx` SHALL 从 `useRouteLoaderData("root")` 读取 `tabs` 配置渲染 tab 按钮，替代现有硬编码 `TABS` 数组。前端 SHALL 按 `visible`、`sort_order` 和 `scope` 过滤展示。

#### Scenario: 首页 tab 按钮按配置渲染

- **WHEN** 匿名用户访问首页
- **THEN** tab 按钮从 root loader data 的 `tabs` 读取
- **AND** 只展示 `visible=true` 且 `scope='public'` 的 tab
- **AND** 按 `sort_order` 升序排列

#### Scenario: 管理员看到 admin tabs

- **WHEN** 管理员访问首页
- **THEN** 首页 tab 按钮展示 `visible=true` 且 `scope='public'` 或 `scope='admin'` 的 tab
- **AND** `dev` / `test` 可作为管理员专用 tab 出现

#### Scenario: 普通登录用户不可见 admin tabs

- **WHEN** 非 admin 登录用户访问首页
- **THEN** 页面 MUST NOT 展示 `scope='admin'` 的 `dev` / `test` tab

#### Scenario: tab 隐藏后直接访问仍可用

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

系统 SHALL 新增 `admin/tabs.tsx` 管理后台页面，展示所有 tabs 列表，支持编辑标签、切换可见性、调整排序，并展示 tab 的访问范围。管理后台 SHALL 展示 `dev` / `test`，但 SHALL NOT 允许将 admin-only tab 改成 public。

#### Scenario: 访问 Tab 管理页

- **WHEN** 管理员访问 `/admin/tabs`
- **THEN** 页面展示所有 tabs 行的列表表格
- **AND** 每行包含 key、标签、scope、可见性 Checkbox、排序输入、保存按钮
- **AND** `dev` / `test` 在列表中可见并标记为管理员专用

#### Scenario: 切换 tab 可见性

- **WHEN** 管理员在 Tab 管理页取消勾选 `job` 的可见性
- **THEN** 调用 `PATCH /api/v1/admin/tabs/:id` 更新 `visible=false`
- **AND** 首页不再展示"招聘"tab 按钮
- **AND** `/zone/jobs` 可见性仍由 zones 独立控制

#### Scenario: admin-only tab 不可改为 public

- **WHEN** 管理员请求将 `dev` 或 `test` 的 `scope` 改为 `public`
- **THEN** API MUST 拒绝或忽略该字段
- **AND** `dev` / `test` 仍保持管理员专用

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
