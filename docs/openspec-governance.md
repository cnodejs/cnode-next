# OpenSpec Governance

This document defines how maintainers and AI agents create changes that can be implemented, audited, documented, and archived without losing project knowledge.

## Change Scope

Every OpenSpec change for behavior, product, API, migration, release, architecture, database, security, permissions, deployment, or data repair work must describe its scope before implementation starts.

Use this shape in `proposal.md` when a change has meaningful boundaries:

```markdown
## Scope

### In Scope

- Current behavior, system, route, package, migration, or business rule being changed.

### Out Of Scope

- Related work intentionally not included in this change.

### Affected Areas

- Code: `apps/web`, `apps/api`, `packages/db`, `packages/shared`, or other paths.
- Runtime: PostgreSQL, Redis, object storage, email, deployment, or workers.
- Contracts: OpenAPI, shared Zod schemas, API errors, public URLs, or CLI commands.

### High-Risk Categories

- Database:
- Security/permissions:
- API contract:
- Migration/data repair:
- Deployment/release:
```

Small documentation corrections, spelling fixes, and mechanical formatting can skip OpenSpec when they do not change shipped behavior or durable project knowledge.

## Documentation Impact

Every proposal must state how `docs/` and `wiki/` are affected. The answer can be `Updated`, `Not Required`, or `Deferred`, but it must be explicit.

```markdown
## Documentation Impact

### docs/

- Updated: `docs/<page>.md` because <current behavior or task changes>.
- Not Required: <why stable task documentation is unchanged>.
- Deferred: <follow-up change or task that will update docs>.

### wiki/

- Updated: `wiki/<page>.md` because <business rule, legacy behavior, migration background, or sourced context changes>.
- Not Required: <why knowledge base content is unchanged>.
- Deferred: <follow-up change or task that will update wiki>.
```

`docs/` describes current development, runtime, architecture, database, API, moderation, security, migration, and deployment tasks. `wiki/` preserves sourced business knowledge, legacy behavior, migration background, community rules, and facts that need review. Do not write implementation logs into either domain.

| Change kind | Usually update |
| --- | --- |
| Runtime architecture, request flow, worker boundary | `docs/architecture.md` |
| Local development or verification commands | `docs/development.md`, `docs/conventions.md` |
| PostgreSQL schema, migration, index, data repair | `docs/database.md`, `docs/migration-runbook.md` |
| Security, auth, roles, audit, secret handling | `docs/security.md` |
| Content moderation operation | `docs/content-moderation.md`, `wiki/community-rules.md` |
| Business rule or legacy behavior | `wiki/business-rules.md`, `wiki/legacy-behavior.md` |
| Mongo to PostgreSQL mapping or migration background | `wiki/migration-background.md` |

Wiki updates must follow `wiki/writing-guidelines.md`: cite sources, separate facts from inferences, and mark uncertain statements as `To Confirm`.

## Diagrams

Use diagrams when prose alone would hide boundaries, ordering, or risk.

| Impact | Preferred form |
| --- | --- |
| Architecture or module boundary | Mermaid `flowchart` or `graph` |
| Request, auth, or integration flow | Mermaid `sequenceDiagram` |
| Data model or relationship | Mermaid `erDiagram` or a field table |
| Lifecycle or state transition | Mermaid `stateDiagram-v2` |
| Permission boundary | Matrix table or Mermaid `flowchart` |
| Migration, backfill, or release ordering | Mermaid `flowchart LR` |

If no diagram is needed, explain why the change is single-boundary or clear enough in prose.

## Database Change Audit

Database-related changes require a `Database Change Audit` in `design.md`. This applies to PostgreSQL schema changes, Drizzle migrations, seed/bootstrap behavior, indexes, constraints, backfills, cleanups, repair scripts, data retention, and field semantic changes.

```markdown
## Database Change Audit

### Change Type

- Schema:
- Migration:
- Seed/bootstrap:
- Index/constraint:
- Data backfill:
- Data cleanup/repair:
- Data semantics:

### Impacted Data

- Tables:
- Columns:
- Existing rows affected:
- User-visible behavior affected:
- Related docs/wiki:

### Compatibility

- Old code with new schema:
- New code with old data:
- API/shared schema compatibility:
- Required deploy order:

### Migration Plan

- Online-safe:
- Estimated data volume:
- Locking/full-scan risk:
- PostgreSQL-specific notes, such as `CONCURRENTLY` or constraint validation:

### Rollback Plan

- Reversible:
- Data loss risk:
- Rollback procedure or rationale if not reversible:

### Verification

- Migration test:
- Data integrity check:
- Performance check:
- Docs/wiki updated:
```

PostgreSQL is the only runtime database. Do not add SQLite, dialect fallback, local database compatibility paths, or tests that make SQLite a release path.

## Task And Archive Checks

`tasks.md` must include follow-through for the impact declared in the proposal and design.

- Add docs/wiki synchronization tasks when `Documentation Impact` lists updates.
- Add diagram consistency checks when design includes architecture, state, permission, data, or migration diagrams.
- Add migration execution, rollback rationale, data integrity, and documentation checks when `Database Change Audit` is present.
- Run `openspec validate <change> --strict` before asking to archive.
- Archive only after tasks are complete, validation passes, documentation impact has been handled, and database audit evidence exists where applicable.
