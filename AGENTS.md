# AGENTS.md

## Execution Facts

- Project: cnode-next, a CNode rewrite with legacy behavior referenced from `../nodeclub/` and `egg-cnode/`.
- Legacy boundary: `../nodeclub/` is outside this repository and must not be linted, tested, built, edited, or treated as shipped source.
- Runtime database: PostgreSQL only. Do not add SQLite, dialect fallback, or local database compatibility paths.
- Package manager: pnpm workspace, ESM, TypeScript strict.

## Stack

- Web: `apps/web`, React Router v7 SSR, Tailwind CSS v4, shadcn/ui.
- API: `apps/api`, Hono on Node.js, worker entrypoints live with API code.
- Database: `packages/db`, Drizzle PostgreSQL schema and migrations.
- Shared contracts: `packages/shared`, types, Zod schemas, constants and pure functions.

## Commands

```bash
pnpm dev                  # local web + api
pnpm lint                 # ESLint
pnpm typecheck            # TypeScript
pnpm test                 # tests
pnpm build                # all packages/apps
pnpm verify               # release gate: lint/typecheck/test/build/OpenSpec/secrets
pnpm db:push:pg           # create/update PostgreSQL schema
pnpm db:migrate           # apply reviewed Drizzle migrations
pnpm db:seed              # seed test data
pnpm migrate:mongo-to-pg  # explicit Mongo to PostgreSQL migration
pnpm migrate:reconcile    # explicit migration reconcile
```

## Change Rules

- Use OpenSpec for scoped product or behavior changes.
- Run `pnpm verify` before release or PR validation when feasible.
- Never print, commit, or document real `.env` values, tokens, private keys, user data, database URLs, or production host secrets.
- Copilot PR review loop: when iterating on Copilot review comments, do not re-request the review more than **5 rounds** per PR. Once 5 rounds have been addressed and pushed, stop re-requesting; a PR with only suppressed/skipped suggestions after the cap may be considered review-complete at the reviewer's or maintainer's discretion.
