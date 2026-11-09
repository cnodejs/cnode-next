# Proposal

## Why

页头 CommandPalette 和 `/search` 页面在输入关键词后按 Enter 不能可靠发起搜索：`cmdk` 会拦截 Enter，无匹配快捷项时没有动作，有模糊匹配时还可能错误打开快捷页面。界面明确提示“按 Enter 搜索”，当前行为违反提示并阻断键盘用户的主要搜索路径。

## What Changes

- 统一页头 CommandPalette 的 Enter 语义：存在非空搜索词且未明确选择快捷项时，Enter 导航到带编码查询参数的 `/search?q=...`。
- 保留方向键选择并执行快捷操作的能力，防止搜索词的模糊匹配意外覆盖用户的搜索意图。
- 确保 `/search` 页输入框按 Enter 与点击“搜索”按钮产生相同查询结果，并忽略空白查询。
- 保留输入法组合输入、Escape 关闭、关闭后焦点恢复和移动端可触达行为。
- 增加覆盖直接搜索、快捷项选择、空查询和输入法组合状态的 Web 回归测试。
- 修复通过仓库验证后，按现有 `cnode-deploy` 流程部署，并在生产环境验证键盘搜索路径。

## Capabilities

### New Capabilities

- `site-search`: 定义页头搜索面板与 `/search` 页面通过键盘或提交按钮发起站内搜索时的统一行为，以及搜索和快捷操作之间的优先级。

### Modified Capabilities

无。

## Scope

### In scope

- `apps/web/app/components/CommandPalette.tsx` 的搜索提交和快捷操作键盘交互。
- `apps/web/app/routes/search.tsx` 的 Enter 和按钮提交行为。
- `apps/web/tests/LayoutNavigation.test.tsx`、搜索路由测试及必要的键盘可访问性验证。
- `cnode-web-design` 约束下的 navigation shell overlay 与 feed route 表单行为。
- 使用既有生产部署流程发布并验证。

### Out of scope

- 不修改 `apps/api` 搜索接口、搜索算法、搜索范围或结果排序。
- 不增加用户搜索、搜索建议、历史记录或自动补全。
- 不修改数据库、Drizzle schema、迁移、Redis 或共享 API 契约。
- 不修改 `../nodeclub/` 或 `egg-cnode/`；本次修复不是 legacy 行为迁移或替换。

### Affected systems and risk

- 受影响系统仅为 `apps/web` 的公共 navigation shell 和 feed archetype 搜索页。
- 响应式布局和设计 token 不变；移动端与桌面端共享同一行为树。
- 主要风险是 Enter 优先级调整导致快捷操作键盘选择退化，以及中文输入法确认键被误判为提交。
- 不涉及高风险类别：认证、权限、安全策略、API、数据、迁移和后台操作均不变。

## Impact

- Web 依赖继续使用现有 `cmdk`、Base UI、React Router 和 shadcn primitives，不新增依赖。
- `/search?q=...` URL 与 `/api/v1/search` 请求格式保持不变。
- 无 breaking change，无数据库或接口变更。
- 实施完成后需要运行目标 Web 测试、Web typecheck/build、可行时运行 `pnpm verify`，并检查桌面和移动端键盘交互。

## Documentation Impact

- 不修改 `docs/arch/`、`docs/biz/`、`docs/deployment/`、根治理文件或应用 README；该修复不改变长期架构、业务规则和部署步骤。
- 不修改 `apps/web/public/openapi.json`，因为 API 契约不变。
- 行为契约由新增 `site-search` spec 和 Web 回归测试记录。

## Non-goals

- 不解决“搜索话题、用户”文案与当前本地接口仅搜索话题内容之间的范围差异。
- 不重构通用 `Command` 或 `Input` primitive，不升级或替换 `cmdk`。
- 不改变搜索结果页面视觉设计、加载反馈或错误反馈。
