## ADDED Requirements

### Requirement: 客户端导航进度条

`apps/web/app/root.tsx` 的 `Layout` 中 SHALL 渲染 `<NavProgress />` 组件。该组件 SHALL 监听 `useNavigation().state`，当 `state === "loading"` 时在 viewport 顶部展示进度条。进度条 SHALL 在导航开始 150ms 后才显示（避免快速导航闪烁），导航结束时快速走完并 fade out。进度条 SHALL 固定在 viewport 顶部，`z-50`，高度 2px，使用 `--color-primary` 颜色。

#### Scenario: 翻页时展示进度条

- **WHEN** 用户在首页点击第 2 页，触发客户端导航
- **THEN** 导航开始 150ms 后顶部出现进度条
- **AND** 新页面数据加载完成后进度条走完并消失

#### Scenario: 快速导航不闪烁

- **WHEN** 客户端导航在 150ms 内完成
- **THEN** 进度条不显示

#### Scenario: 首次 SSR 加载不触发进度条

- **WHEN** 用户直接访问 URL（SSR 首屏加载）
- **THEN** 进度条不显示（`useNavigation().state` 在初始渲染时为 `"idle"`）

### Requirement: 导航期间内容区过渡

客户端导航期间（`useNavigation().state !== "idle"`），`<main>` 内容区 SHALL 应用 `opacity-60` 过渡效果，过渡时长 SHALL 为 200ms。导航完成后 SHALL 恢复 `opacity-100`。

#### Scenario: 切 tab 时内容区渐隐

- **WHEN** 用户在首页点击"问答" tab
- **THEN** 当前内容区渐隐至 60% 透明度
- **AND** 新数据加载完成后内容区恢复完全不透明

#### Scenario: 过渡不影响交互

- **WHEN** 内容区处于渐隐状态
- **THEN** 用户仍可点击 header 导航（进度条和过渡仅限内容区，header 不受影响）
