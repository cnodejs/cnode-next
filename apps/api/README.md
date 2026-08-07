# API

`apps/api` is the Hono HTTP API and contains the moderation worker entrypoint. It owns route validation and OpenAPI declarations; shared contracts belong in `packages/shared`, and PostgreSQL schema belongs in `packages/db`.

## Commands

```bash
pnpm --filter @cnode/api dev
pnpm --filter @cnode/api test
pnpm --filter @cnode/api typecheck
pnpm --filter @cnode/api build
pnpm --filter @cnode/api worker:moderation
pnpm gen:openapi
```

The app loads the root `.env` by default. API contract changes must update route zod-openapi declarations and regenerate `apps/web/public/openapi.json`. Route tests must fake service/query boundaries and must not connect to a real database or introduce SQLite.
