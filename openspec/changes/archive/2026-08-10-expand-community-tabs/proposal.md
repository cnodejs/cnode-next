## Why

CNode 仍以 Chinese Node.js 社区为核心，但经过多年沉淀，成员讨论已经延伸到 AI、创意、职场、生活和社区活动。现有公开 Tab 主要只有 `share`、`ask` 和招聘内容，无法稳定承载这些主题，也缺少随 Tab 变化的范围说明和发帖约束提示。

## What Changes

- 保留 `share`、`ask`、`job`、`dev`、`good` 的既有 key、数据和语义，不迁移历史话题；新增 `tech`、`ai`、`ideas`、`career`、`life`、`event` 六个公开 Tab。
- 将首页顺序固定为 `all / share / ask / tech / ai / ideas / career / life / event / job / dev / good`；普通用户不显示 `dev`，`all` 固定最左，`good` 固定最右。
- 删除测试数据库快照中没有关联 topic 的 `test` Tab；迁移执行前再次断言不存在 `tab='test'` 的 topic，避免静默丢失内容。
- 让 `job` 与 `event` 作为常规 Tab 参与首页和 `all` 列表；`job` 继续保留发布权限、`job_meta` 和招聘专区能力。
- 首页侧边栏在 `all`、`good` 显示现有“社区合作” Card；其他 Tab 显示对应说明，`dev` 显示“开发使用” Card。
- 发帖页右侧按“发布规范 Card、当前 Tab 说明 Card、`job_meta` 信息（仅 `job`）”的固定顺序呈现；活动本次只使用普通 topic 正文。
- 更新创建、编辑、列表、管理筛选和 OpenAPI 合约，使新增 key 在 API 与 Web 中保持一致。
- 更新本地 `.cnode-ops.md` 使用约定：任何 SSH 操作在连接前必须打印并确认所用 alias，不输出真实主机地址或凭据。
- **BREAKING**：`test` 不再是有效或可配置 Tab；依赖该 key 的内部调用方需要停止使用。

## Capabilities

### New Capabilities

- `community-topic-tabs`: 定义社区 Tab 集合、顺序、显示名称、首页说明和发帖页 Card 组合规则。

### Modified Capabilities

- `admin-tab-management`: 调整注册表默认项、固定端点顺序约束并退役 `test`。
- `api-contract`: 扩展合法 topic tab，并调整 `all`、`job`、`dev` 与已退役 `test` 的查询行为。
- `home-sidebar-information`: 根据当前 Tab 在“社区合作”和板块说明 Card 之间切换。
- `content-lifecycle`: 将非公开 Tab 规则从 `dev/test` 收敛为 `dev`，并安全处理已退役 `test`。
- `jobs-structured-fields`: 保持招聘结构化信息，同时要求招聘发帖页先显示发布规范和招聘说明。

## Impact

- 范围内：`packages/shared` topic 合约，`packages/db` tabs 数据迁移与 seed，`apps/api` 话题/侧边栏查询，`apps/web` 首页、发布/编辑页、话题标签和后台 Tab/话题筛选，本地 `.cnode-ops.md` SSH 安全约定，以及对应测试和 OpenAPI 输出。
- 范围外：活动结构化字段、`event_meta`、活动状态/专区、交易 Tab、技术标签系统、历史 `share/ask` 或空 Tab 话题重分类。
- 受影响系统：PostgreSQL tabs 配置、Topic API、React Router SSR 首页和 compose archetype、后台 data-list 页面。
- 高风险类别：错误删除历史 `test` 数据、公开可见性回归、旧客户端枚举兼容、招聘内容进入 `all` 后的信息密度、移动端 Tab 横向导航和发帖规范可见性。
- Web 设计：沿用现有 Base UI Tabs、Card、Field 和 Select primitives；首页保持 feed archetype，发帖页保持 compose archetype。桌面侧边栏和移动端提交前提示必须共享文案来源、保持键盘可达且不依赖颜色传达规则。
- 适用 Skills：`cnode-web-design` 约束首页与发帖布局；`cnode-docs` 约束业务规则和生成 API 资产更新。

## Non-goals

- 不把 Deno、Bun、Framework 或 Runtime 建成独立一级 Tab。
- 不删除或迁移 `share`、`ask` 及其历史 topic。
- 不在本次实现活动结构化数据；未来另行评估 `event_meta`。
- 不上线交易能力、支付、担保或交易纠纷处理。
- 不重做 Tabs、Card、Select 等设计系统 primitives。

## Documentation Impact

- 更新 `docs/biz/business-rules.md` 中有效 Tab、公开可见性、招聘和发帖规范；如社区定位需要长期说明，更新其现有业务文档 owner，不新增索引页。
- `docs/arch/` 仅在 topic 分类数据模型产生新架构约束时更新；本次不改 `docs/deployment/`、根治理文件或 app README。
- 通过生成命令更新 `apps/web/public/openapi.json`，不得手工编辑。
