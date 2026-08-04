# Deploy

`deployment/` contains the versioned Compose baseline and placeholder dotenv template. Keep environment-specific configuration outside the repository.

## Prepare

Use immutable image SHA tags or digests and an ignored dotenv file based on `.env.production.example`.

```bash
export CNODE_ENV_FILE=.env
export CNODE_API_IMAGE=ghcr.io/cnodejs/cnode-api:sha-<commit>
export CNODE_WEB_IMAGE=ghcr.io/cnodejs/cnode-web:sha-<commit>
docker compose -f deployment/docker-compose.yml config --images
docker compose -f deployment/docker-compose.yml pull api web worker
```

Before a release containing a reviewed PostgreSQL migration, create and verify a restorable backup using approved tooling. Apply the migration explicitly; skip this command when no migration is required.

```bash
docker compose -f deployment/docker-compose.yml --profile migrate run --rm migrate-schema
```

## Start

```bash
docker compose -f deployment/docker-compose.yml up -d --no-build --no-deps api worker
docker compose -f deployment/docker-compose.yml up -d --no-build --no-deps web
```

## Verify

```bash
docker compose -f deployment/docker-compose.yml ps api web worker
curl -fsS "${CNODE_API_BASE_URL}/health"
```

Run the API, Web, authentication, and write smoke checks applicable to the release. Record only redacted commit, image, migration, health, and smoke results.

## Roll Back

Restore the previous immutable image references, then repeat `pull`, `up --no-build`, health, and smoke checks. An image rollback does not reverse database changes; use the reviewed migration rollback or roll-forward plan.

Never commit or print real dotenv values, credentials, private keys, database URLs, user data, environment-specific paths, connection instructions, or infrastructure configuration.
