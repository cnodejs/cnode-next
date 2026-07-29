## 1. 前端入口恢复

- [x] 1.1 确认 topic detail loader/currentUser 数据结构是否包含 `is_admin`、作者标识和必要权限字段。
- [x] 1.2 在 `apps/web/app/routes/topic.$tid.tsx` 的 action 区域为作者和 admin 显示“编辑话题”入口。
- [x] 1.3 确保非作者普通用户和匿名用户不看到可用编辑入口。

## 2. 编辑页原文加载

- [x] 2.1 调整 `apps/web/app/routes/topic.$tid.edit.tsx` 的话题读取请求，使用 `mdrender=false` 加载 Markdown 原文。
- [x] 2.2 验证普通帖和招聘帖编辑页初始化 title、tab、content、job_meta 的行为不回退。

## 3. 验证

- [x] 3.1 增加或更新测试，覆盖作者可见编辑入口并进入 `/topic/:tid/edit`。
- [x] 3.2 增加或更新测试，覆盖非作者普通用户不显示编辑入口。
- [x] 3.3 增加或更新 API/集成验证，确认 `GET /api/v1/topic/:id?mdrender=false` 返回原始 Markdown，`POST /api/v1/topics/update` 后详情内容更新。
- [x] 3.4 运行相关检查：优先 `pnpm test` 中受影响测试；可行时运行 `pnpm typecheck`。

## 4. 收尾

- [x] 4.1 确认 docs/wiki 无需同步，或记录后续公共 API 文档同步事项。
- [x] 4.2 运行 `openspec validate restore-topic-edit-entry` 并修复 proposal/spec/tasks 问题。
