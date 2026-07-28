# API Reference

CNode Next exposes a legacy-compatible `/api/v1/*` API for external clients and for `apps/web`.

- Machine-readable OAS: [`docs/api/openapi.yaml`](./api/openapi.yaml)
- Web/OAS contract manifest: [`apps/web/api-contract.manifest.json`](../apps/web/api-contract.manifest.json)
- Contract verifier: `pnpm exec tsx scripts/verify-openapi-contract.ts`

## Base URL And Versioning

- Production API: `https://api.cnodejs.org`
- Local API: `http://localhost:3001`
- Current public API version: `/api/v1`
- Compatibility target: legacy CNode/nodeclub API v1 field names and response envelope where practical.

## Authentication

Public read endpoints can be called anonymously unless noted in the OAS `security` section.

Authenticated endpoints accept one of these mechanisms:

- Browser session cookie set by the web login flow.
- Legacy `accesstoken` in query string, for example `?accesstoken=...`.
- Legacy `accesstoken` in JSON body for write endpoints.

Never place real tokens in docs, examples, issue reports, or committed files. Use placeholders such as `ACCESS_TOKEN`.

## Common Responses

Successful responses use the legacy envelope:

```json
{ "success": true, "data": {} }
```

Some legacy endpoints return top-level fields alongside `success`, for example:

```json
{ "success": true, "topic_id": "123" }
```

Errors use `success: false` and `error_msg`:

```json
{ "success": false, "error_msg": "未登录" }
```

Common status codes are `400` for invalid parameters, `401` for unauthenticated requests, `403` for forbidden actions, `404` for missing resources, and `422` for validation or moderation rejection.

## Pagination And Limits

List endpoints use `page` and `limit` query parameters. `page` starts at `1`; `limit` defaults to `20` and is capped by the API. Topic list endpoints may return `total` for pagination.

Rate limits are enforced on selected mutating endpoints such as account creation, topic creation, and reply creation. Clients should treat `429` as retry-later and surface the server `error_msg`.

## Markdown Rendering

Topic, reply, and message content is rendered to HTML by default. Pass `mdrender=false` to receive raw Markdown when the endpoint supports it.

HTML response example:

```bash
curl 'https://api.cnodejs.org/api/v1/topic/1?mdrender=true'
```

```json
{
  "success": true,
  "data": {
    "id": "1",
    "content": "<h2 id=\"hello\">Hello</h2>\n<p>Rendered HTML</p>",
    "replies": [
      { "id": "2", "content": "<p>reply <code>code</code></p>", "ups": [] }
    ]
  }
}
```

Raw Markdown response example:

```bash
curl 'https://api.cnodejs.org/api/v1/topic/1?mdrender=false'
```

```json
{
  "success": true,
  "data": {
    "id": "1",
    "content": "## Hello\n\nRendered **later**",
    "replies": [
      { "id": "2", "content": "reply `code`", "ups": [] }
    ]
  }
}
```

## Core Endpoint Examples

List topics:

```bash
curl 'https://api.cnodejs.org/api/v1/topics?page=1&limit=20&tab=all&mdrender=false'
```

Get topic detail:

```bash
curl 'https://api.cnodejs.org/api/v1/topic/1?mdrender=false'
```

Create topic:

```bash
curl -X POST 'https://api.cnodejs.org/api/v1/topics' \
  -H 'content-type: application/json' \
  -d '{"accesstoken":"ACCESS_TOKEN","title":"Hello CNode","tab":"share","content":"Markdown body"}'
```

Create reply:

```bash
curl -X POST 'https://api.cnodejs.org/api/v1/topic/1/replies' \
  -H 'content-type: application/json' \
  -d '{"accesstoken":"ACCESS_TOKEN","content":"Thanks!"}'
```

Toggle reply upvote:

```bash
curl -X POST 'https://api.cnodejs.org/api/v1/reply/2/ups' \
  -H 'content-type: application/json' \
  -d '{"accesstoken":"ACCESS_TOKEN"}'
```

Get user profile:

```bash
curl 'https://api.cnodejs.org/api/v1/user/alsotang'
```

List user collections:

```bash
curl 'https://api.cnodejs.org/api/v1/topic_collect/alsotang'
```

Get messages:

```bash
curl 'https://api.cnodejs.org/api/v1/messages?accesstoken=ACCESS_TOKEN&mdrender=false'
```

Mark messages read:

```bash
curl -X POST 'https://api.cnodejs.org/api/v1/message/mark_all' \
  -H 'content-type: application/json' \
  -d '{"accesstoken":"ACCESS_TOKEN"}'
```

Search topics:

```bash
curl 'https://api.cnodejs.org/api/v1/search?q=node&engine=local'
```

Read public auth config:

```bash
curl 'https://api.cnodejs.org/api/v1/auth/config'
```

## Field Compatibility Notes

- `success` and `error_msg` follow legacy nodeclub API v1 response semantics.
- Topic fields intentionally keep legacy names such as `author_id`, `last_reply_at`, `reply_count`, `visit_count`, `create_at`, `good`, and `top`.
- Reply fields intentionally keep `reply_id`, `ups`, `is_uped`, and nested `author` objects.
- Message list returns `has_read_messages` and `hasnot_read_messages` under `data`.
- `message/count` returns `{ "success": true, "data": 3 }`, not `{ "count": 3 }`.

## Coverage And Release Readiness

The OAS currently prioritizes topics, replies, users, collections, messages, auth, search, and system config. Admin/internal endpoints are tagged separately when included and are not the primary external client surface.

Before release, API changes must satisfy this checklist:

- Update `docs/api/openapi.yaml` for any added, removed, or changed public API path, method, auth requirement, request shape, response shape, or example.
- Update this Markdown reference when external usage guidance, examples, compatibility notes, pagination, auth, or rate-limit semantics change.
- Update `apps/web/api-contract.manifest.json` when `apps/web` starts depending on a new core API path or response field.
- Run `pnpm exec tsx scripts/verify-openapi-contract.ts` and record any smoke/contract coverage gaps in release notes.
