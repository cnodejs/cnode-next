# web-design-system-governance Specification

## Purpose

TBD - created by archiving change realign-web-design-system. Update Purpose after archive.

## Requirements

### Requirement: Base Nova 是唯一原子组件基线

Web UI SHALL 将 shadcn `base-nova` 作为 `components.json` 与 `apps/web/app/components/ui/` 的唯一 registry 基线；原子组件的结构、variant、尺寸、圆角、间距和状态样式 MUST 与锁定版本的 Base Nova 输出保持一致。

#### Scenario: 审查原子组件来源

- **WHEN** 开发者新增或更新 `components/ui/` 中的组件
- **THEN** 变更 MUST 使用项目锁定的 shadcn CLI 对 `base-nova` 执行 dry-run 和 diff
- **AND** 不得保留 legacy `new-york`、Radix wrapper 或项目专属视觉 variant。

#### Scenario: CNode 品牌不进入 primitive 源码

- **WHEN** 审查 Button、Card、Input、Table、Alert、Empty 或 overlay primitive
- **THEN** primitive MUST 只消费 Base Nova 使用的 semantic tokens
- **AND** primitive 源码 MUST NOT 包含 `cnode-*`、业务 route、权限或领域状态。

### Requirement: 页面不得视觉重定义原子组件

原子组件消费者 SHALL 只通过标准 props/variants 表达视觉和密度；`className` MUST 限于容器布局、响应式显隐、宽度约束或上游明确支持的 CSS variable，不得覆写 primitive 的颜色、高度、padding、圆角、阴影、字体或 icon 尺寸。

#### Scenario: 页面需要紧凑 Card

- **WHEN** 页面需要比默认 Card 更紧凑的内容块
- **THEN** 页面 MUST 使用 `Card size="sm"` 或 Base Nova 支持的 `--card-spacing`
- **AND** 不得分别在 CardHeader 与 CardContent 手写 padding 形成另一套密度。

#### Scenario: 页面需要响应式按钮

- **WHEN** Button 在移动端需要占满可用宽度或在断点隐藏
- **THEN** 页面 MAY 使用 `w-full` 或响应式 display class
- **AND** 不得通过 class 覆写 Button 高度、颜色、圆角或内部 icon 尺寸。

### Requirement: Application blocks 映射页面原型

Web UI SHALL 在原子组件与 route 之间提供可复用 application blocks，并 SHALL 将公共和后台 route 映射到命名页面原型；blocks 负责稳定 composition，不得复制 primitive 实现。

#### Scenario: 公共页面映射原型

- **WHEN** 审计首页、话题详情、发布编辑、认证设置、用户或招聘页面
- **THEN** 页面 MUST 分别映射到 feed、reading、compose、account 或 directory 原型
- **AND** 同类页面 MUST 复用相同的 PageHeader、内容宽度、block spacing 和 responsive composition。

#### Scenario: 后台页面映射原型

- **WHEN** 审计后台概览、管理列表或治理队列
- **THEN** 页面 MUST 分别映射到 dashboard、data-list 或 workflow 原型
- **AND** 不得为每个后台 route 重建独立 panel、toolbar、filter 和 record spacing。

### Requirement: 设计系统具备稳定文档和防漂移门禁

仓库 SHALL 在 `docs/arch/design-system.md` 提供稳定设计决策，在项目级 `cnode-web-design` Skill 提供 Agent 执行方法，并使用自动化治理检查覆盖可机器判断的漂移。

#### Scenario: 新 UI 变更进入 review

- **WHEN** PR 修改 primitive、theme、application block 或 route composition
- **THEN** CI 或本地 release gate MUST 检查配置基线、禁止的 primitive 视觉覆写和原始品牌色使用
- **AND** reviewer MUST 能从 `docs/arch/design-system.md` 与 `cnode-web-design` Skill 分别找到设计依据和执行方法。

#### Scenario: 上游组件升级

- **WHEN** 项目升级锁定的 shadcn 或 Base UI 版本
- **THEN** 每个受影响 primitive MUST 单独审查 registry diff、API、ARIA、focus 和调用方 blast radius
- **AND** 不得通过批量覆盖掩盖本地 application block 问题。
