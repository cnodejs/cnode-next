## 1. MVP：数据完整性与共享契约

- [x] 1.1 增加只读预检，统计非空 `github_id` 重复分组；发现重复时以非零状态中止且不输出 access token
- [x] 1.2 为 `packages/db` 的 nullable `users.github_id` 增加唯一索引和 PostgreSQL migration，并验证多个 `NULL` 可共存
- [x] 1.3 在 `packages/shared` 增加 GitHub 解绑请求 Zod schema 与对应类型，限定请求只接受当前密码
- [x] 1.4 扩展用户数据查询，支持按 GitHub ID 检查占用、读取解绑所需凭据及事务清空三个 GitHub 字段

## 2. MVP：绑定与解绑安全边界

- [x] 2.1 将 `intent=bind` callback 实现为未绑定写入、同 ID 幂等、不同 ID 拒绝的三态状态机，且冲突时不修改既有 GitHub 字段
- [x] 2.2 将注册新账号和关联老账号的 GitHub 写入纳入相同占用检查，并把数据库 unique violation 转换为稳定业务冲突响应
- [x] 2.3 实现 GitHub OAuth token revoke client，使用 OAuth App 凭据、超时和响应分类，确保日志不包含认证 header、token 或原始敏感响应
- [x] 2.4 为被拒绝且未持久化的 bind token 增加 best-effort revoke，并保证远端失败不改变既有绑定
- [x] 2.5 实现 `POST /api/v1/auth/github/unbind`：校验 Session、绑定状态、共享 schema 和当前 bcrypt 密码，并接入认证类限流
- [x] 2.6 在远端 token 已撤销、失效或不存在后事务清空 `github_id`、`github_username`、`github_access_token`，保留 Session、avatar 和其他账号数据
- [x] 2.7 为绑定成功、幂等绑定、绑定冲突、解绑成功和分类失败写脱敏审计，验证密码、OAuth code、client secret 和 token 均不进入 detail

## 3. 功能完整：设置页统一 UI

- [x] 3.1 将“账号身份”Card 重构为邮箱与 GitHub 共用的身份列表行，统一图标、名称、值、Badge、边界和行尾操作
- [x] 3.2 实现 GitHub 已绑定与未绑定两种行状态，分别展示 username、`已绑定`、解绑操作及 `未绑定`、绑定操作
- [x] 3.3 使用 shadcn Dialog、`react-hook-form`、共享 schema 和 `zodResolver` 实现密码确认解绑表单及提交中防重复状态
- [x] 3.4 增加解绑影响说明、`/search_pass` 密码重置入口、成功后数据刷新与失败 toast，确保密码不回显到其他页面区域
- [x] 3.5 补齐 bind 冲突、解绑成功和可重试失败的用户文案，并在桌面及移动宽度验证列表行不溢出、操作可触达

## 4. 功能完整：自动化验证

- [x] 4.1 增加 API 行为测试，覆盖首次绑定、同 ID 幂等、不同 ID 防覆盖、其他用户占用及并发 unique 冲突
- [x] 4.2 增加解绑测试，覆盖未登录、未绑定、密码错误、无密码 hash、远端成功、token 不存在、远端暂时失败和本地事务失败后重试
- [x] 4.3 增加数据层测试，验证唯一索引允许多个 `NULL`、拒绝重复非空 GitHub ID，并验证解绑只清空三个目标字段
- [x] 4.4 增加设置页测试，覆盖已绑定/未绑定统一布局、Dialog 可访问名称、schema 错误、提交中状态、成功刷新和密码重置链接
- [x] 4.5 增加安全断言，扫描 API 响应、测试日志和 audit detail，确保不出现测试密码、GitHub access token、OAuth code 或 client secret

## 5. 发布验收

- [x] 5.1 运行相关单元与集成测试、`pnpm typecheck`、`pnpm lint` 和受影响包 build，修复全部回归
- [x] 5.2 在测试环境使用两个 GitHub 身份执行绑定、重复绑定、防换绑、密码重置后解绑和重新绑定 smoke
- [x] 5.3 在生产 migration 前运行重复 `github_id` 只读预检，确认结果为零后应用 migration，并验证唯一索引存在
- [x] 5.4 部署后在桌面与移动端验收账号身份 UI，并验证解绑成功后 GitHub 登录不再命中原账号、本地密码登录和当前 Session 仍可用
