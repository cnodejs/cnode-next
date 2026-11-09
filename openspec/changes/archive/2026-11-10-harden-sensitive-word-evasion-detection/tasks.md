# Tasks

## 1. MVP：Unicode 归一化与严格匹配

- [x] 1.1 在 `apps/api/src/lib/moderation.ts` 建立内容与词条的 NFKC、大小写归一化 code point 表示，并为内容字符保存原文 UTF-16 半开区间；通过新增单元测试验证 ASCII 大小写、全角半角、兼容字符、组合字符和 Emoji 映射。
- [x] 1.2 实现相邻词字符间“普通插入不超过 3 个、总插入不超过 16 个 Unicode code point”的有界匹配，其中 `L*`/`N*` 计入普通插入数、全部字符计入总数；通过单元测试验证空白、零宽字符、标点、符号、Emoji、字母、数字和汉字均可在边界内命中。
- [x] 1.3 为双边界和重复目标字符添加反例及回溯测试，验证普通插入 3 个和总插入 16 个可命中，4 个或 17 个不以该候选位置命中，且重复字符不会因贪心选择漏报。
- [x] 1.4 扩展 `ContentHit` 的原文命中范围并保持 `word`、`keywordId`、`index` 兼容；通过测试验证单字符词、同一词多次出现只返回一次、多个词按现有顺序返回，且 `index`/结束位置覆盖实际原文字符。

## 2. MVP：实时过滤与巡检接入

- [x] 2.1 让 `checkContent()` 继续以统一匹配器驱动实时判断和 `hit_count` 更新；通过 API 相关测试验证话题创建、话题编辑、回复创建和回复编辑对插入变体返回现有 `422`，不写入内容且错误结构不变。
- [x] 2.2 调整 `apps/api/src/lib/moderation-scan.ts` 的预览生成以使用原文命中范围；通过巡检测试验证标题、话题正文和回复中的插入变体均进入现有 pending 队列，预览保留原始插入字符且覆盖完整命中范围。
- [x] 2.3 验证实时路径与历史巡检对相同文本和词库返回同一命中词集合，并验证巡检去重键、命中计数和历史命中不自动隐藏或删除的现有行为不变。

## 3. Feature-complete：性能与业务文档

- [x] 3.1 预归一化每段待检内容和缓存词条，避免在逐词扫描中重复归一化；使用现实词库夹具验证 10000 字内容匹配低于现有 100ms 预算，并运行 `pnpm --filter @cnode/api test` 与 `pnpm --filter @cnode/api typecheck`。
- [x] 3.2 加载 `cnode-docs`，以 `docs/biz/community-rules.md` 为社区审核规则的权威文档，补充严格命中、NFKC 和 3/16 有界插入语义；检查 `docs/biz/business-rules.md` 等非归档文档后将重复内容保留为链接或合并而非复制，确认没有过时路径或不安全示例，并运行 `pnpm secrets:scan`。
- [x] 3.3 复核本变更不需要 PostgreSQL schema、迁移、seed、生成 OpenAPI、Web UI 或部署文档改动；运行 `openspec validate harden-sensitive-word-evasion-detection --strict`，检查 `proposal.md`、delta spec、`design.md` Mermaid 图和任务描述一致且达到 archive-ready 状态。

## 4. Feature-complete：集成与发布准备

- [x] 4.1 运行与敏感词、话题、回复和巡检相关的定向测试，再运行 `pnpm verify`，确认 lint、typecheck、test、build 和仓库治理检查通过且普通验证未调用 Docker Compose。
- [x] 4.2 在非生产验证环境使用现有管理员入口创建 `scope=all`、`mode=historical` 的全量任务，验证任务按新规则发现已有插入变体、仅生成待复核记录，并可观察完成、失败、暂停和取消状态；记录脱敏结果，不记录敏感词、正文或 preview。

## Workflow follow-up

- 发布实现后，由获准管理员创建一次生产全量历史巡检任务；在执行前确认目标环境与任务范围，并通过现有资源限制和控制状态观察任务。
- 项目审查要求满足后归档该 change，并验证 delta 已正确同步到主 `content-moderation` spec。
