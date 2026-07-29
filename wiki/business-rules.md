# Business Rules

CNode 社区的核心业务规则：积分、发帖、回复、收藏、消息、话题管理、用户状态和限流。本文档从当前源码提取，供迁移验证和兼容性决策参考。源码是权威；本文档与源码不一致时以源码为准。

## Sources

- `apps/api/src/routes/topic.ts` — 话题创建、编辑、删除、置顶、加精、锁定。
- `apps/api/src/routes/reply.ts` — 回复创建、编辑、删除、点赞。
- `apps/api/src/routes/collect.ts` — 话题收藏。
- `apps/api/src/lib/score.ts` — 积分增减逻辑。
- `apps/api/src/lib/message.ts` — 消息发送（reply、reply2、at）。
- `apps/api/src/lib/db.ts` — `topicQueries`、`replyQueries`、`userQueries`。
- `packages/db/src/schema/` — 数据库 schema 定义。

## Scope

记录影响用户行为和数据一致性的业务规则。不包含 API 接口签名（见 `api/openapi.yaml`）或部署运维（见 `deployment/`）。

## Scoring

| Action | ΔScore | Source |
| ------ | ------ | ------ |
| Create topic | +5 | `CREATE_TOPIC_SCORE = 5` in `topic.ts` |
| Create reply | +5 | `CREATE_REPLY_SCORE = 5` in `reply.ts` |
| Delete reply | -5 | `decrementScoreAndReplyCount(authorId, 5, 1)` in `reply.ts` |
| Collect topic | (no score) | only `collectTopicCount` incremented |
| Reply upvote | (no score) | toggle only, no score change |

所有积分增减都带下限保护：`case when score - N < 0 then 0 else score - N end`，积分不会为负。

| Counter | Increment | Decrement |
| ------- | --------- | --------- |
| `users.topicCount` | +1 on create topic | -1 on delete topic |
| `users.replyCount` | +1 on create reply | -1 on delete reply |
| `users.collectTopicCount` | +1 on collect | -1 on de-collect |
| `topics.replyCount` | +1 via `updateLastReply` | -1 via `decrementReplyCount` |
| `topics.visitCount` | +1 on topic detail view | (none) |
| `topics.collectCount` | +1 on collect | -1 on de-collect |

## Topic Rules

### Creation

| Rule | Value | Source |
| ---- | ----- | ------ |
| Score for creating | +5 | `CREATE_TOPIC_SCORE` |
| Rate limit | 1000/user/day | `CREATE_TOPIC_PER_DAY` |
| New user gate | 注册满 24h 且回复 ≥ 3 条 | `assertNewUserCanCreateTopic`，settings `new_user_min_hours`/`new_user_min_replies` |
| Title length | ≥ 5, ≤ 100 | Zod schema |
| Tab | `share` / `ask` / `job` | Zod enum |
| Content | ≥ 5 chars | Zod schema |
| Content check | 敏感词命中 → 422 | `checkContent` |
| Turnstile | 启用时必传 `turnstileToken` | `verifyTurnstile` |
| Mute/block | 禁言或封禁用户 → 403 | `ensureMuteNotExpired` |
| Mention | `@loginname` → 发送 `at` 消息 | `sendMessageToMentionUsers` |

### Editing

| Rule | Value |
| ---- | ----- |
| Permission | 作者或 admin |
| Lock check | `topic.lock === true` → 403 |
| Content check | 敏感词命中 → 422 |
| Mention | 重新解析 `@loginname` |

### Deletion

| Rule | Value |
| ---- | ----- |
| Permission | 作者或 admin |
| Soft delete | `deleted = true` |
| Score | 作者 -5, `topicCount` -1 |

### Admin Permanent Deletion

| Rule | Value |
| ---- | ----- |
| Permission | admin only |
| Entry point | 后台话题管理中的独立危险操作 |
| Effect | 从 PostgreSQL 删除话题记录，并清理直接依赖数据 |
| Dependencies | 回复、回复点赞、收藏、招聘扩展、巡检命中、消息引用和举报引用 |
| Audit | 必须写入审计日志 |

