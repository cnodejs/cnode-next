# AGENTS.md

## Project

- cnode-next is a pnpm workspace using ESM and strict TypeScript.
- Web: `apps/web`, React Router SSR, Tailwind CSS v4, shadcn/ui on Base UI.
- API: `apps/api`, Hono on Node.js; worker entrypoints live with API code.
- Data: `packages/db`, Drizzle and PostgreSQL. PostgreSQL is the only runtime database.
- Shared contracts: `packages/shared`, including Zod schemas, types, constants, and pure helpers.
- `../nodeclub/` and `egg-cnode/` are reference-only legacy code. Do not edit, lint, test, build, or ship them.

## Hard Boundaries

- Do not add SQLite, dialect fallbacks, or local database compatibility paths.
- Never print, commit, or document real dotenv values, credentials, private keys, tokens, database URLs, private hosts, user data, or production configuration.
- Use OpenSpec for scoped product, behavior, API, architecture, database, migration, security, permission, deployment, or data-repair changes.
- Keep long-lived documentation under `docs/arch/`, `docs/biz/`, or `docs/deployment/`. Do not create documentation README/index pages.
- Keep root governance files and `apps/*/README.md` concise; do not duplicate an authoritative rule across documents.

## Project Skills

- Load `cnode-docs` before creating, editing, moving, reviewing, or deleting documentation, root governance files, app READMEs, generated OpenAPI output, deployment examples, or GitHub templates.
- Load `cnode-web-design` before changing Web layouts, route composition, UI components, themes, responsive behavior, Markdown presentation, or design-system source.
- Follow project Skills before generic framework guidance. Keep hard boundaries here and detailed execution methods in Skills.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
pnpm db:push:pg
pnpm db:migrate
pnpm db:seed
pnpm migrate:mongo-to-pg
pnpm migrate:reconcile
```

Run targeted checks while editing and `pnpm verify` before release or PR validation when feasible. Deployment preflight may validate Compose separately; ordinary repository verification must not run Docker Compose.
