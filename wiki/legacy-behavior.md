# Legacy Behavior Notes

CNode 社区源自 nodeclub，迁移到 cnode-next 后，API、数据结构和业务规则保留了大量 legacy 行为。本文档记录这些行为，供兼容性决策和迁移验证参考。当前源码是权威；本文档与源码不一致时以源码为准。

## Sources

- `../nodeclub/` legacy 源码（仅作参考，不参与构建）。
- `apps/api/src/routes/auth.ts` — session cookie、GitHub OAuth、local password、access token。
- `apps/api/src/lib/github-account-linking.ts` — bind/refresh/reject 决策与 unbind 流程。
- `apps/api/src/lib/db.ts` — `userQueries`、`topicQueries`、`replyQueries`。
- `packages/db/src/schema/` — 当前 PostgreSQL schema。
- `openspec/specs/` 和 `openspec/changes/archive/` — 已接受和已归档的行为变更。

## Scope

记录 legacy 行为中影响 API 兼容性、数据迁移和业务规则的要点。不替代当前 `docs/`、`deployment/` 或 OpenSpec。

## Authentication And Session

### Session Cookie

| Item | Legacy | Current |
| ---- | ------ | ------- |
| Cookie name | `node_club` | `node_club` |
| Signing | `session_secret` | `AUTH_SESSION_SECRET` |
| Domain | `config.host` | `AUTH_COOKIE_DOMAIN` |
| HttpOnly | yes | yes |
| SameSite | (not set) | `Lax` |

### GitHub OAuth

| Item | Legacy | Current |
| ---- | ------ | ------- |
| State cookie | session-based | `github_oauth_state` cookie (10 min, signed) |
| Pending profile | session-based | `github_profile` cookie (10 min, signed) |
| Bind decision | ad-hoc | `decideGithubBind` → `bind`/`refresh`/`reject-different`/`reject-occupied` |
| Unique constraint | `githubId` index | `users_github_id_unique` |
| Unbind | not implemented | `executeGithubUnbind`（验证密码 → 撤销 token → 清除 githubId） |
| Token revoke | not implemented | `revokeGithubToken`（调用 GitHub `DELETE /applications/{id}/token`） |

### Local Password Auth

| Item | Legacy | Current |
| ---- | ------ | ------- |
| Hash | bcrypt (`tools.bhash` / `tools.bcompare`) | bcrypt（`verifyPassword(password, hash)`） |
| Activation | `active` flag + md5(email+passhash+secret) link | `active` flag + activation email |
| Signup validation | loginname ≥ 5 chars, `validateId`, email, pass match | 同上 |
| Password reset | `retrieve_key` + `retrieve_time` (24h) | `retrieve_key` + `retrieve_time` (24h) |
| Login by email or loginname | yes | yes |

### Access Token

| Item | Legacy | Current |
| ---- | ------ | ------- |
| Token storage | `users.accessToken` (plain string) | `users.accessToken` |
| Auth via query | `?accesstoken=` | `?accesstoken=` |
| Auth via body | `{ "accesstoken": "..." }` | `{ "accesstoken": "..." }` |
| Validate endpoint | `POST /api/v1/accesstoken` | `POST /api/v1/accesstoken` |
| Rotation | `POST /user/refresh_token` | `POST /api/v1/user/refresh_token` |

## Topic

### Lifecycle Fields

| Field | Legacy | Current |
| ----- | ------ | ------- |
| `top` | Boolean, admin toggle | Boolean, admin toggle |
| `good` | Boolean, admin toggle | Boolean, admin toggle |
| `lock` | Boolean, admin toggle, 阻止回复 | Boolean, 阻止回复 |
| `deleted` | soft delete | soft delete |
| `tab` | `share` / `ask` / `job` | `share` / `ask` / `job` / `good` (display tab) |
| `reply_count` | denormalized counter | denormalized counter |
| `visit_count` | denormalized counter | denormalized counter |
| `collect_count` | denormalized counter | denormalized counter |
| `last_reply_at` | denormalized timestamp | denormalized timestamp |
| `last_reply` | ObjectId ref reply | integer reply ID |

### Validation

| Rule | Legacy | Current |
| ---- | ------ | ------- |
| Title length | 5–100 | 5–100 |
| Tab | must be in `config.tabs` | `share` / `ask` / `job` |
| Content | non-empty, ≥ 5 | non-empty, ≥ 5 |
| Edit permission | author or admin | author or admin |
| Rate limit | `create_post_per_day` = 1000 | per-user per-day rate limit |

### Topic Detail Extras

- Legacy 侧栏展示作者其他话题（5 篇）和无回复话题（5 篇，排除 `job`/`dev` tab）。
- Legacy 计算 `reply_up_threshold`：取点赞数第三高的回复，阈值下限为 3。当前实现是否保留此阈值待确认。

## Reply

### Fields

| Field | Legacy | Current |
| ----- | ------ | ------- |
| `content` | Markdown string | Markdown string |
| `topic_id` | ObjectId ref topic | integer topic ID |
| `author_id` | ObjectId ref user | integer author ID |
| `reply_id` | parent reply ObjectId (for nested) | integer parent reply ID |
| `ups` | `[ObjectId]` array | `reply_ups` join table |
| `deleted` | soft delete | soft delete |
| `content_is_html` | Boolean | (not used; `mdrender` controls rendering) |

### Reply Creation

| Rule | Legacy | Current |
| ---- | ------ | ------- |
| Content | non-empty | non-empty |
| Lock check | `topic.lock === true` → 403 | 同 |
| Nested reply | `reply_id` 指向父回复 | 同 |
| Rate limit | `create_reply_per_day` = 1000 | per-user per-day rate limit |
| Mention | `@loginname` 解析 + 发送 `at` 消息 | 同 |
| Reply to topic author | 发送 `reply` 消息 | 发送 `reply` 消息 |
| Reply to other replyer | 发送 `reply2` 消息 | 待确认 |

