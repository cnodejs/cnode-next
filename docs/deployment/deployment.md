# Deployment Example

`docs/deployment/` contains a public Compose baseline and placeholder configuration. Adapt it outside the repository for the target environment; never commit environment-specific configuration.

## Prepare

Use immutable image SHA tags or digests and a private dotenv file based on `env.production.example`.

The Compose commands in this document belong to deployment preflight and operations. Repository and local verification MUST NOT run Docker Compose.

```bash
export CNODE_ENV_FILE="$PWD/.env"
export CNODE_API_IMAGE=ghcr.io/cnodejs/cnode-api:sha-<commit>
export CNODE_WEB_IMAGE=ghcr.io/cnodejs/cnode-web:sha-<commit>
docker compose -f docs/deployment/docker-compose.yml config --images
docker compose -f docs/deployment/docker-compose.yml pull api web worker
```

Before a release containing a reviewed PostgreSQL migration, create and verify a restorable backup using approved tooling. Apply the migration explicitly; skip this command when no migration is required.

```bash
docker compose -f docs/deployment/docker-compose.yml --profile migrate run --rm migrate-schema
```

## Start

```bash
docker compose -f docs/deployment/docker-compose.yml up -d --no-build --no-deps api worker
docker compose -f docs/deployment/docker-compose.yml up -d --no-build --no-deps web
```

## Verify

```bash
docker compose -f docs/deployment/docker-compose.yml ps api web worker
curl -fsS "${CNODE_API_BASE_URL}/health"
```

Run the API, Web, authentication, and write smoke checks applicable to the release. Record only redacted commit, image, migration, health, and smoke results.

## Roll Back

Restore the previous immutable image references, then repeat `pull`, `up --no-build`, health, and smoke checks. An image rollback does not reverse database changes; use the reviewed migration rollback or roll-forward plan.

`scripts/smoke-api-contract.ts` checks the public API contract. `scripts/preflight-github-id-uniqueness.ts` checks duplicate non-null GitHub IDs before a related migration. Both require an explicitly configured target environment and must not print credentials or user rows.

Never commit or print real dotenv values, credentials, private keys, database URLs, user data, environment-specific paths, connection instructions, or private infrastructure configuration.
