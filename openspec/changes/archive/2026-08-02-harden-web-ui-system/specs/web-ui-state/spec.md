## ADDED Requirements

### Requirement: 可分享 UI 状态由 URL 表示

影响当前数据集或页面视图的 tab、搜索、筛选、排序和分页状态 SHALL 由 URL pathname 或 search parameters 表示，而不是仅保存在组件内存中。打开相同 URL MUST 恢复相同的可分享 UI 状态。

#### Scenario: 切换列表 tab

- **WHEN** 用户在公开页面或后台列表切换 tab
- **THEN** URL MUST 更新为所选 tab
- **AND** 刷新页面后 MUST 继续展示该 tab
- **AND** 浏览器后退 MUST 恢复切换前的 tab 和结果。

#### Scenario: 修改筛选后翻页

- **WHEN** 用户应用筛选、排序或搜索条件后翻页
- **THEN** 下一页 URL MUST 同时保留这些条件
- **AND** 复制该 URL 到新会话 MUST 得到相同筛选和页码状态。

#### Scenario: URL 包含无效 UI 状态

- **WHEN** URL 包含不支持的 tab、筛选值或页码
- **THEN** 页面 MUST 使用明确的安全默认值或展示可理解的无结果状态
- **AND** 不得渲染互相矛盾的选中状态。

### Requirement: SSR 首次渲染不得依赖浏览器专属状态

SSR 页面及其客户端首次 render SHALL 从相同的路由数据、URL 和确定性默认值生成相同结构。组件 MUST NOT 在 render 阶段读取 `window`、`document`、`localStorage`、viewport 或媒体查询来决定首次呈现的分支；浏览器专属增强 MUST 在 hydration 后接管，且不得改变既有业务状态。

#### Scenario: 直接请求含筛选参数的页面

- **WHEN** 用户直接请求带 tab、筛选或分页参数的 URL
- **THEN** SSR HTML MUST 已反映这些 URL 状态
- **AND** hydration 后选中项、结果和分页 MUST 与 SSR HTML 一致
- **AND** 控制台不得出现 hydration mismatch。

#### Scenario: 浏览器专属 UI 偏好

- **WHEN** 某个非关键 UI 偏好只能从浏览器存储或媒体查询获得
- **THEN** SSR 与客户端首次 render MUST 使用相同的确定性默认结构
- **AND** hydration 后应用该偏好时 MUST 不丢失焦点、输入内容或路由状态。

#### Scenario: 无 JavaScript 首屏结构

- **WHEN** 服务端渲染公共或后台页面
- **THEN** 主标题、主要内容和基于 URL 的当前状态 MUST 存在于首屏 HTML
- **AND** 不得以仅客户端占位分支替代这些内容。

### Requirement: 未保存内容离开保护

话题创建、话题编辑、回复编辑及其他会产生长文本草稿的页面 SHALL 在内容相对初始值发生变化且尚未成功保存时保护用户免于意外离开。

#### Scenario: 站内导航离开脏表单

- **WHEN** 用户修改标题、分类或正文后触发站内导航
- **THEN** 页面 MUST 在离开前说明存在未保存内容并要求用户确认
- **AND** 用户取消时 MUST 留在当前页面且输入内容保持不变。

#### Scenario: 刷新或关闭含未保存内容的页面

- **WHEN** 表单存在未保存内容且用户刷新、关闭标签页或离开站点
- **THEN** 浏览器 MUST 展示其支持的离开警告
- **AND** 未确认离开时页面内容 MUST 保持不变。

#### Scenario: 无修改或保存成功后离开

- **WHEN** 表单未发生变化或最近一次提交已成功保存当前内容
- **THEN** 后续导航 MUST 不再显示未保存内容警告。

#### Scenario: 提交进行中触发离开

- **WHEN** 保存请求仍在进行且用户尝试离开
- **THEN** 页面 MUST 将当前内容视为尚未保存
- **AND** 只有收到成功结果后才能解除离开保护。
