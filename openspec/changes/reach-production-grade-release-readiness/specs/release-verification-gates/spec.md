## ADDED Requirements

### Requirement: 发布验证入口必须统一

项目 SHALL 提供统一的 `pnpm verify` 命令作为本地、CI 和生产部署前的发布准入入口。

#### Scenario: 本地运行发布验证
- **WHEN** 开发者在仓库根目录运行 `pnpm verify`
- **THEN** 命令 MUST 执行 lint、typecheck、test、build、OpenSpec strict validate 和 secret scan
- **AND** 任一子命令失败时 `pnpm verify` MUST 以非零退出码失败

#### Scenario: CI 复用同一验证入口
- **WHEN** GitHub Actions 验证 PR 或 main 分支提交
- **THEN** workflow MUST 运行与本地一致的 `pnpm verify`
- **AND** workflow MUST NOT 使用少于本地发布验证的命令集合

### Requirement: 发布门禁必须阻断失败变更
发布验证 gate SHALL 在代码质量、类型、测试、构建、OpenSpec 或 secret scan 任一项失败时阻断镜像发布。

#### Scenario: lint 失败阻断发布
- **WHEN** `pnpm lint` 返回非零退出码
- **THEN** `pnpm verify` MUST 失败
- **AND** CI MUST NOT 构建或推送生产镜像

#### Scenario: OpenSpec strict validate 失败阻断发布
- **WHEN** `openspec validate --all --strict` 返回非零退出码
- **THEN** `pnpm verify` MUST 失败
- **AND** CI MUST NOT 构建或推送生产镜像

#### Scenario: secret scan 失败阻断发布
- **WHEN** secret scan 发现未允许的 secret
- **THEN** `pnpm verify` MUST 失败
- **AND** CI MUST NOT 构建或推送生产镜像
