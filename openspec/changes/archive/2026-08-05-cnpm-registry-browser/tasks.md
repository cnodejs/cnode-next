# cnpm-registry-browser 任务清单

## 1. 基础设施与依赖

- [x] 1.1 在 `apps/web` 运行 `shadcn add chart`，确认 `recharts` 依赖写入 `apps/web/package.json` 与 pnpm-lock.yaml
- [x] 1.2 创建 `apps/web/app/lib/registry/types.ts`：定义 Manifest / NpmPackageVersion / SearchResult / FileTree / Downloads 等 registry 响应类型
- [x] 1.3 创建 `apps/web/app/lib/registry/client.ts`：`REGISTRY` 常量与 fetch 封装（manifest / 单版本 / search / downloads / files 目录 / 文件内容）
- [x] 1.4 创建纯函数解析逻辑并附 vitest 单测：scoped 包名解析（`@scope/name` vs 普通名）、tab 识别（尾段 ∈ versions/files/deps/trends 否则 home）、版本归一化（`*`→latest）

## 2. 路由与导航

- [x] 2.1 在 `apps/web/app/routes.ts` 注册 `/cnpm`、`/cnpm/search`、`/cnpm/pkg/*`（catch-all）三条路由
- [x] 2.2 在 `apps/web/app/components/Layout.tsx` 硬编码 CNPM 菜单项：桌面顶栏 nav + 移动端 sheet（图标 + 文案），指向 `/cnpm`，不改动 DB 驱动 zones

## 3. Landing 页（/cnpm）

- [x] 3.1 实现 landing 页居中搜索框，提交后跳转 `/cnpm/search?q=<关键词>`
- [x] 3.2 实现 registry 统计条（doc_count / 本周下载量），请求失败时静默隐藏、不阻塞搜索
- [x] 3.3 实现最近访问 hook（localStorage：去重置顶、可移除），在 landing 展示最近访问的包

## 4. 搜索页（/cnpm/search）

- [x] 4.1 实现搜索执行与结果列表（包名、最新版本、描述、关键词、下载量），结果项链接到包详情
- [x] 4.2 实现无 `q` 参数空态、无结果空态、网络错误态与重试
- [x] 4.3 实现分页控件，切换后重新查询并更新 URL 查询参数

## 5. 包详情（/cnpm/pkg/*）

- [x] 5.1 实现 manifest 数据 hook，覆盖加载态、404（包未同步提示）与错误态
- [x] 5.2 实现包元信息头部：包名、描述、许可证、仓库/主页链接、维护者、dist-tags 徽标，以及版本选择器（更新 `?version=`）
- [x] 5.3 实现 README 渲染（复用现有 react-markdown 管线，含代码高亮），readme 缺失时展示占位
- [x] 5.4 接入 scoped 包解析：`/cnpm/pkg/@babel/core` 正确加载
- [x] 5.5 实现包内 tabs 导航（首页/版本/文件/依赖/趋势），切换时保持包名与版本参数

## 6. 版本 / 依赖 / 文件

- [x] 6.1 实现版本列表：按发布时间倒序，dist-tags 指向的版本展示标签徽标，支持切换版本
- [x] 6.2 实现依赖页：dependencies / devDependencies / optionalDependencies / peerDependencies 分组展示，依赖项链接到包详情
- [x] 6.3 实现文件树：目录逐级懒加载（`?meta` 端点），选中文件在右侧展示内容并语法高亮，文件路径写入 URL 支持刷新还原，失败时展示错误态

## 7. 下载趋势（预留）

- [x] 7.1 实现下载数据 hook（`/downloads/range/:from:today/:pkg`），处理空数据
- [x] 7.2 在包详情主页侧栏展示近 7 天下载总量与基础趋势图（shadcn Chart / recharts）
- [x] 7.3 实现 `/cnpm/pkg/:name/trends` 路由，渲染基础图或占位，不返回 404

## 8. 测试与验收

- [x] 8.1 补齐解析逻辑 vitest 测试（scoped 名、tab 识别、版本归一化）并跑通 `apps/web` 测试
- [x] 8.2 补充渲染冒烟测试（vitest + testing-library，mock registry fetch）：`/cnpm` landing、`/cnpm/search?q=`、`/cnpm/pkg/react` 渲染关键内容
- [x] 8.3 手动验证 deep-link：scoped 包、`?version=` 锁版本、深色模式切换
- [x] 8.4 运行 `pnpm verify`（lint / typecheck / test / build）确认全绿
