## Why

工作区仍使用 Vite+ 0.2.8 和 Vitest 4.1.10。需要升级到 Vite+ 1.2.0，并在 Vitest 5 默认行为变化后保持现有测试意图与应用构建结果。

## What Changes

- 使用目标版本的迁移器更新 pnpm catalog、override、锁文件及测试配置。
- 先保留迁移器生成的兼容配置验证基线，再逐项验证是否可以采用新默认值。
- 保留现有 API TypeScript 构建、Web React Router SSR 构建及共享包源码导出。

## Capabilities

### New Capabilities

- `vite-plus-toolchain`: 工作区使用统一的 Vite+ 1.x 工具链，测试与构建行为经过验证。

### Modified Capabilities

无。

## Impact

范围包括工作区依赖、工具配置以及必要的局部测试修复。受影响系统为 API、Web 与内部共享包的开发验证流程。风险集中在 mock 生命周期、测试发现、类型声明与构建插件兼容性；不涉及数据库、权限或线上配置。

## Non-goals

不改变业务行为、UI、数据库或部署拓扑；不添加新的库打包流程；不减少测试、放宽断言或覆盖率要求。不修改参考项目 `../nodeclub/` 与 `egg-cnode/`。

## Documentation Impact

使用 `cnode-docs` 管理本变更的 OpenSpec 文档。命令与依赖仍以 `package.json` 和 `pnpm-workspace.yaml` 为准。现有入口与部署方式不变，因此 `docs/arch/`、`docs/biz/`、`docs/deployment/`、根治理文件及 app README 无需复制工具版本说明。现有文件适配格式化检查；生成的 Web API 文档仅调整格式，生成命令同步格式化输出，API 内容保持不变。
