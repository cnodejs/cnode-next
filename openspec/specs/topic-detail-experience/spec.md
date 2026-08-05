# topic-detail-experience Specification

## Purpose

定义话题详情页的阅读布局、上下文信息、正文展示和状态处理要求，确保迁移后的话题内容在桌面和移动端都具备清晰层级、可读排版和可用交互。

## Requirements

### Requirement: Topic 详情 reading layout

Topic 详情页 SHALL 根据 viewport 使用 reading layout，包含主 topic 内容和右侧上下文 rail。目录不得占用独立左侧 rail；主内容列在响应式断点前后 MUST 保持连续且可读的宽度变化。

#### Scenario: 大桌面 reading layout

- **WHEN** topic 详情页在大桌面 viewport 渲染
- **THEN** 它使用中间内容列和右侧上下文 rail
- **AND** 内容列保持可读行宽
- **AND** viewport 从 `xl` 断点下方跨到上方时，内容列不会因新增左侧 rail 而骤然缩窄。

### Requirement: 面包屑和分类上下文

Topic 详情页 SHALL 在标题前展示包含首页和本地化分类标签的面包屑上下文。

#### Scenario: 面包屑使用用户可读标签

- **WHEN** tab 为 `ask` 的 topic 渲染
- **THEN** 面包屑或分类上下文展示“问答”等用户可读标签，而不是仅展示 raw `ask`。

### Requirement: Topic Header 信息层级

Topic Header SHALL 包含状态 badges、分类 tag、标题、作者、发布时间、可用时的最后回复时间、回复数、浏览数和 actions。当 `tab='job'` 且有 `job_meta` 时，content Card 内部 SHALL 在 MarkdownView 上方渲染 `JobMetaCard`。

#### Scenario: Topic Header metadata

- **WHEN** topic 详情页渲染
- **THEN** 作者、发布时间、回复数、浏览数和 tags 在标题附近以设计好的 metadata layout 可见。

#### Scenario: 招聘详情页渲染 meta 卡片

- **WHEN** `tab='job'` 且 `job_meta` 非空的 topic 详情页渲染
- **THEN** content Card 内部在 MarkdownView 上方渲染 JobMetaCard
- **AND** JobMetaCard 展示 logo/公司/职位/徽章组（地点/远程/薪资/经验）/tech_tags/contact/CTA
- **AND** CTA 按 contact 形态分发行为（mailto / 外链 / Sheet 展示）

#### Scenario: 非招聘详情页不渲染 meta 卡片

- **WHEN** `tab` 不为 `'job'` 的 topic 详情页渲染
- **THEN** content Card 内部直接渲染 MarkdownView
- **AND** 不渲染 JobMetaCard

#### Scenario: 历史招聘帖无 meta 不渲染卡片

- **WHEN** `tab='job'` 但 `job_meta` 为 null 的 topic 详情页渲染
- **THEN** content Card 内部直接渲染 MarkdownView
- **AND** 不渲染 JobMetaCard

### Requirement: Topic body surface

Markdown 内容 SHALL 在专门的可读 surface 中渲染，并使用品牌 prose 样式。

#### Scenario: Markdown prose 样式

- **WHEN** topic 内容包含 headings、links、blockquotes、code blocks、tables 或 images
- **THEN** 每类元素都使用可读间距、品牌链接色、安全代码样式和响应式图片/表格行为。

### Requirement: Topic TOC

Topic 详情页 SHALL 在正文存在至少四个合格 Markdown h2/h3 headings 时生成 TOC，并将 TOC 作为正文顶部默认折叠的 disclosure；桌面和移动端 SHALL 使用同一内容结构且不占用固定侧边 rail。

#### Scenario: 长文显示折叠 TOC

- **WHEN** topic body 包含至少四个合格 h2/h3 headings
- **THEN** 正文开始处显示可展开的目录及章节数量
- **AND** 目录默认折叠
- **AND** TOC links 滚动到稳定 heading anchors。

#### Scenario: 短文不显示 TOC

- **WHEN** topic body 包含少于四个合格 h2/h3 headings
- **THEN** 页面不渲染空目录或低价值目录控件。

#### Scenario: 移动端展开和跳转

- **WHEN** 移动端用户展开目录并选择一个章节
- **THEN** 页面跳转到对应稳定 heading anchor
- **AND** 目录在跳转后收起
- **AND** 页面不产生固定侧栏或水平溢出。

### Requirement: Topic context rail

Topic 详情页 SHALL 包含右侧上下文 rail，展示作者公开资料摘要、topic stats 和讨论规范入口。作者卡 SHALL 通过页面级用户资料查询获得扩展信息，而不是扩充 topic DTO 的轻量 author 摘要。

#### Scenario: Context rail 包含作者上下文

