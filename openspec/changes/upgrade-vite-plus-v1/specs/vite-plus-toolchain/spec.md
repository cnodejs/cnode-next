## ADDED Requirements

### Requirement: 统一工具链版本

工作区 MUST 使用 Vite+ 1.2.0，并让 Vite alias、Vitest、catalog 与 override 指向该版本提供的工具链。

#### Scenario: 安装工作区

- **WHEN** 开发者使用受支持的 Node.js 与项目声明的 pnpm 版本安装依赖
- **THEN** API 与 Web 使用同一套 Vite+ 和 Vitest 版本，现有脚本入口仍可执行

### Requirement: 测试语义保持

迁移 MUST 保留现有测试集合和断言意图，不新增跳过项，不放宽覆盖率要求；只有验证通过才能删除新增兼容选项。

#### Scenario: 删除兼容配置

- **WHEN** 一个新增兼容选项被删除
- **THEN** 对应项目执行与兼容基线相同的测试并全部通过，否则恢复该选项及其注释

### Requirement: 构建与消费者保持

工作区 MUST 保留 API TypeScript 构建、Web React Router SSR 构建及内部包源码导出。

#### Scenario: 构建应用

- **WHEN** 执行现有工作区构建及类型检查
- **THEN** API 与 Web 构建成功，内部共享包导入和类型解析成功，无需新增库打包步骤
