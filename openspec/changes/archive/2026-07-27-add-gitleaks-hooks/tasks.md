## 1. 命令与安装脚本

- [x] 1.1 在根 `package.json` 增加 `secrets:scan` 命令，使用 `.gitleaks.toml` 并开启 redaction。
- [x] 1.2 增加 staged secret scan 命令或脚本，用于 pre-commit 检测 staged changes。
- [x] 1.3 增加 Husky hook 安装脚本，用于安装版本化 hook。
- [x] 1.4 确认安装脚本不修改全局 git 配置。

## 2. Git Hooks

- [x] 2.1 新增 Husky 版本化 hook 目录 `.husky/`。
- [x] 2.2 实现 `pre-commit` hook：检查 `gitleaks` 是否存在，扫描 staged changes，发现泄漏时阻断提交。
- [x] 2.3 实现 `pre-push` hook：读取 Git 传入的 refs，扫描即将推送的 commit range，发现泄漏时阻断推送。
- [x] 2.4 为 hooks 增加显式跳过开关，例如 `SKIP_GITLEAKS=1`，并在输出中标记为风险操作。

## 3. 文档

- [x] 3.1 新增或更新安全文档，说明 gitleaks 安装、hooks 安装、手动扫描命令和失败处理。
- [x] 3.2 说明误报处理流程：优先修正规则或 allowlist，避免直接跳过。
- [x] 3.3 说明临时跳过 hook 的风险和命令。

## 4. 验证

- [x] 4.1 运行 `gitleaks detect --config .gitleaks.toml --redact --no-banner`，确认当前仓库无泄漏。
- [x] 4.2 运行 hook 安装脚本，确认 Husky hooks 可被 Git 调用。
- [x] 4.3 用安全的测试 fixture 验证 pre-commit 能阻断 staged secret。
- [x] 4.4 用安全的测试 fixture 验证 pre-push 能阻断推送范围内 secret。
- [x] 4.5 验证 `SKIP_GITLEAKS=1` 能跳过 hooks，并输出风险提示。