- **WHEN** topic 详情页在桌面端渲染且作者资料查询成功
- **THEN** 右侧作者卡展示头像、用户名、公开身份、已填写的签名、所在地、个人网站、GitHub 和社区统计
- **AND** 提供指向 `/user/:name` 的用户主页入口
- **AND** 不在作者卡内展示最近创建、最近参与或最新回复列表。

#### Scenario: 作者扩展资料查询失败

- **WHEN** topic 正常加载但页面级作者资料查询失败
- **THEN** 右侧作者卡使用 topic author 摘要展示头像、用户名和主页入口
- **AND** 话题正文、回复和其他操作保持可用。

#### Scenario: 移动端作者上下文

- **WHEN** topic 详情页在移动端渲染
- **THEN** 作者卡进入正文之后的上下文区域并保持可读
- **AND** 不产生横向溢出或固定侧栏。

### Requirement: Topic 状态处理

Topic 详情 SHALL 为 loading、not-found、deleted、locked、no-reply 和 unauthenticated reply 状态提供设计好的 UI。

#### Scenario: Locked topic 回复状态

- **WHEN** topic 被锁定
- **THEN** 页面在 topic header 附近展示锁定提示
- **AND** 回复编辑器被替换为解释性的 disabled state。

### Requirement: 话题详情必须暴露收藏状态控制

话题详情 SHALL 展示当前登录用户是否已收藏该话题，并 SHALL 支持用户不离开页面即可收藏或取消收藏。

#### Scenario: 当前用户未收藏话题

- **WHEN** topic detail data 返回 `is_collect: false`
- **THEN** action 区域展示收藏操作
- **AND** 点击后调用收藏 API
- **AND** 成功完成后刷新或更新可见状态

#### Scenario: 当前用户已收藏话题

- **WHEN** topic detail data 返回 `is_collect: true`
- **THEN** action 区域展示已收藏/取消收藏操作
- **AND** 点击后调用取消收藏 API
- **AND** 成功完成后刷新或更新可见状态

#### Scenario: 匿名用户尝试收藏

- **WHEN** 匿名用户尝试收藏或取消收藏话题
- **THEN** UI 提示登录或展示带说明的禁用态
- **AND** 不展示静默失败的死控件

### Requirement: 话题详情编辑入口与原文编辑

话题详情页 SHALL 为有编辑权限的用户提供可发现的编辑入口，并且话题编辑页 MUST 使用原始 Markdown 内容初始化编辑器，行为对齐 legacy `nodeclub/views/topic/index.html`、`nodeclub/controllers/topic.js` 和 `egg-cnode/app/controller/topic.js`。

#### Scenario: 作者看到编辑入口

- **WHEN** 已登录用户查看自己发布的未删除话题详情页
- **THEN** action 区域 MUST 显示“编辑话题”或等价编辑入口
- **AND** 入口 MUST 导航到 `/topic/:tid/edit`

#### Scenario: 管理员看到编辑入口

- **WHEN** admin 用户查看他人发布的未删除话题详情页
- **THEN** action 区域 MUST 显示“编辑话题”或等价编辑入口
- **AND** 入口 MUST 导航到 `/topic/:tid/edit`

#### Scenario: 非作者普通用户不看到编辑入口

- **WHEN** 普通登录用户查看他人发布的未删除话题详情页
- **THEN** action 区域 MUST NOT 显示可用的编辑话题入口

#### Scenario: 编辑页加载 Markdown 原文

- **WHEN** 有权限用户打开 `/topic/:tid/edit`
- **THEN** 编辑页 MUST 通过 `mdrender=false` 或等价 API 行为获取 topic content
- **AND** MarkdownEditor MUST 使用数据库中的原始 Markdown 文本初始化
- **AND** 不得把已渲染 HTML 作为可编辑正文写入编辑器

#### Scenario: 提交编辑继续复用兼容 API

- **WHEN** 用户在话题编辑页提交合法 title、tab 和 content
- **THEN** Web app MUST 调用 `POST /api/v1/topics/update`
- **AND** 成功后 MUST 返回或导航到该话题详情页

### Requirement: Topic action surface 分层

话题详情正文后的 action surface SHALL 将主互动、页内导航和更多/管理动作分层展示，避免收藏、查看回复、编辑、举报和管理操作以同级按钮零散平铺。收藏/取消收藏、查看回复和举报 MUST 保持普通动作语义；作者编辑自己的话题 MUST 直接可见；admin 编辑他人话题 MUST 位于单一“管理”菜单；有既有权限的 mod 或 admin 执行置顶、高亮和删除时，这些动作 MUST 收纳在同一“管理”菜单中。该分层 MUST NOT 改变任何角色原有的动作权限。

#### Scenario: 主互动和页内导航分离

