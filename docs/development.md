# Development

This guide gets a local cnode-next workspace running. It is not a production deployment guide; production compose and dotenv templates live in [`deployment/`](../deployment/README.md).

## Requirements

| Requirement | Version or rule                                              |
| ----------- | ------------------------------------------------------------ |
| Node.js     | `>= 24.0.0`                                                  |
| pnpm        | Managed by `packageManager` and Corepack.                    |
| PostgreSQL  | Required. SQLite is not supported.                           |
| Redis       | Required for sessions, cache, rate limits, and worker paths. |

## Environment

Copy the local template and fill development values:

```bash
cp .env.example .env
```

Root `.env` is the single default local environment source for Web, API, DB scripts, workers, and migration tooling. `.env.local` and app-local files such as `apps/web/.env.local` are not loaded by default. Do not commit or paste real `.env` values.

Minimum local values:

```bash
CNODE_ENV=development
CNODE_WEB_BASE_URL=http://localhost:5173
CNODE_API_BASE_URL=http://localhost:3001
CNODE_API_INTERNAL_BASE_URL=http://localhost:3001

POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=cnode_local
POSTGRES_USER=cnode
POSTGRES_PASSWORD=<local-password>

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
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

Non-default database configuration must use an explicit ignored dotenv profile selected with `CNODE_ENV_FILE`. Repository automation must not read, print, or modify real dotenv profiles.

## Start

```bash
pnpm install
pnpm db:push:pg
pnpm dev
```

Local endpoints:

| Service | URL                     |
| ------- | ----------------------- |
| Web     | `http://localhost:5173` |
| API     | `http://localhost:3001` |

Quick smoke:

```bash
curl -fsS 'http://localhost:3001/api/v1/topics?limit=1&tab=all'
curl -fsS 'http://localhost:5173/'
```

## Common Commands

| Command                    | Use                                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                 | Start Web and API locally.                                               |
| `pnpm lint`                | Run oxlint.                                                              |
| `pnpm typecheck`           | Run TypeScript checks across the workspace.                              |
| `pnpm test`                | Run package tests.                                                       |
| `pnpm build`               | Build all apps/packages.                                                 |
| `pnpm db:push:pg`          | Create or update the PostgreSQL schema.                                  |
| `pnpm db:seed`             | Seed development data.                                                   |
| `pnpm migrate:mongo-to-pg` | Run explicit Mongo-to-PostgreSQL migration tooling.                      |
| `pnpm migrate:reconcile`   | Reconcile migrated data.                                                 |
| `pnpm verify`              | Full validation gate. Run before release or PR validation when feasible. |

## Environment Loading Matrix

Runtime commands keep their default command shape and load root `.env` from their natural config or script entrypoints. Explicit profiles override root `.env` values with `CNODE_ENV_FILE`, while shell/CI/compose-provided variables remain authoritative.

| Command                                              | Local env behavior                                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                           | Keeps existing Web/API scripts; Web loads root `.env` from `apps/web/vite.config.ts`, API from `apps/api/src/load-env.ts`. |
| `pnpm --filter @cnode/web dev`                       | Keeps `react-router dev`; Vite config loads root `.env`.                                                                   |
| `pnpm --filter @cnode/web build`                     | Keeps `react-router build`; Vite config loads root `.env`.                                                                 |
| `pnpm --filter @cnode/web typecheck`                 | Keeps `react-router typegen && tsc --noEmit`; Vite config loads root `.env` for React Router typegen.                      |
| `pnpm --filter @cnode/api dev`                       | Keeps `tsx watch src/index.ts`; API runtime loader loads root `.env`.                                                      |
| `pnpm --filter @cnode/api worker:moderation`         | Keeps worker command; API worker imports the runtime loader.                                                               |
| `pnpm db:push:pg`, `pnpm db:generate`                | Keep `drizzle-kit` commands; Drizzle config loads root `.env`.                                                             |
| `pnpm db:migrate`, `pnpm db:seed`                    | Keep `tsx src/*` commands; DB scripts load root `.env`.                                                                    |
| `pnpm migrate:mongo-to-pg`, `pnpm migrate:reconcile` | Keep root `tsx scripts/*` commands; scripts load root `.env`; non-default profiles require explicit `CNODE_ENV_FILE`.      |
| `pnpm lint`, `pnpm format`, `pnpm secrets:scan`      | Do not load local dotenv files.                                                                                            |

Example explicit rehearsal profile:

```bash
CNODE_ENV_FILE=.env.rehearsal pnpm migrate:reconcile
```

API contracts are defined in `apps/api/src/routes/*.ts` as zod-openapi declarations. Run `pnpm gen:openapi` to regenerate `api/openapi.json`. `pnpm verify` includes this step automatically.
