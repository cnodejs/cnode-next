## 1. RSS source API

- [x] 1.1 决定 RSS source JSON 路径：复用 `/api/v1/rss` 或新增 `/api/v1/rss-source`，并记录为非公开 XML contract。
- [x] 1.2 增加 API 查询，返回最多 50 条按 `create_at desc` 排序的 RSS-ready 话题数据。
- [x] 1.3 RSS source 查询 MUST 排除 `dev` / `test`、`deleted=true`、`status=deleted` 和 block 作者内容。
- [x] 1.4 RSS source MUST 允许包含 `job` 公开话题。
- [x] 1.5 RSS source item 返回 title、canonical topic link、guid、rendered description、author loginname、pubDate 或 create_at。
- [x] 1.6 补充 API 测试，覆盖 job 包含、dev/test 排除、deleted/status deleted 排除、block 作者排除和排序/limit。

## 2. Web RSS XML

- [x] 2.1 将 Web `/rss` loader 改为调用 RSS source JSON 并生成 RSS 2.0 XML。
- [x] 2.2 XML channel 使用 CNode 标题、站点链接、语言和描述，并输出 `application/rss+xml; charset=utf-8`。
- [x] 2.3 每个 item 输出 title、link、guid、description、author、pubDate。
- [x] 2.4 统一处理 XML escaping 和非法 XML 字符，避免标题、作者或内容破坏 XML。
- [x] 2.5 在 API 失败时返回有效但明确降级的 RSS XML，或返回合适错误状态；实现前选择一种策略。
- [x] 2.6 补充 Web/resource route 测试，确认 `/rss` 不再是空 channel 且包含 item。

## 3. 后台导航重排

- [x] 3.1 将后台侧栏分组重排为总览、内容、用户、审计、系统，系统设置放最后。
- [x] 3.2 将专区管理和 Tab 管理归入内容分组。
- [x] 3.3 顶部导航同步为概览、内容、用户、审计、系统，并确保 `/admin/zones`、`/admin/tabs`、`/admin/audit` active matching 正确。
- [x] 3.4 移动端导航顺序与侧栏分组保持一致。

## 4. 用户管理操作分层

- [x] 4.1 将 `/admin/users` 操作列改为只直接展示“查看”和“管理”入口。
- [x] 4.2 管理菜单按用户治理、角色权限、账号安全、危险操作分组。
- [x] 4.3 将 block 文案统一为“屏蔽用户内容 / 恢复用户内容”，状态 badge 改为“内容已屏蔽”。
- [x] 4.4 保持 mute 文案为“禁言 / 解除禁言”，并在 UI 层与 block 区分。
- [x] 4.5 重置密码和删除所有发言 MUST 位于菜单的账号安全/危险操作分组，并保留明确确认流程。
- [x] 4.6 当前管理员本人行 MUST 不展示 block、mute、删除所有发言和影响自身权限的可执行入口。
- [x] 4.7 补充 UI/route 测试或组件测试，覆盖菜单分组、自操作隐藏和危险操作确认入口。

## 5. 审计 API

- [x] 5.1 扩展 `GET /api/v1/admin/audit` 返回 operator_id、operator_name、action、target_type、target_id、target_name、result、detail、create_at。
- [x] 5.2 增加 action 映射，返回 category、risk、human label 和简短描述所需字段。
- [x] 5.3 支持按 page、limit、date_from、date_to、operator、category、risk、target_type、result、q 筛选。
- [x] 5.4 返回当前筛选全集的 summary，包括高风险、内容删除、权限变更、账号安全和失败/异常数量。
- [x] 5.5 对 detail 展示做敏感信息防护，确保不会返回 secrets、token、明文密码或生产环境变量。
- [x] 5.6 补充 API 测试，覆盖筛选、summary、分类/风险映射、权限和敏感信息不泄漏。

## 6. 审计中心 UI

- [x] 6.1 将 `/admin/audit` 从表格列表改为审计中心布局：header、summary cards、filters、event stream。
- [x] 6.2 事件流每条记录 MUST 显示风险 badge、人话标题、操作人、时间、类别、目标和结果。
- [x] 6.3 每条记录 MUST 支持展开原始详情，展示 raw action、operator_id、target_type、target_id、detail JSON 或原始 detail。
- [x] 6.4 目标为 user/topic/report/scan_job 等可跳转对象时 SHOULD 提供对应后台或前台链接。
- [x] 6.5 筛选表单 MUST 使用 URL 参数作为状态来源，分页和刷新后保持筛选上下文。
- [x] 6.6 移动端 MUST 使用卡片流而不是横向表格。

## 7. 文档和验证

- [x] 7.1 如存在后台运营文档，更新用户治理菜单和审计中心说明。
- [x] 7.2 如存在业务规则 wiki，记录 `/rss` 公开可见性范围和 block/mute 文案语义。
- [x] 7.3 运行 `pnpm lint`。
- [x] 7.4 运行 `pnpm typecheck`。
- [x] 7.5 运行相关 API 和 Web 测试。
- [x] 7.6 运行 `openspec validate --changes improve-admin-operational-governance`。
- [x] 7.7 发布或 PR 前运行 `pnpm verify`。