### Reply Upvote

| Rule | Legacy | Current |
| ---- | ------ | ------- |
| Toggle | push/splice `ups[]` | `reply_ups` insert/delete |
| Self-upvote | 禁止（非 debug） | 待确认 |
| Response | `{ success, action: "up"\|"down" }` | 同 |

## User

### Profile Fields

| Field | Legacy | Current |
| ----- | ------ | ------- |
| `loginname` | unique, ≥ 5 chars, `validateId` | 同 |
| `email` | unique, isEmail | 同 |
| `pass` | bcrypt hash | bcrypt hash |
| `avatar` / `avatar_url` | Gravatar / GitHub avatar | OSS or GitHub avatar |
| `url` | homepage URL | homepage URL |
| `location` | location string | location string |
| `signature` | signature string | signature string |
| `weibo` | weibo handle/URL | weibo handle/URL |
| `score` | denormalized counter | denormalized counter |
| `is_star` | 达人 flag | 达人 flag |
| `is_block` | 禁言 flag | 禁言 / mute flag |
| `level` | user level string | 待确认 |
| `active` | account activated flag | account activated flag |
| `receive_reply_mail` | reply email notification | reply email notification |
| `receive_at_mail` | mention email notification | mention email notification |

### Scoring

| Action | Legacy Δscore | Current |
| ------ | ------------- | ------- |
| Create topic | +5 | 待确认 |
| Create reply | +5 | 待确认 |
| Delete reply | -5 | 待确认 |
| Reply upvote received | (none) | 待确认 |
| Topic deleted | (none) | 待确认 |

### Admin Actions

| Action | Legacy | Current |
| ------ | ------ | ------- |
| Set star (达人) | `POST /user/set_star` | admin route |
| Cancel star | `POST /user/cancel_star` | admin route |
| Block user (禁言) | `POST /user/:name/block` | admin route |
| Delete all user posts | `POST /user/:name/delete_all` | admin route |
| Top topic | `POST /topic/:tid/top` | admin route |
| Good topic | `POST /topic/:tid/good` | admin route |
| Lock topic | `POST /topic/:tid/lock` | admin route |

## Message

### Message Types

| Type | Legacy | Current |
| ---- | ------ | ------- |
| `reply` | 回复了你的话题 | 回复了你的话题 |
| `reply2` | 在话题中回复了你 | 在话题中回复了你 |
| `at` | @了你 | @了你 |
| `follow` | 关注了你 | 待确认 |

### Message Read State

| Item | Legacy | Current |
| ---- | ------ | ------- |
| `has_read` | Boolean | Boolean |
| Mark all read | `POST /message/mark_all` | `POST /api/v1/message/mark_all` |
| Mark one read | `POST /message/mark_one/:msg_id` | `POST /api/v1/message/mark_one/{msg_id}` |
| Unread count | `GET /message/count` | `GET /api/v1/message/count` |

## Topic Collect

| Item | Legacy | Current |
| ---- | ------ | ------- |
| Unique | `(user_id, topic_id)` | `(user_id, topic_id)` |
| Collect | `POST /topic/collect` | `POST /api/v1/topic_collect/collect` |
| De-collect | `POST /topic/de_collect` | `POST /api/v1/topic_collect/de_collect` |
| List by user | `GET /user/:name/collections` | `GET /api/v1/user/{loginname}/collections` |
| List by loginname | `GET /topic_collect/:loginname` | `GET /api/v1/topic_collect/{loginname}` |

## Markdown Rendering

| Item | Legacy | Current |
| ---- | ------ | ------- |
| Default render | HTML | HTML (`mdrender=true`) |
| Raw markdown | (not supported) | `mdrender=false` |
| User linking | `@loginname` → `<a href="/user/loginname">` | 同 |
| Code blocks | fenced + inline | fenced + inline |
| Mention parsing | regex with ignore patterns (code, email, links) | 同 |

## Rate Limiting

| Scope | Legacy | Current |
| ----- | ------ | ------- |
| Create topic | 1000/user/day | per-user per-day |
| Create reply | 1000/user/day | per-user per-day |
| Create account | 1000/ip/day | per-ip per-day |
| Visit | 1000/ip/day | per-ip (待确认) |

## Inferences

- 因为 GitHub 账号绑定有唯一约束，修改 `users.githubId` 列或绑定决策逻辑前，应通过测试或 OpenSpec 验收。
- 因为 session 和 OAuth helper cookie 都用 `AUTH_SESSION_SECRET` 签名，轮换密钥会使在途的 pending-profile 和 OAuth-state cookie 失效。运维应预期 cookie 丢失。
- Legacy access-token 端点应视为公开 API surface；收紧它们属于行为变更，应走 OpenSpec。
- `reply2` 消息是否在当前实现中自动发送（当回复有 `reply_id` 且父回复作者不是话题作者时），待确认。

## To Confirm

- `reply_up_threshold` 是否在当前话题详情页保留。
- `reply2` 消息的自动发送逻辑是否完整。
- 用户 `level` 字段是否仍在使用。
- `follow` 消息类型是否仍在产生。
- 删除话题时是否扣分。
- 回复被点赞时作者是否得分。
- Rate limit 具体阈值是否与 legacy 一致。
- Legacy 的 `content_is_html` 字段在迁移后如何处理。

## Review Status

- Draft, created during `simplify-open-source-docs`; expanded with comprehensive legacy behavior from nodeclub source.
