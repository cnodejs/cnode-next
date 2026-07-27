## ADDED Requirements

### Requirement: 统一的 CNode 品牌邮件布局

系统 SHALL 为账号激活、密码重置、话题回复和 @ 提及邮件生成统一的 CNode 品牌 HTML 布局，并与 Web 的官方 logo、品牌绿 `#80bd01`、深色品牌 surface、内容卡片和主操作层级保持一致。

#### Scenario: 渲染认证邮件

- **WHEN** 系统构建账号激活或密码重置邮件
- **THEN** HTML 包含可识别的 CNode 品牌 header、邮件用途标题、说明正文、品牌主 CTA、原始链接回退和 footer
- **AND** 关键内容在 logo 图片未加载或 CSS 支持有限时仍可阅读和操作

#### Scenario: 渲染社区通知邮件

- **WHEN** 系统构建话题回复或 @ 提及邮件
- **THEN** HTML 包含统一品牌布局、话题标题、通知内容摘要和“查看话题”主 CTA
- **AND** 视觉层级与认证邮件保持一致

### Requirement: 邮件客户端兼容和响应式呈现

品牌邮件 HTML MUST 使用邮件客户端兼容的自包含结构，不依赖应用 JavaScript、外部 CSS、Web Font、Tailwind class 或 CSS variables，并 SHALL 在桌面和窄屏视口保持内容可读。

#### Scenario: 客户端不加载外部样式

- **WHEN** 邮件客户端仅渲染 HTML 和内联样式
- **THEN** header、正文、CTA、摘要和 footer 仍具有清晰顺序和可辨识层级

#### Scenario: 窄屏查看邮件

- **WHEN** 收件人在移动端窄屏视口查看邮件
- **THEN** 邮件主体不要求横向滚动即可阅读主要内容
- **AND** 长标题、摘要和 URL 可以换行而不撑破主体布局

### Requirement: HTML 与纯文本双版本

系统 MUST 为每一封账号激活、密码重置、话题回复和 @ 提及邮件同时提供 HTML 与语义等价的纯文本版本。

#### Scenario: 客户端选择纯文本部分

- **WHEN** 收件人的邮件客户端不渲染 HTML 或优先显示纯文本
- **THEN** 纯文本包含邮件用途、必要的上下文、操作说明和完整目标 URL
- **AND** 用户无需查看 HTML 部分即可完成对应操作

#### Scenario: 回复通知的纯文本内容

- **WHEN** 系统构建话题回复或 @ 提及通知
- **THEN** 纯文本包含话题标题、回复或提及摘要以及完整话题链接

### Requirement: 不可信内容安全渲染

系统 MUST 将话题标题、回复内容和其它外部动态字符串视为不可信纯文本，并在插入 HTML 文本或属性上下文前进行对应转义；通知正文 MUST NOT 将用户提交的 Markdown 或 HTML 作为可信标记直接执行。

#### Scenario: 标题包含 HTML 特殊字符

- **WHEN** 话题标题包含 `<script>`、引号、尖括号或 `&`
- **THEN** HTML 邮件将其显示为文本而不是创建元素、属性或脚本
- **AND** 纯文本邮件保留可读内容

#### Scenario: 回复包含用户 HTML

- **WHEN** 回复内容包含链接标签、图片标签、style 或事件处理属性
- **THEN** 邮件摘要将这些输入作为文本呈现
- **AND** 用户内容不能改变邮件布局或注入可执行标记

#### Scenario: 目标 URL 使用不安全协议

- **WHEN** 社区通知模板收到非 `http:` 或 `https:` 的目标 URL
- **THEN** 模板拒绝将该值渲染为可点击 CTA
- **AND** 不生成使用危险协议的 `href`

### Requirement: 认证操作链接正确构造

账号激活和密码重置邮件 MUST 基于去除尾部斜杠后的 `APP_WEB_BASE_URL` 构建目标地址，并对 retrieve key 进行 URL 编码；未配置时 SHALL 延续本地开发地址 `http://localhost:5173`。

#### Scenario: 构建账号激活链接

- **WHEN** 系统为 retrieve key 构建账号激活邮件
- **THEN** HTML CTA、HTML 原始链接和纯文本链接均指向 `/active_account?key=<encoded-key>`

#### Scenario: 构建密码重置链接

- **WHEN** 系统为 retrieve key 构建密码重置邮件
- **THEN** HTML CTA、HTML 原始链接和纯文本链接均指向 `/reset_pass?key=<encoded-key>`

### Requirement: 保持现有通知业务语义

品牌模板切换 MUST NOT 改变 `nodeclub` 对应业务在 cnode-next 中已经实现的邮件类型、触发条件、用户通知偏好、站内消息去重、收件人、主题用途或 SMTP 重试行为。

#### Scenario: 用户关闭社区邮件通知

- **WHEN** 用户关闭 `receive_reply_mail` 或 `receive_at_mail`
- **THEN** 对应业务流程仍不发送该类邮件
- **AND** 品牌模板不会绕过调用方的偏好判断

#### Scenario: 同一用户同时是话题作者和被提及者

- **WHEN** 现有消息去重规则判定只发送一封邮件
- **THEN** 模板切换后仍只调用一次对应邮件发送

#### Scenario: SMTP 临时失败

- **WHEN** nodemailer 投递失败
- **THEN** `sendMail` 保持现有最多五次尝试的行为
- **AND** 模板构建不引入额外发送或重试层

### Requirement: 模板输出可独立验证

系统 SHALL 允许在不连接真实 SMTP 的情况下构建并测试四类邮件输出。

#### Scenario: 单元测试构建邮件

- **WHEN** 测试使用固定输入构建任一邮件
- **THEN** 可以直接断言 subject、HTML 和 text
- **AND** 测试不需要 SMTP 凭据、网络访问或数据库连接

#### Scenario: 验证安全边界

- **WHEN** 测试传入包含特殊字符、恶意 HTML 和危险 URL 的输入
- **THEN** 输出满足文本转义和协议限制要求
