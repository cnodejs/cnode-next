# Conventions

This repository keeps public project documentation concise, task-oriented, and safe to maintain with human and AI contributors. Read this page before opening a PR.

## Documentation Domains

| Domain | Purpose | Rules |
| ------ | ------- | ----- |
| `README.md` | Open-source project entry | Intro, features, stack, quick start, docs, contributing, security, license. No large diagrams or historical narrative. |
| `docs/` | Stable task documentation | Architecture, development, database, migration, API reference, moderation, and security tasks. Keep current behavior first. |
| `wiki/` | Knowledge base | Historical context, legacy behavior, migration background, community rules, and business logic notes. Must follow [wiki/writing-guidelines.md](../wiki/writing-guidelines.md). |
| `deployment/` | Production deployment domain | Production runbook, compose file, grouped dotenv template, audit template, and real operator assets. |
| `openspec/` | Proposed and accepted behavior changes | Use for scoped product, API, migration, release, architecture, database, security, permissions, deployment, or data repair changes. |

`docs/`, `wiki/`, and `deployment/` are sibling domains. `docs/` answers "how do I develop, understand, or use this now?". `wiki/` records "why is this true, where did it come from, and what still needs review?". `deployment/` contains the production runbook and files operators can copy, validate, or execute.

## Writing Rules

- Start each doc with the reader task and current scope.
- Prefer short sections, tables, and command blocks over long background prose.
- For docs with diagrams, use this order: description, diagram, concise table or list.
- Link to historical or legacy background in `wiki/` instead of making it the main docs narrative.
- Remove one-time release validation notes, internal ratings, and duplicated explanations from stable docs when the information is no longer an active task.

## Development Rules

- Package manager: `pnpm` workspace, ESM, TypeScript strict.
- Runtime database: PostgreSQL only.
- Keep shared types, Zod schemas, constants, and pure helpers in `packages/shared`.
- Keep Drizzle schema and database clients in `packages/db`.
- Keep web app in `apps/web` (React Router v7 SSR, Tailwind CSS v4, shadcn/ui).
- Keep API and workers in `apps/api` (Hono on Node.js).
- Do not lint, test, build, edit, or ship legacy reference code outside this repository.

## Web UI Source Governance

The mandatory component, theme, composition, responsive, page-archetype, and Markdown rules live in [`docs/design-system.md`](design-system.md). `apps/web/app/components/ui/` is repository-owned shadcn `base-nova` source on Base UI, using the pinned toolchain in `apps/web/package.json` and `pnpm-lock.yaml`.

- Review one registry component at a time from the Web workspace:

```bash
pnpm --filter @cnode/web exec shadcn add <component> --dry-run
pnpm --filter @cnode/web exec shadcn add <component> --diff
```

- Inspect every registry dependency and diff. Preserve only documented alias, React Router composition, localization, and tested behavior patches.
- Never run `shadcn add --all`, bulk-overwrite `components/ui/`, reintroduce Radix/Slot compatibility, or use an unpinned CLI.
- CNode branding is expressed through semantic theme roles. Primitive source and routes must not use raw CNode palette utilities or redefine primitive appearance with `className`.
- `pnpm test` runs the design-system governance gate; UI work is incomplete while it fails.

These are current implementation conventions, so no `wiki/` synchronization is required.

## Git Workflow

| Item | Rule |
| ---- | ---- |
| Branch naming | `feat/<scope>-<short>`, `fix/<scope>-<short>`, `docs/<short>`, `chore/<short>`, or OpenSpec change name. |
| Base branch | `main`. |
| Commit style | Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `ci:`, `refactor:`, `perf:`. Scope optional, e.g. `feat(api):`. |
| Commit message | Imperative mood, lowercase first letter, no trailing period. Body explains why, not what. |
| Atomic commits | One logical change per commit. Split mixed changes into a chain of PRs when possible. |
| Branch lifecycle | Delete feature branches after merge. |
| Force push | Never on shared branches. Use `--force-with-lease` on your own branch only when truly needed. |

## Pull Requests

| Step | Expectation |
| ---- | ----------- |
| Scope | One concern per PR. Reference an OpenSpec change when behavior, product, API, migration, release, or architecture is touched. |
| Title | Conventional Commit format matching the primary change type. |
| Description | State what changed and why. Note migration, deployment, and secret-handling impact. |
| Tests | Add or update tests for behavior changes. Pure refactors still pass `pnpm test`. |
| Docs | Update `docs/` and `apps/api/src/routes/*.ts` zod-openapi declarations when API behavior changes. Run `pnpm gen:openapi` to regenerate `api/openapi.json`. |
| Database audit | For PostgreSQL schema, migration, seed/bootstrap, index, constraint, backfill, cleanup, repair, retention, or field semantic changes, link to the OpenSpec `Database Change Audit`. |
| Verification | Run `pnpm verify` when feasible. If not, list the subset that was run and why. |
| Reviews | At least one maintainer approval for `main`. Request review from domain owners for affected packages. |
| Squash merge | Default. The squashed commit message should follow Conventional Commits. |

