# admin-tab-management Specification

## Purpose

定义 Tab 管理后台能力：tabs 注册表的可见性控制、排序管理，以及首页 tab 按钮的 DB 驱动加载，替代现有硬编码。

## ADDED Requirements

### Requirement: tabs 注册表

系统 SHALL 新增 `tabs` 表，存储首页 tab 按钮的 key、标签、可见性、排序。`tabs.key` SHALL 与 `topics.tab` 字段值对应，UNIQUE 约束。

#### Scenario: tabs 表字段

- **WHEN** 系统 schema 包含 `tabs` 表
- **THEN** 表包含字段：`id` (serial PK)、`key` (text, UNIQUE)、`label` (text)、`visible` (bool, default true)、`sort_order` (int, default 0)、`create_at` (timestamp)、`update_at` (timestamp)

#### Scenario: migration/bootstrap 默认值保持现状

- **WHEN** 系统首次通过 Drizzle migration 或受控 bootstrap 初始化 `tabs` 表
- **THEN** 插入 share/ask/job/good 四行，全部 `visible=true`
- **AND** sort_order 分别为 1/2/3/4
- **AND** 与现有 `_index.tsx:37-43` 硬编码 TABS 数组一致
- **AND** 该初始化为幂等操作，重复执行不得删除或重置已有业务数据

### Requirement: 首页 tab 按钮从 DB 加载

首页 `_index.tsx` SHALL 从 `useRouteLoaderData("root")` 读取 `tabs` 配置渲染 tab 按钮，替代现有硬编码 `TABS` 数组（`_index.tsx:37-43`）。

#### Scenario: 首页 tab 按钮按配置渲染

- **WHEN** 用户访问首页
- **THEN** tab 按钮从 root loader data 的 `tabs` 读取
- **AND** 只展示 `visible=true` 的 tab
- **AND** 按 `sort_order` 升序排列

#### Scenario: tab 隐藏后直接访问仍可用

- **WHEN** 管理员将 `tabs.key='job'` 的 `visible` 设为 `false`
- **THEN** 首页不展示"招聘"tab 按钮
- **AND** 直接访问 `/?tab=job` 仍返回招聘帖列表（API 行为层不受影响）
- **AND** 直接访问 `/zone/jobs` 仍正常（专区可见性独立控制）

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

系统 SHALL 新增 `admin/tabs.tsx` 管理后台页面，展示所有 tabs 列表，支持编辑标签、切换可见性、调整排序。

#### Scenario: 访问 Tab 管理页

- **WHEN** 管理员访问 `/admin/tabs`
- **THEN** 页面展示所有 tabs 行的列表表格
- **AND** 每行包含 key、标签、可见性 Checkbox、排序输入、保存按钮

#### Scenario: 切换 tab 可见性

- **WHEN** 管理员在 Tab 管理页取消勾选 `job` 的可见性
- **THEN** 调用 `PATCH /api/v1/admin/tabs/:id` 更新 `visible=false`
- **AND** 首页不再展示"招聘"tab 按钮
- **AND** `?tab=job` 直接访问仍可用

### Requirement: 管理后台 Tab API

系统 SHALL 新增 Tab 管理 API：`GET /api/v1/admin/tabs` 列表、`PATCH /api/v1/admin/tabs/:id` 更新。API SHALL 要求 admin 权限。

#### Scenario: 获取 Tab 列表

- **WHEN** 管理员请求 `GET /api/v1/admin/tabs`
- **THEN** 返回所有 tabs 行（含 `visible=false`）
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
