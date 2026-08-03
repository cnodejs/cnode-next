# Deploy

`deployment/` is the production deployment domain for CNode.js Next. It contains the production runbook, compose file, dotenv template, and audit template. Local development belongs in [`docs/development.md`](../docs/development.md); historical operational context belongs in `wiki/`.

## Assets

| Path | Purpose |
| ---- | ------- |
| `docker-compose.prod.yml` | Production Docker Compose topology for API, Web, worker, PostgreSQL, Redis, and explicit migration profiles. |
| `.env.production.example` | Grouped production dotenv template with placeholders only. Copy to the server as `.env` and fill values there. |
| `production-audit-template.md` | Redacted deployment audit record template for operators. |
| `migration-reports/` | Runtime output directory for migration and reconcile reports. Generated JSON files are ignored. |

Product schema migrations remain in `packages/db/migrations/pg/`. Add deployment-specific SQL or helper scripts under `deployment/` only when they are actual operator assets.

## Boundaries

| Boundary | Rule |
| -------- | ---- |
| Images | Deploy SHA tags or digests, never `latest` as the only identifier. |
| Server builds | Do not build application images on the production server. |
| Migrations | Run schema/data/reconcile tasks only through explicit `migrate` profile commands. |
| Secrets | Never print, commit, paste, or record real `.env`, tokens, private keys, database URLs, cookies, or user data. |
| Audit | Record only redacted commit/image/check summaries. Use `production-audit-template.md`. |

Compose validation belongs to the deployment-host preflight. Repository verification MUST NOT invoke local Docker Compose.

## Release Images

GitHub Actions builds and publishes images through `.github/workflows/build-images.yml`. The workflow runs verification before pushing images and does not connect to production.

```bash
CNODE_API_IMAGE=ghcr.io/cnodejs/cnode-api:sha-<commit>
CNODE_WEB_IMAGE=ghcr.io/cnodejs/cnode-web:sha-<commit>
```

## Preflight

Before deployment:

1. Confirm `pnpm verify` passed for the selected commit.
2. Confirm API/Web images exist in GHCR with SHA tags or digests.
3. Confirm server-local `.env` is present and complete.
4. Confirm whether schema or data migration is required.
5. Start a redacted audit record from `production-audit-template.md`.
6. Record the current running API/Web image tags or digests for rollback.
7. For the environment-contract release, prepare all `CNODE_*`, `POSTGRES_*`, and `REDIS_*` values before switching images; do not rely on legacy aliases.

Record rollback images:

```bash
docker compose -f deployment/docker-compose.prod.yml images api web worker
```

## Environment Contract Cutover

1. Schedule one maintenance window for the new `.env`, Compose file, and application images; do not deploy them separately.
2. Record the previous images, Compose file, and environment variable names without printing secret values.
3. Have an operator update the server-local `.env` from `APP_*` and `DB_*` to `CNODE_*` and `POSTGRES_*`; Redis keeps its standard `REDIS_*` names.
4. Validate the rendered Compose config without displaying container environments or secret values.
5. Recreate application containers without running schema/data migrations and without recreating PostgreSQL or Redis volumes.
6. Run health and smoke checks. If startup fails, restore the previous images, Compose file, and environment variable names as one rollback unit.

## Deploy Steps

Export selected images on the production host or set them in the host-local `.env`:

```bash
export CNODE_API_IMAGE=ghcr.io/cnodejs/cnode-api:sha-<commit>
export CNODE_WEB_IMAGE=ghcr.io/cnodejs/cnode-web:sha-<commit>
```

Run migrations only when required by the release:

```bash
docker compose -f deployment/docker-compose.prod.yml --profile migrate run --rm migrate-schema
docker compose -f deployment/docker-compose.prod.yml --profile migrate run --rm migrate-data
docker compose -f deployment/docker-compose.prod.yml --profile migrate run --rm reconcile
```

Pull and start services without building:

```bash
docker compose -f deployment/docker-compose.prod.yml pull api web worker
docker compose -f deployment/docker-compose.prod.yml up -d --no-build postgres redis api web worker
```

## Post-Deploy Checks

```bash
curl -fsS https://api.cnodejs.org/health
curl -fsS 'https://api.cnodejs.org/api/v1/topics?limit=1&tab=all'
curl -fsS 'https://cnodejs.org/'
docker compose -f deployment/docker-compose.prod.yml ps api web worker
```

Manually verify homepage, topic detail, login/session state, test-account posting or replying, messages, and upload presign. Record only short redacted summaries.

## Rollback

Rollback restores the previous successful image tags or digests and repeats pull, `up --no-build`, health, and smoke.

```bash
export CNODE_API_IMAGE=ghcr.io/cnodejs/cnode-api:sha-<previous-commit>
export CNODE_WEB_IMAGE=ghcr.io/cnodejs/cnode-web:sha-<previous-commit>
docker compose -f deployment/docker-compose.prod.yml pull api web worker
docker compose -f deployment/docker-compose.prod.yml up -d --no-build postgres redis api web worker
curl -fsS https://api.cnodejs.org/health
```

If a migration changed production data, image rollback is not database rollback. Use the migration audit record to decide whether to restore, repair, or roll forward.

Environment-contract rollback is atomic: restore the previous images, Compose file, and previous environment variable names together. New images do not accept legacy PostgreSQL or Redis variables. Do not recreate the PostgreSQL volume, and do not treat changing the PostgreSQL container environment as a database password rotation.

## Runtime Configuration

Key production environment groups live in `.env.production.example`.

```bash
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=cnode
POSTGRES_USER=cnode
POSTGRES_PASSWORD=<secret>
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
CNODE_WEB_BASE_URL=https://cnodejs.org
CNODE_API_INTERNAL_BASE_URL=http://api:3001
CNODE_API_BASE_URL=https://api.cnodejs.org
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

`CNODE_API_INTERNAL_BASE_URL` is used by Web SSR inside Docker. `CNODE_API_BASE_URL` is injected into browser runtime config. `CNODE_WEB_BASE_URL` is used for OAuth redirects and email links. `TURNSTILE_SITE_KEY` may be public; `TURNSTILE_SECRET_KEY` is API-server only.

The moderation worker uses the API image and starts with `pnpm --filter @cnode/api worker:moderation`. It can be stopped independently from API/Web if resource pressure appears.