永久删除不同于普通删除。普通删除和巡检确认删除都沿用软删除语义；巡检任务级批量确认删除会删除命中的原始话题或回复，但仍然只是软删除，不从数据库物理移除内容。

### Admin Actions

| Action | Effect | Route |
| ------ | ------ | ----- |
| Top | toggle `topics.top` | `POST /topic/:tid/top` |
| Good | toggle `topics.good` | `POST /topic/:tid/good` |
| Lock | toggle `topics.lock` | `POST /topic/:tid/lock` |
| Delete | soft delete | `POST /topic/:tid/delete` |
| Permanent delete | physical delete, admin only | 后台管理 API |

## Reply Rules

### Creation

| Rule | Value | Source |
| ---- | ----- | ------ |
| Score for creating | +5 | `CREATE_REPLY_SCORE` |
| Rate limit | 1000/user/day | `CREATE_REPLY_PER_DAY` |
| Content | ≥ 1 char | Zod schema |
| Content check | 敏感词命中 → 422 | `checkContent` |
| Turnstile | 启用时必传 | `verifyTurnstile` |
| Mute/block | 禁言或封禁 → 403 | `ensureMuteNotExpired` |
| Lock check | `topic.lock === true` → 403 | |
| Nested reply | `reply_id` 指向父回复 | `replyQueries.newAndSave(content, topicId, authorId, replyId)` |

### Message Creation On Reply

| Condition | Message type | Recipient |
| --------- | ------------ | --------- |
| 回复话题（作者不是自己） | `reply` | 话题作者 |
| 回复别人的回复（父回复作者不是自己也不是话题作者） | `reply2` | 父回复作者 |
| `@loginname`（被 @ 的人不是自己、不是话题作者、不是父回复作者） | `at` | 被 @ 的用户 |

`sendReplyMessage` 和 `sendReply2Message` 都跳过 `masterId === authorId`。
`@` 消息排除话题作者和父回复作者以避免重复通知。

### Editing

| Rule | Value |
| ---- | ----- |
| Permission | 作者或 admin |
| Content | ≥ 1 char |
| Content check | 敏感词命中 → 422 |
| Mention | 重新解析 `@loginname` |

### Deletion

| Rule | Value |
| ---- | ----- |
| Permission | 作者或 mod |
| Soft delete | `deleted = true` |
| Score | 作者 -5, `replyCount` -1 |
| Topic counter | `topics.replyCount` -1 |

### Upvote

| Rule | Value |
| ---- | ----- |
| Toggle | push/splice `reply_ups` |
| Self-upvote | 禁止 → 403 |
| Response | `{ success, action: "up"\|"down" }` |

## Collection Rules

| Rule | Value |
| ---- | ----- |
| Unique | `(userId, topicId)` primary key |
| Public topic only | `isPublicTopic`: 非删除、非 `dev`/`test` tab、作者未封禁 |
| Collect | `collectTopicCount` +1, `topics.collectCount` +1 |
| De-collect | `collectTopicCount` -1, `topics.collectCount` -1 |
| Duplicate | 已收藏 → `已经收藏过该主题` |

## Message Rules

### Types

| Type | Trigger | Source |
| ---- | ------- | ------ |
| `reply` | 回复了你的话题 | `sendReplyMessage` |
| `reply2` | 在话题中回复了你 | `sendReply2Message` |
| `at` | @了你 | `sendAtMessage` |
| `follow` | (not implemented) | — |

### Email Notification

| Type | Condition | Source |
| ---- | --------- | ------ |
| reply | `master.receiveReplyMail === true` | `sendReplyNotifyMail` |
| at | `master.receiveAtMail === true` | `sendAtNotifyMail` |
| reply2 | (no email) | — |

### Read State

