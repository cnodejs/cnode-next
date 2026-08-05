# cnpm-registry-browser

## Why

CNode 当前是纯社区站，缺少面向 Node.js 生态的"工具"能力。社区成员讨论技术、招聘、分享时，经常需要查 npm 包信息（README、版本、依赖、文件、下载量）。npmmirror（cnpm 组织维护的 registry 镜像，仓库 `cnpm/cnpmweb`）提供了完整的包浏览前端，但它是独立部署的 Next.js + antd 应用，与本站技术栈和视觉体系割裂。把 npmmirror 的包浏览能力原生重写进 cnode-next，在导航栏提供 CNPM 入口，让社区站同时承担"工具"属性。

## What Changes

- 在 `apps/web` 内新增 `/cnpm/*` 路由组，渲染在现有 Layout 内，复用 cnode 现有 Header/Footer 与主题系统（next-themes 深色模式自动继承）。
- 新增能力：npm 包搜索、包详情浏览（README、版本列表、文件树、依赖关系、下载趋势预留）、registry 统计展示。
- 导航栏硬编码新增 CNPM 菜单项（桌面 nav + 移动 sheet），不改动 DB 驱动的 zones。
- 数据全部浏览器直连 `https://registry.npmmirror.com`（CORS 已验证开放），不引入后端代理。
- 不再引入 cnpmweb 的 antd/Next.js/swr 依赖与广告组件；图表用 shadcn Chart（recharts）而非 chart.js。
- 下载趋势本次仅做"预留"：`/cnpm/pkg/:name/trends` 路由、下载数据 hook、主页下载量数字与基础图；多包对比、范围切换等富交互留作后续。
- 新增一个 npm 包依赖：`recharts`（shadcn Chart 需要）。

## Capabilities

### New Capabilities
- `cnpm-registry-browser`: 在 cnode-next web 应用内提供 npm 包搜索与浏览能力，数据直连 npmmirror registry。

### Modified Capabilities
<!-- 无现有 spec 需求变更 -->

## Impact

- **代码**：`apps/web/app/routes/cnpm*.tsx`（新路由）、`apps/web/app/lib/registry/`（类型与 fetch 封装）、`apps/web/app/components/cnpm/`（工具页组件）、`apps/web/app/components/Layout.tsx`（新增导航项）。
- **路由**：`apps/web/app/routes.ts` 新增 `/cnpm`、`/cnpm/search`、`/cnpm/pkg/*`（catch-all 解析 scoped 包与 tab）。
- **依赖**：`apps/web` 新增 `recharts`；运行 `shadcn add chart` 生成 `ui/chart.tsx`。
- **不涉及**：`apps/api`、`packages/db`、`packages/shared`、数据库迁移、部署拓扑（与 web 同 Worker，零新增基础设施）。
- **上游参考**：`~/gpm/github.com/cnpm/cnpmweb`（仅作功能与端点参考，不 vendor 代码）。

## Non-goals

- 不做 npm 包发布/账号/登录等 registry 写操作。
- 不迁移 cnpmweb 的用户主页（`/user/:name`）与 npa 智能重定向（`[...npa]`）。
- 不做广告组件（AdBanner/AdVPS/AdHire）、不做 README 图片代理。
- 不做 trends 的多包对比、时间范围切换等富交互（仅预留数据层与基础图）。
- 不接入全局 ⌘K 命令面板搜索。
- 不通过 `apps/api` 代理 registry 请求（直连，换取零后端改动）。
- 不引入 cnpmweb 的 antd/antd-style/chart.js 依赖。

## Documentation Impact

- 不需要更新 `docs/` 与 `wiki/`；导航与使用方式以 UI 自解释为主。
- 若后续部署域名/registry 地址变化，可补充运维文档说明；本期不新增文档。