## Code Review

- Reviewer focuses on correctness, security, test coverage, API contract, and doc accuracy — not style (enforced by oxlint and oxfmt).
- Reviewer reproduces the change locally for behavior-touching PRs when feasible.
- Use `packages/shared` Zod schemas as the contract boundary between Web and API.
- Prefer focused comments over blanket approvals. If a PR needs major rework, request changes with clear reasons.
- Do not approve your own PR. External contributors must be approved by a maintainer.

## Testing

| Level | Expectation |
| ----- | ----------- |
| Unit | Pure logic in `packages/shared` and helpers must have unit tests. |
| API route | `apps/api` uses Vitest. Route tests may use Hono `app.request` and fake/mock service boundaries, but must not connect to a real database. |
| DB behavior | Do not add database integration tests unless a future OpenSpec change defines a PostgreSQL-only strategy. Current API tests do not use a real test database. |
| Contract | `pnpm gen:openapi` regenerates `api/openapi.json` from route zod-openapi declarations. `pnpm verify` includes this step. |
| No SQLite | Tests must not make SQLite, PGlite, in-memory SQL, or dialect fallback a release path. Pure logic checks are acceptable when no DB is needed. |
| Naming | `apps/api` tests live under `apps/api/test/**/*.test.ts`; other packages use `*.test.ts` next to source or under `__tests__`. |
| Running | `apps/api` runs `vitest run` with automatic test discovery. Use `pnpm test` per package, `pnpm -r test` across the workspace. |

API tests must not require `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, or any real PostgreSQL test database. Tests that need database-backed branches should fake the service/query boundary and state that they verify route behavior, not PostgreSQL semantics.

## OpenSpec And Design Process

- Use OpenSpec for scoped behavior, product, API, migration, release, architecture, database, security, permissions, deployment, or data repair changes. See [CONTRIBUTING.md](../CONTRIBUTING.md) and [docs/openspec-governance.md](openspec-governance.md).
- Small documentation corrections and mechanical fixes can be submitted directly when they do not change shipped behavior.
- Proposals should state Why, What Changes, Scope, Non-goals, Capabilities, Impact, and Documentation Impact.
- Specs are capability-oriented and declarative. Implementation details belong in `design.md` or tasks, not the spec.
- Designs should include Mermaid diagrams or concise matrices for affected architecture, data, state, permission, and migration flows.
- Database-related designs must include a `Database Change Audit` covering impact, compatibility, migration, rollback, performance, data integrity, and documentation updates.
- Archive a change only after tasks are complete, documentation impact is handled, database audit evidence exists where applicable, and `openspec validate --all --strict` passes.

## Documentation Sync Rules

| Change area | Documentation expectation |
| ----------- | ------------------------- |
| Current development, runtime, architecture, API, database, migration, moderation, or security behavior | Update the relevant `docs/` page or explain why stable docs are not affected. |
| Business rules, legacy behavior, migration background, community rules, or sourced historical context | Update the relevant `wiki/` page and follow [wiki/writing-guidelines.md](../wiki/writing-guidelines.md). |
| API contract behavior | Update route zod-openapi declarations and regenerate `api/openapi.json` with `pnpm gen:openapi`. |
| PostgreSQL schema, migration, index, constraint, backfill, cleanup, repair, retention, or field semantics | Include OpenSpec `Database Change Audit`; update `docs/database.md`, `docs/migration-runbook.md`, or `wiki/migration-background.md` when durable knowledge changes. |

## API Documentation Rules

- Use method plus relative path headings, for example `GET /api/v1/topics`.
- Use tables for path params, query, body, and response fields when they improve scanning.
- Use short prose, lists, and code blocks for explanations, errors, and examples; do not turn the whole API reference into tables.
- Keep local development hostnames in [docs/development.md](development.md), not repeated throughout the API reference.
- `api/openapi.json` is auto-generated from `apps/api/src/routes/*.ts` zod-openapi declarations via `pnpm gen:openapi`. Do not hand-edit it. The route declarations are the single source of truth for API contracts.

## Secret Handling

- Never read, print, commit, or document real `.env` values, tokens, private keys, cookies, database URLs, production credentials, or user data.
- Use placeholders such as `<secret>`, `<local-password>`, `example`, or `${ENV_VAR}`.
- Run `pnpm secrets:scan` before sharing changes that touch config, deployment, auth, storage, mail, CI, or database files.
- See [SECURITY.md](../SECURITY.md) for vulnerability reporting rules.

## Wiki Rules For AI Agents

AI-written wiki content must not turn guesses into facts. Missing sources, uncertain legacy behavior, or inferred business rules must be marked as `To confirm` in the page. Do not expand wiki pages with unsupported historical claims, generalized community lore, or invented rationale.
