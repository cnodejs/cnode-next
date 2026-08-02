## 1. MVP：公开用户资料契约

- [x] 1.1 扩展 `packages/shared` 的用户详情 schema 与 DTO，增加 nullable `location`、`url`、`signature` 和去重的 `identities` 枚举数组，并保持轻量 `authorSchema` 不变。
- [x] 1.2 在 API 建立统一公开身份解析，按 `APP_ADMINS`、有效 `moderator` role、有效 `recruiter` role 独立生成身份，并删除 `APP_MODERATORS` 的全部读取。
- [x] 1.3 扩展 `GET /api/v1/user/:loginname` 返回公开资料、身份和真实统计，不返回 `weibo`、email、token 等非公开字段。
- [x] 1.4 增加 API/shared contract 测试，覆盖仅管理员、管理员加猎头、版主加猎头、全部身份、空资料和敏感字段不公开。

## 2. MVP：用户详情页

- [x] 2.1 重构用户 Hero，以头像、用户名、多重身份、注册时间、所在地、网站、GitHub 和纯文本签名建立公开资料层级，并隐藏空字段。
- [x] 2.2 将用户页社区统计改为 `score`、`topic_count`、`reply_count`、`collect_topic_count`，不再使用 recent 数组长度表示总数。
- [x] 2.3 将屏蔽内容、禁言和删除所有发言收纳到单一管理菜单，仅管理员查看他人主页时显示，并保留危险操作确认对话框。
- [x] 2.4 增加用户 Hero 与管理菜单测试，覆盖多身份、空资料、安全外链、本人不可治理和 destructive 最终确认。

## 3. MVP：话题详情作者上下文

- [x] 3.1 在话题详情页面层根据轻量 `topic.author.loginname` 查询用户公开资料，复用短 TTL 用户缓存，并在查询失败时回退到头像、用户名和主页入口。
- [x] 3.2 重构右侧作者卡，展示多重身份、已填写的签名/所在地/网站/GitHub、真实社区统计和主页入口，不渲染最近创建、最近参与或最新回复列表。
- [x] 3.3 将“参与讨论前”入口改为“查看讨论规范”，链接到 `/about#discussion`。
- [x] 3.4 增加作者资料成功、资料查询失败降级、移动端布局和作者卡不包含动态列表的测试。

## 4. Feature-complete：About 内容合并

- [x] 4.1 重写 `/about`，按社区介绍、参与指南、讨论与内容规范、常见问题组织原 `/about`、`/getstart`、`/faq` 内容。
- [x] 4.2 为 `/about` 提供 `#guide`、`#discussion`、`#faq` 稳定锚点，并将 Hero 次 CTA 改为参与指南页内入口。
- [x] 4.3 验证 `/about` 在桌面与移动端的层级、锚点偏移、外链安全和无横向溢出。

## 5. Feature-complete：导航与 Footer 收束

- [x] 5.1 将桌面 Header 的关于下拉替换为直接指向 `/about` 的一级“关于”链接。
- [x] 5.2 将移动端导航和 CommandPalette 收束为单一 `/about` 入口，移除新手指南与常见问题独立入口。
- [x] 5.3 将 Footer 左侧 CTA 改为“发布话题 / 了解社区”，并按社区、资源、开发者的确定结构重组链接。
- [x] 5.4 删除 Footer 中搜索、社区介绍、重复 RSS 订阅和所有旧指引页面链接，并验证桌面/移动端布局。

## 6. Feature-complete：Breaking 路由清理

- [x] 6.1 从 Web 路由表删除 `/help`、`/faq`、`/getstart` 和 `/:name` 注册。
- [x] 6.2 删除 `help.tsx`、`faq.tsx`、`getstart.tsx`、`legacy-user-redirect.$name.tsx` 页面文件，不新增重定向兼容。
- [x] 6.3 全仓扫描生产代码中的 `/help`、`/faq`、`/getstart`、`legacy-user-redirect`、`route(":name"` 引用并清理遗漏。
- [x] 6.4 验证旧路径和未知一级路径进入标准 not-found，`/user/:name` 及其 topics/replies/collections 子路由保持正常。

## 7. 验证与归档准备

- [x] 7.1 运行受影响的 API 与 Web 测试，并运行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- [x] 7.2 运行 `openspec validate refine-public-information-experience --type change --strict --no-interactive`，确认所有 delta requirements、场景和移除迁移说明有效。
- [x] 7.3 对照 proposal、specs、design 和实现检查 diagram/data-flow 一致性，确认 git diff 不含数据库 schema、migration、seed 或 `weibo` 列删除。
- [x] 7.4 执行发布前全站入口审计，确认 Header、移动端、CommandPalette、Footer、About、用户主页和话题详情满足同一信息架构并可归档。
