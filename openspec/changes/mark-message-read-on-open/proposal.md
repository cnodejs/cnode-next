## Why

`/my/messages` 中的未读通知只有点击“标记已读”按钮才会更新状态；用户直接点击通知关联的话题后，消息仍保持未读，Header 数量也不会减少。消息目标链接应同时表达“打开这条通知”，并在导航时启动已有的单条已读操作。

## What Changes

- 点击未读消息的关联话题链接时，立即启动该消息的单条标记已读请求，同时保持正常客户端导航。
- 点击消息作者头像或用户名时仅导航到用户页，不改变消息状态。
- 已读消息的话题链接继续正常导航，不重复发送标记请求。
- 增加 Web 回归测试，覆盖目标链接、作者链接以及对应的未读状态行为。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `messaging`: 明确未读消息目标链接在导航时启动单条标记已读，并区分作者资料链接和已读消息链接。

## Impact

- 范围内：`apps/web/app/routes/my.messages.tsx` 的消息链接交互、`apps/web/tests/Messages.test.tsx` 的回归测试，以及 `messaging` 规格增量。
- 范围外：消息 API、数据库 schema、Header 消息下拉、消息创建规则、页面布局与视觉样式。
- 受影响系统：React Router Web 消息页和现有 `POST /api/v1/message/mark_one/:msg_id` 调用。
- 高风险类别：无数据库、权限、安全、部署或数据修复变更；主要风险是导航导致异步请求未启动或错误链接触发已读。
- Web 设计：沿用 directory/data-list 消息页结构及现有 `Item`、`Link`、`Button`；无 primitive、主题、响应式或可访问名称变化。
- Legacy：本变更不替换 `../nodeclub/` 或 `egg-cnode/` 的实现，也不引入 legacy compatibility 路径。

## Non-goals

- 不等待标记请求完成后再导航，也不阻止用户打开消息目标。
- 不在作者头像或用户名链接上推断消息已被阅读。
- 不修改单条已读 API 的响应契约或失败反馈策略。

## Documentation Impact

无需更新 `docs/arch/`、`docs/biz/`、`docs/deployment/`、根治理文件、app README 或生成的 `apps/web/public/openapi.json`；持久行为由 `openspec/specs/messaging/spec.md` 在归档后统一承载。
