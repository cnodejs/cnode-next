# Business Rules

This document records durable behavior that affects users or data consistency. Route schemas and response fields belong to the API route zod-openapi declarations and the generated Web API reference.

## Content And Counters

- Creating a topic or reply adds 5 points to its author.
- Deleting a topic or reply reverses its creation points and count without allowing a negative score.
- Topic, reply, collection, visit, and last-reply counters are denormalized and must change with the underlying action.
- Normal deletion is soft deletion. Permanent topic deletion is a separate admin-only, audited action that removes dependent records.
- Locked topics reject new replies. Authors may edit their own content; elevated roles retain the accepted moderation permissions.

## Visibility And Governance

- Public topic queries exclude deleted content, the non-public `dev` tab, and content from blocked authors.
- Blocking hides a user's public content. Muting prevents new topics and replies. UI and bulk actions must not conflate these states.
- Dangerous administration actions require explicit confirmation, authorization, self-action protection where applicable, and audit records.
- Author-selectable tabs are `share`, `ask`, `tech`, `ai`, `ideas`, `career`, `life`, `event`, and the role-restricted `job`. `good` is a display filter, `dev` is for API/client development, and `test` is retired.
- The home order is `all / share / ask / tech / ai / ideas / career / life / event / job / dev / good`; `dev` is only visible to administrators, while `all` and visible `good` remain at the two ends.
- Public `job` topics participate in the `all` feed while retaining recruiter authorization, structured `job_meta`, and the jobs zone.

## Replies, Collections, And Messages

- A user cannot upvote their own reply; reply votes toggle without changing score.
- A user may collect a public topic once. User and topic collection counters change together.
- A reply can notify the topic author (`reply`), a parent-reply author (`reply2`), and mentioned users (`at`). Self-notifications and duplicate recipients are excluded.
- Reply and mention email notifications respect the recipient's settings.

## Publishing Controls

- Topic creation validates title, tab, content, account state, rate limit, moderation rules, and Turnstile when enabled.
- The publishing UI presents mandatory community rules before the selected tab guidance. It prohibits illegal or abusive content, spam, unrelated advertising, exposed secrets or personal data, unattributed copying, and undisclosed commercial relationships.
- Event topics use normal topic content for now and must state the time, place or online channel, organizer, registration information, and commercial relationship; there is no `event_meta` contract yet.
- New-user publishing limits are configurable through site settings.
- The public `/rss` feed contains recent public topics and excludes internal, deleted, and blocked-author content.

## Sources

- `apps/api/src/routes/topic.ts`, `reply.ts`, `collect.ts`
- `apps/api/src/lib/score.ts`, `message.ts`, `db.ts`
- `packages/db/src/schema/`
- `openspec/specs/scoring/`, `content-lifecycle/`, `messaging/`, `rate-limiting/`

## To Confirm

- Whether the advanced-user score threshold remains a supported product rule.
- Whether the dormant `follow` message type should remain in the data model.
