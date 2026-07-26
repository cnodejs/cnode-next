## ADDED Requirements

### Requirement: Gitleaks 配置作为唯一规则源

仓库 SHALL 使用根目录 `.gitleaks.toml` 作为 secret scanning 的唯一规则源。所有本地命令、git hooks 和后续 CI 命令 MUST 显式使用该配置文件。

#### Scenario: 手动运行全量扫描
- **WHEN** 开发者运行项目定义的 secret scan 命令
- **THEN** 命令使用 `.gitleaks.toml`
- **AND** 输出不得展示完整 secret 值

### Requirement: 本地 hooks 可一键安装

仓库 SHALL 提供一条项目命令安装本地 git hooks。安装命令 MUST 使用 Husky 安装仓库内版本化 hook。

#### Scenario: 安装 hooks
- **WHEN** 开发者运行 hooks 安装命令
- **THEN** 当前仓库安装了 Husky 管理的本地 hooks
- **AND** 不修改全局 git 配置

### Requirement: pre-commit 阻断 staged secrets

本地 pre-commit hook MUST 在创建 commit 前扫描 staged changes。检测到 secret 时 MUST 阻断提交，并提示开发者修复内容或更新 allowlist。

#### Scenario: staged secret 被阻断
- **WHEN** staged changes 包含 `.gitleaks.toml` 规则识别出的 secret
- **THEN** `git commit` 被阻断
- **AND** 输出包含运行 gitleaks 的失败提示

#### Scenario: staged changes 无 secret
- **WHEN** staged changes 不包含 secret
- **THEN** `git commit` 可以继续

### Requirement: pre-push 阻断即将推送的 secrets

本地 pre-push hook MUST 扫描即将推送的 commit range。检测到 secret 时 MUST 阻断推送。

#### Scenario: 推送范围内 secret 被阻断
- **WHEN** 即将推送的 commit range 包含 secret
- **THEN** `git push` 被阻断
- **AND** 输出包含失败原因和手动复查命令

### Requirement: 缺少 gitleaks 时 fail closed

本地 hooks MUST 在找不到 `gitleaks` 命令时失败，并提示安装方式或项目文档位置。hooks MUST NOT 静默跳过 secret scanning。

#### Scenario: 未安装 gitleaks
- **WHEN** 开发者运行 `git commit` 或 `git push` 且本机没有 `gitleaks`
- **THEN** hook 阻断操作
- **AND** 输出提示安装 gitleaks

### Requirement: 文档说明安装、扫描和跳过策略

仓库 SHALL 文档化 secret scanning 的安装流程、手动扫描命令、误报处理方式和临时跳过方式。临时跳过方式 MUST 显式命名为风险操作。

#### Scenario: 开发者查看文档
- **WHEN** 开发者需要配置本地 secret scanning
- **THEN** 文档提供安装命令、扫描命令、失败处理和跳过风险说明
