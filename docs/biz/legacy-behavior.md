# Legacy Compatibility

cnode-next preserves selected nodeclub behavior where external clients, account continuity, or community semantics depend on it. Current implementation and accepted OpenSpec requirements are authoritative.

## Preserved Surfaces

- The session cookie remains `node_club`; current cookies add explicit modern security behavior.
- Local bcrypt password verification, account activation, password reset, GitHub OAuth, and login by email or login name remain supported.
- Legacy `accesstoken` authentication remains available through API v1 query/body contracts and the validation endpoint.
- Topic lifecycle flags, soft deletion, denormalized counters, nested replies, collections, reply votes, mentions, and `reply`/`reply2`/`at` messages retain compatible semantics.
- API v1 keeps legacy field names where practical. Markdown rendering is controlled by `mdrender`; current data does not rely on legacy pre-rendered `content_is_html` values.
- Legacy Mongo ObjectIds are not public identifiers in PostgreSQL. Old ObjectId links may return 404 as accepted by the rewrite scope.

## Intentional Differences

- PostgreSQL integer identifiers and relational join tables replace Mongo ObjectIds and embedded vote arrays.
- GitHub account linking has explicit conflict decisions, uniqueness enforcement, unbind, and token revocation.
- Public/internal visibility and administrator actions have explicit permission and audit boundaries.
- Current Web and API URLs may differ from legacy page routes while API v1 compatibility remains governed by accepted specs.

## Sources

- `../nodeclub/` (reference only)
- `apps/api/src/routes/auth.ts` and API v1 routes
- `apps/api/src/lib/github-account-linking.ts`
- `packages/db/src/schema/`
- `openspec/specs/auth/`, `session-management/`, `api-contract/`, `web-url-parity/`

## To Confirm

- Whether any client still depends on the legacy reply-up threshold.
- Whether the `level` and `follow` fields have remaining compatibility consumers.
