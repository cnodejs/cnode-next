# Production Deployment

Run every command from the repository root. The Compose file reads the root `.env`; create it once before the first deployment and never commit it.

## First Setup

```bash
cp docs/deployment/env.production.example .env
vi .env
docker compose -f docs/deployment/docker-compose.yml config --quiet
docker compose -f docs/deployment/docker-compose.yml config --images
```

Replace every placeholder in `.env`, including the immutable API and Web image tags. Keep real credentials only in this ignored file.

Start PostgreSQL and Redis before the applications:

```bash
docker compose -f docs/deployment/docker-compose.yml up -d --no-build postgres redis
```

## Adopt Or Start OpenObserve

Compose uses the Docker volume named `openobserve-data`. For a new installation, start OpenObserve directly:

```bash
docker compose -f docs/deployment/docker-compose.yml up -d --no-build openobserve
```

If OpenObserve already runs outside this Compose project, do not run the preceding command. First confirm that the existing container's `/data` mount uses the expected volume:

```bash
docker inspect openobserve --format '{{range .Mounts}}{{println .Name .Destination}}{{end}}'
```

Proceed only when the output contains `openobserve-data /data`. Stop and remove the old container, then let Compose recreate it with the same volume:

```bash
docker stop openobserve
docker rm openobserve
docker compose -f docs/deployment/docker-compose.yml up -d --no-build openobserve
```

OpenObserve uses `latest`. Before pulling an update, create and verify a restorable `openobserve-data` backup and record the current image ID. Its internal address is `http://openobserve:5080`; Compose does not publish that port.

## Deploy A Release

Update `CNODE_API_IMAGE` and `CNODE_WEB_IMAGE` in `.env`, then pull the images:

```bash
docker compose -f docs/deployment/docker-compose.yml config --quiet
docker compose -f docs/deployment/docker-compose.yml pull api web worker
```

If the release contains a reviewed PostgreSQL schema migration, create and verify a restorable database backup, then run:

```bash
docker compose -f docs/deployment/docker-compose.yml run --rm api pnpm db:migrate
```

Skip that command when the release has no schema migration. A failed migration stops the deployment and requires the reviewed rollback or repair plan.

Start the new application containers:

```bash
docker compose -f docs/deployment/docker-compose.yml up -d --no-build --no-deps api worker
docker compose -f docs/deployment/docker-compose.yml up -d --no-build --no-deps web
```

## Verify

```bash
docker compose -f docs/deployment/docker-compose.yml ps api web worker postgres redis openobserve
curl -fsS http://127.0.0.1:3001/health
```

Run the public URL, API contract, authentication, and write smoke checks applicable to the release. Record only the commit, image identifiers, migration result, health result, and redacted smoke result.

## Use Adminer

Adminer publishes the `ADMINER_PORT` configured in `.env`. Before starting it, restrict that port to approved source IPs with the host firewall, cloud security group, or reverse proxy. Compose does not enforce the allowlist.

```bash
docker compose -f docs/deployment/docker-compose.yml --profile adminer pull adminer
docker compose -f docs/deployment/docker-compose.yml --profile adminer up -d --no-build adminer
```

Verify an approved source can connect and a non-approved source cannot. Enter PostgreSQL credentials on the login page; do not store them in Compose or deployment records. Remove Adminer after use:

```bash
docker compose -f docs/deployment/docker-compose.yml --profile adminer rm -sf adminer
```

## Roll Back

Restore the previous API and Web image values in `.env`, then run:

```bash
docker compose -f docs/deployment/docker-compose.yml pull api web worker
docker compose -f docs/deployment/docker-compose.yml up -d --no-build --no-deps api worker
docker compose -f docs/deployment/docker-compose.yml up -d --no-build --no-deps web
curl -fsS http://127.0.0.1:3001/health
```

An image rollback does not reverse a database migration. Use its reviewed rollback or roll-forward plan.

Never print or commit `.env`, credentials, database URLs, private keys, tokens, user data, or private infrastructure details.
