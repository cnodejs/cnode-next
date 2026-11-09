# Tasks

## 1. MVP：恢复搜索提交

- [x] 1.1 在 `apps/web/app/components/CommandPalette.tsx` 提取统一的非空关键词提交路径，并在 consumer 事件边界阻止 `cmdk` 吞掉直接搜索的 Enter；通过目标测试验证无匹配关键词会导航到编码后的 `/search?q=...` 并关闭面板。
- [x] 1.2 在 CommandPalette 中记录并重置用户对快捷项的明确键盘选择意图，使方向键选择后 Enter 仍执行快捷操作，而仅由模糊匹配产生的隐式选择不会覆盖搜索；通过 `apps/web/tests/LayoutNavigation.test.tsx` 覆盖两种路径。
- [x] 1.3 确认 `apps/web/app/routes/search.tsx` 的输入框 Enter 与搜索按钮进入同一提交逻辑，修复发现的 consumer 级事件问题；通过搜索路由测试验证两种操作都 trim 查询、更新 `q` 并触发同一 API 请求。

## 2. 完整键盘与可访问性行为

- [x] 2.1 为 CommandPalette 和 `/search` 页补充空输入及纯空白输入测试，验证不导航、不产生空 `q`、不发起 API 请求且输入框保持可编辑。
- [x] 2.2 在搜索 Enter 处理前保护 IME composition 状态，并增加组合确认及组合结束后再次 Enter 的回归测试，验证首次 Enter 不导航、不关闭面板、不执行快捷操作。
- [x] 2.3 运行 `apps/web/tests/LayoutNavigation.test.tsx` 和搜索路由相关测试，并人工检查 Escape、显式关闭、关闭后焦点恢复、loading/error/empty 状态，确认既有行为没有退化。
- [x] 2.4 在 375px、768px、1280px、1440px 的适用 light/dark 场景检查页头搜索 overlay 与 `/search` feed 页面，验证输入框、关闭方式、焦点和搜索反馈可触达、无水平溢出、浏览器 console 无错误；如 DOM 或 class 未变化，记录无需更新视觉基线。

## 3. 集成验证与发布

- [x] 3.1 运行 `pnpm --filter @cnode/web test`、`pnpm --filter @cnode/web typecheck`、`pnpm --filter @cnode/web build` 和适用的 design-system governance 检查，修复所有本次变更导致的失败。
- [x] 3.2 在可行时运行 `pnpm verify` 和 `openspec validate fix-search-enter-behavior --strict`，确认仓库验证通过、设计图与最终实现一致，并确认没有数据库、API、OpenAPI 或长期文档变更。
- [ ] 3.3 使用 `cnode-deploy` 流程确认 CI 镜像构建成功、部署生产服务并检查生产健康状态；通过生产浏览器验证无匹配关键词、可模糊匹配关键词、方向键快捷操作、IME、Escape/焦点恢复及移动端搜索路径。

## Workflow follow-up

- 生产验证和项目审查完成后归档该 OpenSpec change，并验证归档后的 `site-search` 主规格。
