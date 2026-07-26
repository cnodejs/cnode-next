## 1. API 权限与行为

- [x] 1.1 检查 `apps/api/src/routes/admin.ts` 的 `/admin/topics` 和 `/admin/topics/:action` 当前权限，确认置顶读取/操作对 `mod` 和 `admin` 可用。
- [x] 1.2 将置顶 action 调整为 `mod` 和 `admin` 都可执行，同时保持删除、隐藏、加精等非置顶动作的既有权限边界。
- [x] 1.3 确保置顶 action 对传入 `ids` 逐条翻转 `topics.top`，并且不修改积分、计数器、发布时间或最后回复时间。
- [x] 1.4 为无权限用户请求置顶 action 返回权限错误，并确保目标话题状态不变。

## 2. Web 后台体验

- [x] 2.1 检查 `apps/web/app/routes/admin/topics.tsx` 的 `requireAdmin` 使用方式，改为允许 `mod` 和 `admin` 访问置顶管理所需的后台话题列表。
- [x] 2.2 调整话题管理页置顶按钮文案为明确的“切换置顶”或等价表述，避免批量混合状态时产生误解。
- [x] 2.3 确保单个和批量操作成功后清空选择、刷新列表，并正确展示“置顶”状态标记。
- [x] 2.4 确保非置顶高风险操作在前端不因 mod 可访问页面而被误开放；必要时按角色隐藏或禁用对应按钮。

## 3. 公开列表排序与展示

- [x] 3.1 检查公开话题列表 API 的排序逻辑，确保按 `top` 倒序、`last_reply_at` 倒序排列，对齐 legacy `sort: '-top -last_reply_at'`。
- [x] 3.2 检查 `apps/web/app/components/TopicList.tsx` 的置顶徽标展示，确保 `top=true` 时桌面和移动端都显示“置顶”。
- [x] 3.3 如首页或话题列表存在缓存，评估置顶后是否需要清理相关缓存；若不可清理，确认 TTL 延迟可接受并记录。

## 4. 验证

- [x] 4.1 补充或更新 API 测试，覆盖 `mod` 可置顶、`admin` 可取消置顶、普通用户不可置顶。
- [x] 4.2 补充或更新排序测试，覆盖置顶话题优先于普通话题且置顶内部按 `last_reply_at` 倒序。
- [x] 4.3 运行 `pnpm typecheck`，确认前后端类型通过。
- [x] 4.4 运行相关测试或 `pnpm test`，确认置顶管理相关行为通过。
