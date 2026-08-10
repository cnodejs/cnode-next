# Production Deployment

Run Compose commands from `docs/deployment`. The Compose file reads the `.env` beside it; create that file once before the first deployment and never commit it.

## First Setup

```bash
cd docs/deployment
cp env.production.example .env
vi .env
docker compose config --quiet
docker compose config --images
```

Replace every placeholder, including the immutable API and Web image tags. The single ignored `.env` is the operator source for application settings, the OpenObserve root identity, and the dedicated ingestion identity. All baseline services share this dotenv file; only the Collector configuration uses the ingestion identity, and application code must not read or use either OpenObserve identity.

For a repository-only preflight that does not read private dotenv files, render with the safe examples. This command only resolves configuration; it does not create or start containers:

```bash
CNODE_ENV_FILE=env.production.example \
docker compose --env-file env.production.example config --quiet
```

Start PostgreSQL and Redis before the applications:

```bash
docker compose up -d --no-build postgres redis
```

## Adopt Or Start OpenObserve

Compose uses the Docker volume named `openobserve-data`. For a new installation, start OpenObserve directly:

```bash
docker compose up -d --no-build openobserve
```

If OpenObserve already runs outside this Compose project, do not run the preceding command. First confirm that the existing container's `/data` mount uses the expected volume:

```bash
docker inspect openobserve --format '{{range .Mounts}}{{println .Name .Destination}}{{end}}'
```

Proceed only when the output contains `openobserve-data /data`. Stop and remove the old container, then let Compose recreate it with the same volume:

```bash
docker stop openobserve
docker rm openobserve
docker compose up -d --no-build openobserve
```

OpenObserve uses `latest`. Before pulling an update, create and verify a restorable `openobserve-data` backup and record the current image ID. Its internal address is `http://openobserve:5080`; Compose does not publish that port.

## Configure Tracing

In OpenObserve, create a dedicated ingestion-only identity for the Collector; do not reuse the root account. Put its OTLP base URL in `OPENOBSERVE_OTLP_ENDPOINT` and the base64 credential portion of the Basic authorization value in `OPENOBSERVE_AUTH_TOKEN`. The Collector sends `Authorization: Basic <token>` and `stream-name: default`; application telemetry configuration references only `http://otel-collector:4318/v1/traces` and does not consume OpenObserve credentials.

The Collector image is pinned to `otel/opentelemetry-collector-contrib:0.135.0`; this reviewed Contrib release includes the OTLP receiver/exporter and transform processor used by `otel-collector.yaml`. OpenObserve remains `latest`, so before each pull record its current image ID and verify the configured Collector target and OTLP ingestion after the update:

```bash
docker image inspect public.ecr.aws/zinclabs/openobserve:latest --format '{{.Id}}'
docker compose config --quiet
docker compose up -d --no-build openobserve otel-collector
docker compose ps openobserve otel-collector
```

Enable application tracing with `CNODE_OTEL_ENABLED=1`. `CNODE_OTEL_TRACE_SAMPLE_RATIO=0.1` samples ten percent of local root traces; `0` and `1` are valid deterministic limits. Invalid configuration disables tracing without blocking application startup and diagnostics name only the invalid variable.

## Deploy A Release

Update `CNODE_API_IMAGE` and `CNODE_WEB_IMAGE` in `.env`, then pull the images:

```bash
docker compose config --quiet
docker compose pull api web worker otel-collector
```

If the release contains a reviewed PostgreSQL schema migration, create and verify a restorable database backup, then run:

```bash
docker compose run --rm api pnpm db:migrate
```

Skip that command when the release has no schema migration. A failed migration stops the deployment and requires the reviewed rollback or repair plan.

Start the new application containers:

```bash
docker compose up -d --no-build --no-deps api worker
docker compose up -d --no-build --no-deps web
```

## Verify

```bash
docker compose ps api web worker postgres redis openobserve otel-collector
curl -fsS http://127.0.0.1:3001/health
```

Run the public URL, API contract, authentication, and write smoke checks applicable to the release. Confirm API and worker traces appear under `cnode-api` and `cnode-moderation-worker`, and that an `X-Request-ID` from a sampled response locates its request span. Record only the commit, image identifiers, migration result, health result, and redacted smoke result.

If traces are absent, first confirm the three service names and internal endpoints in the rendered Compose configuration, then inspect redacted API/worker and Collector status. Collector or OpenObserve failure must not change API responses or stop the worker; bounded queues may drop traces during a long outage. Do not print container environments or authentication headers while troubleshooting.

## Use Adminer

Adminer publishes the `ADMINER_PORT` configured in `.env`. Before starting it, restrict that port to approved source IPs with the host firewall, cloud security group, or reverse proxy. Compose does not enforce the allowlist.

```bash
docker compose --profile adminer pull adminer
docker compose --profile adminer up -d --no-build adminer
```

Verify an approved source can connect and a non-approved source cannot. Enter PostgreSQL credentials on the login page; do not store them in Compose or deployment records. Remove Adminer after use:

```bash
docker compose --profile adminer rm -sf adminer
```

## Roll Back

To roll back tracing without changing the application image, set `CNODE_OTEL_ENABLED=0` in `.env`, restart API and worker, then stop the Collector:

```bash
docker compose up -d --no-build --no-deps api worker
docker compose stop otel-collector
curl -fsS http://127.0.0.1:3001/health
```

This does not change PostgreSQL data or the OpenObserve volume.

Restore the previous API and Web image values in `.env`, then run:

```bash
docker compose pull api web worker
docker compose up -d --no-build --no-deps api worker
docker compose up -d --no-build --no-deps web
curl -fsS http://127.0.0.1:3001/health
```

An image rollback does not reverse a database migration. Use its reviewed rollback or roll-forward plan.

Never print or commit `.env`, credentials, database URLs, private keys, tokens, user data, or private infrastructure details.