- **WHEN** 话题详情正文渲染完成
- **THEN** 收藏/取消收藏作为主互动操作展示
- **AND** “查看回复”作为页内导航操作展示
- **AND** 两者在视觉上不与高风险管理动作同级混排。

#### Scenario: 更多和管理动作归组

- **WHEN** 当前用户具备编辑、举报或管理权限
- **THEN** 编辑话题、举报、置顶、高亮和删除等动作 SHALL 归入更多/管理区域或等价分组
- **AND** destructive 动作必须保持明确危险语义和确认流程。

#### Scenario: 普通互动和页内导航保持可见

- **WHEN** 话题详情正文渲染完成
- **THEN** 收藏/取消收藏 MUST 作为普通互动操作展示
- **AND** “查看回复” MUST 作为页内导航操作展示
- **AND** 两者 MUST NOT 与置顶、高亮或删除平铺为同级管理按钮。

#### Scenario: 登录用户举报话题

- **WHEN** 有举报权限的普通登录用户查看他人话题
- **THEN** 页面 MUST 提供举报这一普通用户动作
- **AND** 举报 MUST NOT 被表达为管理权限或放入仅管理人员可见的“管理”菜单
- **AND** 用户 MUST NOT 因可举报而看到置顶、高亮、删除或编辑他人话题入口。

#### Scenario: 作者直接编辑自己的话题

- **WHEN** 作者查看自己发布且可编辑的话题
- **THEN** “编辑话题” MUST 作为直接可见操作展示
- **AND** 作者不得仅因拥有编辑权限而看到置顶、高亮或删除等管理动作。

#### Scenario: 管理员编辑他人话题

- **WHEN** admin 查看他人发布且可编辑的话题
- **THEN** “编辑话题” MUST 位于单一“管理”菜单内
- **AND** 页面 MUST NOT 在菜单外重复平铺管理员编辑入口。

#### Scenario: 版主或管理员打开管理菜单

- **WHEN** mod 或 admin 查看其按既有权限可管理的话题并打开“管理”菜单
- **THEN** 其有权限执行的置顶或取消置顶、高亮或取消高亮、删除动作 MUST 位于同一菜单
- **AND** 无权限的动作 MUST 不可执行或不展示
- **AND** 菜单组织方式 MUST NOT 扩大 mod、admin、作者或普通用户的既有权限矩阵。

#### Scenario: 删除话题需要确认

- **WHEN** 有权限的用户从“管理”菜单触发删除话题
- **THEN** 页面 MUST 展示说明目标话题和删除影响的确认对话框
- **AND** 只有最终确认操作 MUST 使用 destructive 语义
- **AND** 用户取消时 MUST 不改变话题状态并将焦点返回管理入口。

#### Scenario: 移动端 action surface 可用

- **WHEN** 话题详情页在移动端渲染
- **THEN** 主互动和查看回复仍可直接触达
- **THEN** 收藏/取消收藏、查看回复和作者直接编辑 MUST 保持可触达
- **AND** 低频或管理动作可以折叠，但不得消失或变成不可发现的死控件
- **AND** 举报和“管理”菜单 MAY 按普通动作与管理动作层级折叠，但不得消失或变成不可发现的死控件
- **AND** 菜单内容 MUST 可滚动且不得被底部 safe area 遮挡。

### Requirement: 参与讨论提示指向合并后的规范

话题详情页的“参与讨论前”模块 SHALL 指向 `/about` 内的讨论规范，不得引用已删除的新手指南页面。

#### Scenario: 查看讨论规范

- **WHEN** 用户点击话题详情页“查看讨论规范”
- **THEN** 应用导航到 `/about#discussion`
- **AND** 页面定位到讨论与内容规范区块。

### Requirement: 话题动作异步反馈

话题收藏、举报、编辑跳转和管理 mutation SHALL 提供与动作一致的 pending、success 和 error 状态；管理操作完成后 MUST 保留用户在当前话题及回复位置的阅读上下文，除非删除成功后该话题不再可访问。

#### Scenario: 收藏状态更新

- **WHEN** 用户触发收藏或取消收藏且请求进行中
- **THEN** 对应控件 MUST 防止重复触发并表达进行中状态
- **AND** 成功后 MUST 更新收藏状态并播报结果
- **AND** 失败时 MUST 保留操作前状态并播报错误。

#### Scenario: 管理操作失败

- **WHEN** 置顶、高亮或删除请求失败
- **THEN** 页面 MUST 保留操作前的话题状态、滚动位置和可用动作
- **AND** 用户 MUST 收到可见且可由辅助技术感知的错误反馈。

#### Scenario: 删除成功

- **WHEN** 用户确认删除且请求成功
- **THEN** 页面 MUST 播报删除成功
- **AND** 页面 MUST 导航到既有删除后目的地或展示既有 deleted 状态
- **AND** 不得短暂恢复为可交互的未删除状态。
