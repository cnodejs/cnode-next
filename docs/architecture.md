# Architecture

This document describes the current cnode-next runtime boundaries and request flow.

## System Map

cnode-next is a pnpm workspace with a React Router SSR Web app, Hono API, PostgreSQL schema package, shared contracts, Redis-backed runtime services, and an optional moderation worker.

```mermaid
graph TB
  subgraph Runtime[Runtime services]
    Browser[Browser]
    Web[apps/web<br/>React Router v7 SSR]
    Api[apps/api<br/>Hono API]
    Worker[moderation worker]
    Redis[(Redis<br/>sessions/cache/rate limits/locks)]
    Pg[(PostgreSQL<br/>only runtime database)]
  end

  Oss[(Object storage<br/>uploads/static assets)]

  Browser --> Web
  Web -->|SSR loader fetch| Api
  Browser -->|client API calls| Api
  Browser -->|direct upload PUT| Oss
  Api --> Redis
  Api --> Pg
  Worker --> Redis
  Worker --> Pg
```

| Component         | Responsibility                                         |
| ----------------- | ------------------------------------------------------ |
| `apps/web`        | SSR pages, client interactions, runtime public config. |
| `apps/api`        | HTTP API, auth, moderation/admin routes, workers.      |
| `packages/db`     | Drizzle PostgreSQL schema and database helpers.        |
| `packages/shared` | API types, Zod schemas, constants, pure helpers.       |
| Redis             | Session/cache/rate-limit state and worker locks.       |
| PostgreSQL        | The only supported runtime database.                   |

## Request And Upload Flow

SSR loaders use the internal API base. Browser-side calls use runtime public config, so image builds do not bake in the public API URL.

```mermaid
sequenceDiagram
  participant B as Browser
  participant W as Web SSR
  participant A as API
  participant P as PostgreSQL
  participant O as Object Storage
  B->>W: open page
  W->>A: loader fetch via internal API base
  A->>P: read or mutate data
  A-->>W: JSON contract
  W-->>B: HTML + runtime public config
  B->>A: authenticated API call
  B->>A: request upload presign
  A-->>B: public URL + signed PUT URL
  B->>O: PUT file directly
```

| Flow       | Boundary                                                     |
| ---------- | ------------------------------------------------------------ |
| SSR data   | Web server to API.                                           |
| Client API | Browser to API with cookie or access token where applicable. |
| Uploads    | API signs; browser uploads directly to object storage.       |

## Release Boundary

Release work is gated by verification, image publication, the deployment runbook, health checks, smoke checks, and an audit record.

```mermaid
flowchart LR
  Change[OpenSpec or patch] --> Verify[pnpm verify]
  Verify --> Images[container images]
  Images --> Runbook[deployment runbook]
  Runbook --> Health["/health"]
  Health --> Smoke[smoke checks]
  Smoke --> Audit[audit record]
```

| Stage   | Task                                                                     |
| ------- | ------------------------------------------------------------------------ |
| Verify  | Run lint, typecheck, tests, build, OpenSpec validation, and secret scan. |
| Images  | Use published image tags or digests.                                     |
| Runbook | Follow [deployment/README.md](../deployment/README.md).                  |
| Audit   | Record what changed and what was checked.                                |

## Repository Map

| Path              | Role                                                              |
| ----------------- | ----------------------------------------------------------------- |
| `apps/web`        | React Router SSR application.                                     |
| `apps/api`        | Hono API and worker entrypoints.                                  |
| `packages/db`     | PostgreSQL schema and migrations.                                 |
| `packages/shared` | Shared TypeScript contracts.                                      |
| `docs`            | Stable task documentation.                                        |
| `wiki`            | Sourced historical and business-logic notes.                      |
| `api`             | OpenAPI specification (single source of truth for API contracts). |
| `openspec`        | Behavior change proposals and specs.                              |
| `deployment`      | Production runbook and deployment assets.                         |

## Runtime Rules

- PostgreSQL is the only runtime database.
- Redis stores runtime coordination state, not durable source-of-truth content.
- Cross-cutting behavior changes should be proposed through OpenSpec.
- Historical legacy behavior notes belong in [wiki/legacy-behavior.md](../wiki/legacy-behavior.md).
