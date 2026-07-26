## Why

仓库已经有 `.gitleaks.toml`，但缺少标准化的本地 git hook、安装方式和团队验证流程，开发者仍可能在提交前没有运行 secret 扫描。当前项目接入了数据库、Redis、GitHub OAuth、SMTP、阿里云 OSS 等敏感凭据，比 legacy `nodeclub/` 中依赖本地配置的旧流程更需要提交前自动拦截。

## What Changes

- 增加本地 git hooks，用 gitleaks 在提交或推送前扫描 staged changes / commits。
- 增加一键安装或同步 hooks 的脚本，避免要求开发者手动复制 hook 文件。
- 在根 `package.json` 增加 secret 扫描相关命令，便于本地和 CI 复用。
- 补充文档说明：如何安装 hooks、如何运行全量扫描、如何处理误报、如何临时跳过并承担风险。
- 保持 `.gitleaks.toml` 作为唯一规则源，hooks 不复制检测规则。

## Capabilities

### New Capabilities

- `secret-scanning`：定义 gitleaks 配置、git hooks、安装流程和验证要求。

### Modified Capabilities

- 无。

## Non-goals

- 不引入远程密钥管理系统或自动轮换泄漏密钥。
- 不重写 git 历史清理已提交的敏感信息。
- 不强制替换团队已有全局 git hook 或开发者本机安全工具。
- 不改变业务代码中的配置加载方式。

## Impact

- 影响根目录安全配置：`.gitleaks.toml`、`package.json`、`.husky/`。
- 影响开发者工作流：提交或推送前会自动运行 secret scan，失败时需要修复或显式跳过。
- 影响 CI 可复用命令：提供稳定的 `pnpm` 脚本供后续流水线接入。
- 不影响运行时 API、web、数据库 schema 或迁移逻辑。
