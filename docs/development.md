# Development

This guide gets a local cnode-next workspace running. It is not a production deployment guide; production compose and dotenv templates live in [`deployment/`](../deployment/README.md).

## Requirements

| Requirement | Version or rule |
| ----------- | --------------- |
| Node.js | `>= 24.0.0` |
| pnpm | Managed by `packageManager` and Corepack. |
| PostgreSQL | Required. SQLite is not supported. |
| Redis | Required for sessions, cache, rate limits, and worker paths. |

## Environment

Copy the local template and fill development values:

```bash
cp .env.example .env.local
```

`apps/api` loads root `.env` and then `.env.local`. Web-specific overrides may live in `apps/web/.env.local`. Do not commit or paste real `.env` values.

Minimum local values:

```bash
APP_ENV=development
APP_WEB_BASE_URL=http://localhost:5173
APP_API_BASE_URL=http://localhost:3001
APP_API_INTERNAL_BASE_URL=http://localhost:3001

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=cnode_local
DB_USER=cnode
DB_PASSWORD=<local-password>

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Local Services

Use any local PostgreSQL and Redis setup. Docker is fine, but do not use the production compose file for day-to-day development.

Example with standalone containers:

```bash
docker run --name cnode-postgres \
  -e POSTGRES_DB=cnode_local \
  -e POSTGRES_USER=cnode \
  -e POSTGRES_PASSWORD=<local-password> \
  -p 5432:5432 \
  -d postgres:18-bookworm

docker run --name cnode-redis \
  -p 6379:6379 \
  -d redis:7-bookworm redis-server --appendonly yes
```

If you use an SSH tunnel to a private database for migration rehearsal, point `DB_HOST` and `DB_PORT` at the local tunnel listener. Do not expose databases publicly.

## Start

```bash
pnpm install
pnpm db:push:pg
pnpm dev
```

Local endpoints:

| Service | URL |
| ------- | --- |
| Web | `http://localhost:5173` |
| API | `http://localhost:3001` |

Quick smoke:

```bash
curl -fsS 'http://localhost:3001/api/v1/topics?limit=1&tab=all'
curl -fsS 'http://localhost:5173/'
```

## Common Commands

| Command | Use |
| ------- | --- |
| `pnpm dev` | Start Web and API locally. |
| `pnpm lint` | Run oxlint. |
| `pnpm typecheck` | Run TypeScript checks across the workspace. |
| `pnpm test` | Run package tests. |
| `pnpm build` | Build all apps/packages. |
| `pnpm db:push:pg` | Create or update the PostgreSQL schema. |
| `pnpm db:seed` | Seed development data. |
| `pnpm migrate:mongo-to-pg` | Run explicit Mongo-to-PostgreSQL migration tooling. |
| `pnpm migrate:reconcile` | Reconcile migrated data. |
| `pnpm verify` | Full validation gate. Run before release or PR validation when feasible. |

API contracts are defined in `apps/api/src/routes/*.ts` as zod-openapi declarations. Run `pnpm gen:openapi` to regenerate `api/openapi.json`. `pnpm verify` includes this step automatically.
