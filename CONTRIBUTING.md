# Contributing

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Workflow

1. Keep each change focused and add tests for changed behavior.
2. Use OpenSpec for scoped product, behavior, API, architecture, database, migration, security, permission, deployment, or data-repair changes. Small documentation corrections and mechanical fixes may proceed directly.
3. Update durable documentation with the behavior it describes.
4. Run targeted checks while working and `pnpm verify` before requesting review when feasible.
5. In the pull request, explain what changed, why, what was verified, and any OpenSpec, migration, deployment, compatibility, or security notes.

If the full gate cannot run, list the commands that did run and the reason for the gap.

## Project Boundaries

- PostgreSQL is the only runtime database. Do not add SQLite or dialect fallback paths.
- `../nodeclub/` and `egg-cnode/` are reference-only legacy code and are not shipped or modified here.
- API contract changes start in route zod-openapi declarations and require `pnpm gen:openapi`.
- Use obvious placeholders such as `${ENV_VAR}`, `<secret>`, or `example.com` in examples.

Never commit real dotenv files, credentials, tokens, private keys, database URLs, private hosts, user data, or raw secret-scan output. Run `pnpm secrets:scan` after touching configuration, deployment, auth, storage, mail, CI, or database files. If a credential is exposed, remove it and rotate it.
