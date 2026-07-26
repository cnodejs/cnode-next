## Requirements

### Requirement: 语义 token 单一来源

`apps/web/app/styles/global.css` SHALL 用 Tailwind v4 CSS-first `@theme inline` 声明完整语义 token 集合,涵盖 `--background`/`--foreground`/`--primary`/`--primary-foreground`/`--secondary`/`--secondary-foreground`/`--muted`/`--muted-foreground`/`--accent`/`--accent-foreground`/`--destructive`/`--destructive-foreground`/`--border`/`--input`/`--ring`/`--card`/`--card-foreground`/`--popover`/`--popover-foreground`/`--radius`。token 值 MUST 在 `:root`(light)与 `.dark`(dark)下分别定义。

#### Scenario: 组件使用语义 class 而非字面量色值

- **WHEN** 任意组件渲染卡片背景
- **THEN** 使用 `bg-card text-card-foreground`,不出现 `bg-white dark:bg-[#161b22]` 或任何 `#` 字面量色值

#### Scenario: 切换 dark mode 不改组件代码

- **WHEN** `<html>` 元素添加/移除 `dark` class
- **THEN** 所有使用语义 class 的组件自动切换配色,无需在组件内写 `dark:` 变体

### Requirement: 三态主题切换

系统 SHALL 支持 `light` / `dark` / `system` 三态切换,在三者间循环。`system` 态 MUST 监听 `prefers-color-scheme` 媒体查询变化,系统主题改变时实时跟随。

#### Scenario: 用户从 dark 切换到 system

- **WHEN** 系统主题为 light 且用户切到 system
- **THEN** 界面立即切为 light,且之后系统主题改为 dark 时界面自动跟随

#### Scenario: 刷新保留主题选择

- **WHEN** 用户选择 dark 后刷新页面
- **THEN** 主题仍为 dark,且 FOUC(闪白)被 root.tsx 的 inline script 阻断

### Requirement: 防 FOUC inline script 保留

`apps/web/app/root.tsx` 的 `<head>` 内 MUST 保留同步执行的 inline script,在任何 React 渲染前读 localStorage 并给 `<html>` 加 `dark` class。zustand theme store MUST NOT 接管该初始化逻辑,只负责交互后的切换。

#### Scenario: 首次 SSR 渲染已带正确 class

- **WHEN** 服务端返回 HTML
- **THEN** inline script 已在 `<head>` 执行完毕,`<html>` 已有/无 `dark` class,首屏不闪白

### Requirement: 字面量色值清零

完成迁移后,`apps/web/app/` 下所有 `.tsx`/`.ts` 文件 MUST NOT 包含硬编码十六进制色值(如 `#0d1117`/`#161b22`/`bg-white dark:bg-[#...]`)。颜色全部由 token 派生。

#### Scenario: grep 检查无字面量

- **WHEN** 在 `apps/web/app` 下搜索 `#[0-9a-fA-F]{3,6}` 或 `bg-white dark:`
- **THEN** 无匹配项

### Requirement: tokens 文件只含 token 定义

`styles/global.css` MUST 只包含 token 定义与 `@theme inline` 块,不得包含业务样式或组件样式。组件样式由 Tailwind class 在组件内表达。

#### Scenario: 全局 CSS 只剩 token

- **WHEN** 查看 `styles/global.css`
- **THEN** 内容仅为 `@import "tailwindcss"`、`@theme inline { ... }`、`:root { ... }`、`.dark { ... }`,无其他规则
