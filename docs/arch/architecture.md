# Architecture

cnode-next separates presentation, HTTP behavior, durable data, and shared contracts in a pnpm workspace.

## Runtime Boundaries

```mermaid
graph TB
  Browser[Browser] --> Web[apps/web<br/>React Router SSR]
  Web --> API[apps/api<br/>Hono]
  Browser --> API
  Browser --> Storage[Object storage]
  API --> PG[(PostgreSQL)]
  API --> Redis[(Redis)]
  Worker[Moderation worker] --> PG
  Worker --> Redis
  API -. OTLP traces .-> Collector[OpenTelemetry Collector]
  Worker -. OTLP traces .-> Collector
  Collector -. authenticated ingestion .-> OpenObserve[OpenObserve]
```

| Component | Owns |
| --- | --- |
| `apps/web` | SSR pages, browser interactions, runtime public configuration |
| `apps/api` | HTTP routes, authentication, administration, workers |
| `packages/db` | Drizzle PostgreSQL schema, migrations, database helpers |
| `packages/shared` | Zod schemas, types, constants, pure helpers |
| PostgreSQL | Durable application data; the only runtime database |
| Redis | Sessions, cache, rate limits, and worker coordination |

SSR loaders call the internal API base. Browser requests use runtime public configuration so image builds do not bake in a public API URL. The API signs uploads; browsers upload directly to object storage.

## Tracing

The API and moderation worker use one explicit bootstrap so environment loading and OpenTelemetry registration finish before Hono, Undici, PostgreSQL, or their clients load. The API uses `service.name=cnode-api`; the worker uses `service.name=cnode-moderation-worker`. Stable resources also include package version, commit revision, and deployment environment. Request IDs, user IDs, and other per-request values are not resources.

```mermaid
flowchart LR
  Public[Public request] --> Root[Server-generated root trace ID]
  Root --> Hono[Hono route span]
  Hono --> HTTP[HTTP / Undici spans]
  Hono --> PG[PostgreSQL spans]
  API[API] -->|OTLP/HTTP| Collector[Collector]
  Worker[Worker] -->|OTLP/HTTP| Collector
  Collector -->|memory limit → sanitize → batch| OpenObserve[OpenObserve]
```

The public API does not trust inbound `traceparent`; each request starts a server-owned 128-bit trace ID so callers cannot control trace identity or force sampling. Child spans inherit the local parent decision. Root traces use a parent-based trace-ID ratio sampler configured by `CNODE_OTEL_TRACE_SAMPLE_RATIO`.

Hono separately creates a UUID Request ID before any middleware can return. Every response includes `X-Request-ID`; sampled request spans include `cnode.request.id`. Request ID identifies one API request, while trace ID identifies its sampled call chain. The API ignores inbound `X-Request-ID` and does not promise an `X-Trace-ID` response header.

Applications send traces only to the internal Collector. Headers and bodies are not captured. Application and Collector sanitizers delete authentication/session values, user or mail content, exception messages/stacks, connection credentials, SQL text, and query parameters. PostgreSQL spans retain only low-cardinality operation/system metadata. Export queues, retries, and shutdown waits are bounded; tracing remains disabled or fail-open when configuration or backends fail.

This baseline does not include browser/Web SSR tracing, Redis spans, metrics, dashboards, alerts, or broad structured-log migration. Adding `trace_id` and `span_id` to a limited structured logging boundary remains follow-up work.

## Boundaries

- Keep shared wire contracts in `packages/shared`; do not create parallel Web/API shapes.
- Keep database access and schema ownership in `packages/db`.
- Redis is coordination state, not the durable source of truth.
- Cross-cutting behavior and architecture changes use OpenSpec.
- Legacy `../nodeclub/` and `egg-cnode/` are read-only references, not shipped code.

Sources: `apps/web/app/lib/api-client.ts`, `apps/api/src/bootstrap.ts`, `apps/api/src/telemetry/`, `apps/api/src/middleware/telemetry.ts`, `packages/db/src/`, `packages/shared/src/`, `docs/deployment/otel-collector.yaml`.
