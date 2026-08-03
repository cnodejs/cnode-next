## Why

Radix UI 迁移到 Base UI 后，`components.json` 仍以 legacy `new-york`/Radix 为 CLI 基线，仓库内 primitive、CNode 颜色 class 与页面级 Tailwind 覆盖形成三套视觉规则，导致 Card、表单、间距、尺寸、响应式和 Markdown 持续漂移。需要以当前 shadcn `base-nova` 建立唯一原子组件基线，并把 CNode 品牌收束到语义主题，避免继续逐页修补。

## What Changes

- **BREAKING**：将 shadcn 配置和 `apps/web/app/components/ui/` 重对齐到 `base-nova`；不再保留 legacy `new-york` primitive 外观、项目专属 primitive variant 或 primitive 内的 `cnode-*` 样式。
- CNode light/dark 配色只通过标准 semantic tokens 扩展，包括 core、sidebar 和 chart tokens；页面不得使用原始色值或以 Tailwind class 重定义原子组件视觉。
- 用当前 shadcn Card、Field、Item、Sheet、Table/Data Table、Alert、Empty 等标准 composition 建立公共与后台 application blocks，按 feed、reading、compose、account、directory、dashboard、data-list 和 workflow 页面原型收束 routes。
- 统一控件尺寸、Card spacing、页面节奏、内容宽度和 desktop/mobile 响应式规则；后台窄屏按信息优先级选择响应式记录项或明确的可滚动数据表。
- 下载并持有上游 `shadcn/typeset` stylesheet，安装 Roboto Variable，使用统一 `.typeset-docs` preset；全部 `MarkdownView`（话题、回复和编辑器预览）共享该 Typeset rhythm，并覆盖无序、有序、嵌套、任务列表、代码、引用、表格和长内容。
- 增加 primitive 完整性、禁止页面视觉覆写、命名页面原型和代表性 light/dark viewport 视觉验收门禁。
- 新增稳定设计系统文档，并让 `docs/conventions.md` 只保留强制入口规则。

## Non-goals

- 不改变 `../nodeclub/` 线上业务流程、内容结构、权限、API、PostgreSQL schema 或数据；legacy EJS 仅作为内容与操作语义参考，不作为视觉复刻目标。
- 不为展示效果新增无真实数据来源的 chart、指标或后台能力。
- 不通过 `shadcn add --all` 无审查覆盖仓库，也不长期维护 `new-york`、Radix 和 `base-nova` 多套兼容层。
- 不把业务领域状态、权限或路由逻辑下沉到原子组件。

## Capabilities

### New Capabilities

- `web-design-system-governance`: 定义 `base-nova` 基线、primitive 完整性、application block、设计文档和防漂移门禁。

### Modified Capabilities

- `web-ui-components`: 原子组件改为未经品牌视觉定制的 `base-nova` 基线，并限制消费者的视觉 class 覆写。
- `web-ui-theme`: CNode 品牌改为标准 core/sidebar/chart semantic token 映射，禁止页面直接消费原始品牌颜色。
- `web-ui-forms`: 表单改用标准 Field family 和统一的控件密度、校验与响应式 composition。
- `web-ui-markdown`: Markdown 正文和预览改用共享 Typeset，并明确完整列表与窄屏行为。
- `layout-templates`: 页面模板改为可审计的公共和后台页面原型，并明确 block 与移动端信息优先级。
- `agent-owned-ui-acceptance`: UI 验收扩展到固定 viewport、light/dark、关键状态与视觉回归证据。

## Impact

**In scope**：`apps/web/components.json`、锁定的 shadcn/Base UI 工具链、`apps/web/app/components/ui/`、`global.css` 与 Typeset CSS、公共/后台 shell、共享 blocks、Web routes、Markdown editor/view、UI 测试与稳定文档。

**Out of scope**：`apps/api` 业务契约、`packages/db`、部署拓扑、MongoDB 到 PostgreSQL 迁移、邮件模板和 `../nodeclub/`/`egg-cnode/` 参考源码。

**Affected systems**：React Router SSR、Tailwind CSS v4、shadcn CLI、Base UI、light/dark theme、前后台响应式布局和 Markdown 渲染。高风险类别为 primitive 全站 blast radius、主题对比度、overlay/focus 行为、移动端数据密度、SSR/hydration 和大范围视觉回归。

## Documentation Impact

新增 `docs/design-system.md` 作为当前设计规范，更新 `docs/conventions.md` 的 Web UI 治理入口。此次不改变 legacy 业务规则，因此无需更新 `wiki/`；若实施中发现线上内容语义差异，只记录为独立待确认事项，不混入视觉规范。
