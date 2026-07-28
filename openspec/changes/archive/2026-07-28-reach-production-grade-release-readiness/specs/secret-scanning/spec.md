## ADDED Requirements

### Requirement: CI release gate 必须执行 secret scanning
CI release verification gate SHALL 使用仓库根目录 `.gitleaks.toml` 执行 secret scan，并在发现未允许 secret 时阻断镜像发布。

#### Scenario: CI secret scan 通过
- **WHEN** GitHub Actions 运行 release verification gate 且未发现 secret
- **THEN** secret scanning step MUST 成功
- **AND** 后续验证步骤 MAY 继续执行

#### Scenario: CI secret scan 失败
- **WHEN** GitHub Actions 运行 release verification gate 且发现 `.gitleaks.toml` 规则识别出的 secret
- **THEN** release verification gate MUST 失败
- **AND** workflow MUST NOT 构建或推送生产镜像
- **AND** 输出不得展示完整 secret 值
