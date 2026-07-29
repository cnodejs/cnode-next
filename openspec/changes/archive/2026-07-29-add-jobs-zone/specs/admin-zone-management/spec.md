# admin-zone-management Specification

## Purpose

定义专区管理后台能力：zones 注册表的可见性控制、排序管理，以及导航栏专区入口的 DB 驱动加载。

## ADDED Requirements

### Requirement: zones 注册表

系统 SHALL 新增 `zones` 表作为专区注册表，存储专区的 slug、名称、描述、图标、可见性、排序。`zones.slug` SHALL 与专区路由 `/zone/:slug` 对应，UNIQUE 约束。

#### Scenario: zones 表字段

- **WHEN** 系统 schema 包含 `zones` 表
- **THEN** 表包含字段：`id` (serial PK)、`slug` (text, UNIQUE)、`name` (text)、`description` (text, nullable)、`icon` (text, nullable)、`visible` (bool, default false)、`sort_order` (int, default 0)、`create_at` (timestamp)、`update_at` (timestamp)

#### Scenario: migration/bootstrap 默认值

- **WHEN** 系统首次通过 Drizzle migration 或受控 bootstrap 初始化 `zones` 表
- **THEN** 插入 `slug='jobs', name='招聘', visible=false`（内测能力，暂不开放）
- **AND** 不插入其他专区行
- **AND** 该初始化为幂等操作，重复执行不得删除或重置已有业务数据

### Requirement: 管理后台专区管理页面

系统 SHALL 新增 `admin/zones.tsx` 管理后台页面，展示所有专区列表，支持编辑名称、描述、图标、切换可见性、调整排序。

#### Scenario: 访问专区管理页

- **WHEN** 管理员访问 `/admin/zones`
- **THEN** 页面展示所有 zones 行的列表表格
- **AND** 每行包含 slug、名称、描述、可见性 Checkbox、排序输入、保存按钮

#### Scenario: 切换专区可见性

- **WHEN** 管理员在专区管理页取消勾选 jobs 的可见性
- **THEN** 调用 `PATCH /api/v1/admin/zones/:id` 更新 `visible=false`
- **AND** 导航栏专区下拉不再展示该专区入口
- **AND** 该专区路由 `/zone/jobs` 仍可直接访问

#### Scenario: 调整专区排序

- **WHEN** 管理员修改专区的 `sort_order` 值
- **THEN** 导航栏专区下拉按 `sort_order` 升序展示

### Requirement: 管理后台专区 API

系统 SHALL 新增专区管理 API：`GET /api/v1/admin/zones` 列表、`PATCH /api/v1/admin/zones/:id` 更新。API SHALL 要求 admin 权限。

#### Scenario: 获取专区列表

- **WHEN** 管理员请求 `GET /api/v1/admin/zones`
- **THEN** 返回所有 zones 行（含 `visible=false` 的专区）
- **AND** 按 `sort_order` 升序排列

#### Scenario: 更新专区配置

- **WHEN** 管理员请求 `PATCH /api/v1/admin/zones/:id` 并提供 `visible` / `sort_order` / `name` / `description` / `icon` 字段
- **THEN** 更新对应 zones 行
- **AND** 写入审计日志
- **AND** 返回更新后的完整行

#### Scenario: 非 admin 用户无权访问

- **WHEN** 非 admin 用户请求 `GET /api/v1/admin/zones` 或 `PATCH /api/v1/admin/zones/:id`
- **THEN** 返回 403

### Requirement: root loader 加载 zones 配置

`root.tsx` loader SHALL 加载 `zones` 表中 `visible=true` 的专区列表，注入全局 route loader data，供 `Layout.tsx` 导航栏渲染。

#### Scenario: 导航栏渲染专区下拉

- **WHEN** 页面渲染导航栏
- **THEN** 从 `useRouteLoaderData("root")` 读取 zones 列表
- **AND** 专区下拉只展示 `visible=true` 的专区
- **AND** 按 `sort_order` 升序排列

#### Scenario: 无可见专区时下拉隐藏

- **WHEN** 所有专区 `visible=false`
- **THEN** 导航栏不展示"专区"下拉
- **AND** 不报错

### Requirement: v1 不支持运行时新增专区

管理后台 v1 SHALL 只支持编辑现有 zones 行的可见性、排序、名称等字段，SHALL NOT 支持运行时新增或删除专区行。

#### Scenario: 管理后台无新增按钮

- **WHEN** 管理员访问 `/admin/zones`
- **THEN** 页面不展示"新增专区"按钮
- **AND** 加新区需通过 migration/bootstrap + 对应专区组件代码完成
