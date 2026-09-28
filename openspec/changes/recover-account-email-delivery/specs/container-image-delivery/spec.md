## ADDED Requirements

### Requirement: 最终 API 镜像必须保留源码运行时编译语义

最终 API 镜像 MUST 保证运行命令使用与 `apps/api/tsconfig.json` 一致的 TypeScript 和 JSX 编译语义；若镜像直接通过 `tsx` 执行源码，MUST 携带 API tsconfig 及其扩展的配置，若执行编译产物，则 MUST 在构建阶段使用该配置生成并验证产物。

#### Scenario: API 镜像直接执行 TSX 源码

- **WHEN** 最终镜像通过 `tsx` 启动 `apps/api/src` 中的源码
- **THEN** 镜像包含 `apps/api/tsconfig.json` 及其引用的基础配置
- **AND** JSX 使用 `react-jsx` 自动 runtime，不依赖未声明的全局 `React`

#### Scenario: API 镜像执行编译产物

- **WHEN** 最终镜像改为执行构建阶段产生的 JavaScript
- **THEN** 构建阶段使用 `apps/api/tsconfig.json` 成功编译 API
- **AND** 最终镜像只启动已验证的编译产物及其运行时依赖

#### Scenario: 最终镜像渲染邮件模板

- **WHEN** CI 在最终 API 镜像内以生产启动环境构建账号激活、密码重置、回复和 @ 提及邮件
- **THEN** 四类模板均生成 subject、HTML 和纯文本内容
- **AND** 运行过程不连接 SMTP、不访问外部网络且不抛出 JSX runtime 错误
