---
name: cnode-docs
description: Govern cnode-next documentation. Always load this skill before creating, editing, moving, reviewing, or deleting docs, root governance files, app READMEs, generated OpenAPI output, deployment examples, or GitHub Issue/PR templates.
---

# CNode Documentation

Keep repository documentation concise, current, safe, and owned by one source.

## Choose The Owner

| Content | Location |
| --- | --- |
| Generated API reference asset | `apps/web/public/openapi.json` |
| Runtime, data, and design-system architecture | `docs/arch/` |
| Business rules, community governance, and legacy knowledge | `docs/biz/` |
| Deployment guide, example configuration, Compose, and operator helpers | `docs/deployment/` |
| Project overview | `README.md` |
| Agent boundaries and skill triggers | `AGENTS.md` |
| Contributor workflow | `CONTRIBUTING.md` |
| Vulnerability reporting | `SECURITY.md` |
| App-specific setup and commands | `apps/*/README.md` |

Do not create `README.md` or `index.md` inside `docs/`. Do not recreate top-level `wiki/`, `api/`, or `deployment/` documentation domains.

## Edit Workflow

1. State the reader and the one task the document serves.
2. Identify the authoritative source before writing.
3. Search for existing coverage and choose one owner.
4. Classify old content as keep, compress, merge, or delete.
5. Keep durable behavior, boundaries, decisions, and business meaning.
6. Remove implementation history, progress notes, release evidence, ratings, and details directly available from source.
7. Update links, generated copies, scripts, and checks affected by path changes.
8. Run the smallest relevant validation, then the repository gate when feasible.

## Source Of Truth

- Application behavior: implementation and tests.
- API shape: route zod-openapi declarations. Generate `apps/web/public/openapi.json`; never hand-edit it.
- Database shape: `packages/db/src/schema/` and reviewed migrations.
- Commands: workspace `package.json` files.
- Business meaning: `docs/biz/`, supported by source references.
- Architecture decisions: `docs/arch/`.
- Deployment examples and procedures: `docs/deployment/`.

Do not copy route inventories, schema fields, function bodies, or package scripts into prose unless the reader needs a stable semantic rule that those sources do not explain.

## Writing Standard

- Give every document one purpose and audience.
- Lead with current behavior; omit change history and implementation narration.
- Prefer short prose and focused lists. Use tables for comparison and diagrams only for relationships or flow.
- Link to an owner instead of repeating its rules.
- Cite repository paths for architecture, business, migration, and legacy claims.
- Put unresolved business or historical claims under `To Confirm`; never turn inference into fact.
- Delete obsolete content instead of preserving it as historical narrative.
- Update durable documentation in the same change as behavior.

Use headings only when they help navigation. `Scope`, `Sources`, and `To Confirm` are optional, not required filler.

## Safe Examples

Use `example.com`, `${ENV_VAR}`, `<secret>`, `<local-password>`, or similarly obvious placeholders. Never read, print, or document real dotenv values, credentials, private hosts, database URLs, tokens, user content, or environment-specific connection instructions.

## Collaboration Templates

- Bug Issue: Description, Reproduction, optional Additional context.
- Feature Issue: Problem, Proposal.
- Pull request: Summary, Verification, optional Notes.
- Issue configuration: private security advisory entry only.

Do not ask contributors to repeat CI results as checkboxes, classify internal paths, or confirm policy they cannot reasonably evaluate.

## Validation

- Regenerate `apps/web/public/openapi.json` after route contract changes and verify the Web `/api` reference still loads it.
- Check current files and non-archive specs for obsolete paths after moves.
- Run `pnpm secrets:scan` for docs, examples, deployment, auth, storage, mail, CI, or database changes.
- Run relevant lint, typecheck, tests, build, and OpenSpec strict validation.
- Validate Compose only as deployment preflight; ordinary repository verification must not invoke Docker Compose.
