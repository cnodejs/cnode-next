## 1. 合约与数据库基线

- [x] 1.1 更新 `.cnode-ops.md` 使用约定，要求每次 SSH 连接前打印并确认 alias，且不得输出真实主机地址、连接串或凭据。
- [x] 1.2 在 `packages/shared` 定义保留旧 key 并包含 `tech/ai/ideas/career/life/event` 的共享有效 Tab 集合，更新创建/编辑 Zod enum 和相关类型测试。
- [x] 1.3 新增 reviewed PostgreSQL migration：幂等插入新 tabs、更新基线 label/scope/sort order、保留 visible 运营值，并在删除 `test` 注册行前事务性断言规范化 `test` topic 为 0。
- [x] 1.4 更新 `packages/db/src/seed.ts`，移除 `test`、加入新 tabs，并验证重复 seed 不重置 visible 或修改 topic 数据。
- [x] 1.5 在连接测试数据库前打印并确认 SSH alias，执行只读 Tab 聚合与 migration 演练，验证 `share/ask` 数量不变、`test` 零引用检查和回滚失败路径，不输出用户内容或环境秘密。

## 2. Topic API 与公开可见性

- [x] 2.1 更新 Topic 创建和编辑路由以接受新增公开 key，拒绝 `all/good/test`，并保持 `job` 权限、`job_meta` 校验及 `dev` 现有写入边界。
- [x] 2.2 更新 topic list/count 查询，使 `all` 包含合法 `job` topic、普通公开 Tab 可独立筛选、`good` 保持精选语义、普通用户不能读取 `dev`，且 `test` 返回验证错误或空结果。
- [x] 2.3 将 sidebar、用户聚合、收藏、feed、搜索、RSS 和后台公开统计中的 `dev/test` 活跃集合收敛为当前 `dev` 可见性规则，并确认退役 `test` 不会成为公开 key。
- [x] 2.4 更新 Tab 管理 API 和后台话题筛选数据源，覆盖新 key、移除 `test`，并保持 key/scope 不可越权修改。
- [x] 2.5 增加 API 定向测试，覆盖新增 key 创建/编辑、all 包含 job、good/dev/test 行为、公开聚合过滤、招聘权限和 registry parity。

## 3. 首页 Tab 与 Sidebar

- [x] 3.1 建立 Web Tab presentation 元数据，覆盖 label fallback、板块范围、发布提示和开发使用说明，并增加与共享 key/DB registry 的一致性测试。
- [x] 3.2 更新首页 Tab 组合为 `all + 可见中间项 + dev(允许时) + good`，保证 all 最左、dev 倒数第二、good 最右，且中间项仍按运营 sort order 排列。
- [x] 3.3 调整 `Sidebar` 接收当前 Tab：all/good 显示社区合作，普通 Tab 显示对应说明，dev 显示开发使用，三类首卡互斥且后续模块顺序不变。
- [x] 3.4 在移动首页让当前 Tab 的紧凑说明位于 feed 前，并与桌面 Sidebar 使用同一元数据来源，不复制业务文案。
- [x] 3.5 增加首页与 Sidebar 测试，覆盖普通用户/管理员顺序、隐藏项、Card 互斥、Tab 导航参数、加载/空数据稳定性和键盘交互。

## 4. 发布、编辑与 Topic 展示

- [x] 4.1 更新发布和编辑分类选择，保留 share/ask/job、加入新公开 key、移除 test，并保持无 recruiter 用户的 job 禁用及 API 兜底。
- [x] 4.2 将发帖右栏固定为“发布规范 Card、当前 Tab 说明 Card、JobMetaForm（仅 job）”，确保 JobMetaForm 不替换前两项且 event 不渲染 event_meta。
- [x] 4.3 编写发布规范硬性文案和权威社区规则链接，覆盖违法/攻击/垃圾/无关广告/敏感信息/来源与商业披露边界。
- [x] 4.4 调整移动 compose 顺序，使发布规范与当前 Tab 紧凑说明在提交按钮前可访问，切换 Select 后关联说明同步更新并保持焦点可见。
- [x] 4.5 更新 Topic 标签、编辑初值和后台展示映射，使新增 key 使用配置 label，历史 share/ask/job 和空 tab topic 继续可读。
- [x] 4.6 增加 Web 定向测试，覆盖各 Tab 说明、发布规范固定首位、job 三段顺序、event 无 meta、招聘权限、移动顺序和辅助技术标签关系。

## 5. 文档与生成资产

- [x] 5.1 按 `cnode-docs` 更新 `docs/biz/business-rules.md` 的有效 Tab、顺序、公开可见性、招聘进入 all、发帖规范和 test 退役规则；检查并移除其他现行文档中的过时 `dev/test` 表述，不改 archive 历史。
- [x] 5.2 评估 `docs/arch/` 是否需要记录共享有效 key 与 DB registry 的所有权；没有新增长期架构约束时不创建重复文档，不改 deployment、根治理文件或 app README。
- [x] 5.3 运行 OpenAPI 生成命令更新 `apps/web/public/openapi.json`，确认创建、编辑和列表 Tab 合约与共享 Zod 来源一致，不手工编辑生成文件。
- [x] 5.4 运行文档链接/过时路径检查和 `pnpm secrets:scan`，确认 `.cnode-ops.md` 修改未新增真实主机、连接串或凭据输出。

## 6. 验证与发布准备

- [x] 6.1 运行数据库 migration/seed 定向验证、API 定向测试和 Web 定向测试，记录 test 零引用断言与 share/ask 保留证据。
- [x] 6.2 在 375px、768px、1280px 和 1440px 的浅色/深色主题检查首页 feed 与 compose archetype，覆盖横向 Tab 可达、Sidebar 首卡、发布按钮前规范、键盘焦点和无横向页面溢出。
- [x] 6.3 运行 Web design-system governance test、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`，可行时运行 `pnpm verify`。
- [x] 6.4 运行 `openspec validate expand-community-tabs --strict`，核对 Mermaid 图、delta requirement 和任务与最终行为一致，并确认 change 达到 archive-ready 前置状态。
- [x] 6.5 在测试服务器执行只读聚合，确认规范化 test topic 为 0、share/ask 数量保留、Tab 注册顺序与 scope 正确；并在测试环境验证普通用户 Tab 顺序、job 出现在 all、Card 互斥和招聘专区不回归。