| Item | Value |
| ---- | ----- |
| `has_read` | Boolean, default false |
| Mark all read | `POST /api/v1/message/mark_all` |
| Mark one read | `POST /api/v1/message/mark_one/{msg_id}` |
| Unread count | `GET /api/v1/message/count` |
| Read list limit | 20 most recent |

## User Status Rules

| Status | Effect | Source |
| ------ | ------ | ------ |
| `isBlock` | 封禁，无法发帖/回复，话题对他人不可见 | `ensureMuteNotExpired`, `isPublicTopic` |
| `isMuted` | 禁言，无法发帖/回复 | `ensureMuteNotExpired` |
| `isStar` | 达人标记 | `isAdvanced` inference |
| `active` | 账号激活状态，未激活无法登录 | `sign.ts` |
| `retrieveKey`/`retrieveTime` | 密码重置令牌，24h 有效 | `sign.ts` |

### Advanced User

Legacy: `score > 700 || is_star` → `isAdvanced`。当前实现是否保留此阈值待确认。

### Admin User Governance Wording

后台管理界面将 `block` 表达为“屏蔽用户内容 / 恢复用户内容”。该操作的核心语义是让目标用户的历史公开内容不再出现在公共入口中。`mute` 表达为“禁言 / 解除禁言”，核心语义是阻止目标用户继续新增话题或回复。二者不得在 UI 中混为同一个动作。

后台用户管理列表中的操作按风险分组：用户治理（屏蔽内容、禁言）、角色权限（授予/撤销版主或猎头）、账号安全（重置密码）、危险操作（删除所有发言）。删除所有发言必须保留二次确认和审计日志。

## RSS Feed Rules

公开 `/rss` 是唯一对外 RSS 订阅地址。RSS feed 表示全站公开内容订阅，不等同首页 `all` feed。

| Rule | Value |
| ---- | ----- |
| Format | RSS 2.0 XML |
| Source | API RSS source JSON + Web XML serialization |
| Limit | 最多 50 条 |
| Sort | `create_at desc` |
| Include | 公开 `share` / `ask` / `job` 等话题 |
| Exclude | `dev` / `test`、`deleted=true`、`status=deleted`、block 作者内容 |

## Rate Limiting

| Scope | Limit | Source |
| ----- | ----- | ------ |
| Create topic | 1000/user/day | `CREATE_TOPIC_PER_DAY` |
| Create reply | 1000/user/day | `CREATE_REPLY_PER_DAY` |
| Create account | 1000/ip/day | `CREATE_USER_PER_IP` (legacy) |
| Rate settings | 可通过 `site_settings` 覆盖 | `perUserPerDaySetting` |

## Tabs

| Tab | Display | Source |
| --- | ------- | ------ |
| `share` | 分享 | `config.tabs` |
| `ask` | 问答 | `config.tabs` |
| `job` | 招聘 | `config.tabs` |
| `good` | 精华（显示用） | display-only |
| `dev` | 内部（不公开） | `INTERNAL_TABS` |
| `test` | 内部（不公开） | `INTERNAL_TABS` |

## Inferences

- 因为积分增减都带 `case when ... < 0 then 0` 保护，并发更新不会产生负分。
- 因为 `reply2` 消息只在父回复作者不是话题作者时发送，话题作者回复子回复不会收到 `reply2`。
- 因为 `@` 消息排除话题作者和父回复作者，被 @ 的人不会收到重复通知。
- 因为新用户发帖门控基于 `site_settings`，管理员可以动态调整 `new_user_min_hours` 和 `new_user_min_replies`。
- 因为 `collectTopicCount` 只增减不重算，迁移后需要确保初始值正确。

## To Confirm

- 删除话题时是否扣分（当前源码中 `decrementScoreAndTopicCount` 是否在 delete route 中调用）。
- `isAdvanced` 阈值 700 是否仍在使用。
- `follow` 消息类型是否仍需实现。
- Turnstile 是否在所有写操作中启用，还是仅 topic/reply 创建。

## Review Status

- Draft, extracted from current source during `simplify-open-source-docs` cleanup.
