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

OpenObserve uses `latest`. Before pulling an update, create and verify a restorable `openobserve-data` backup and record the current image ID. Its internal address is `http://openobserve:5080`; Compose does not publish that port. `ZO_COMPACT_DATA_RETENTION_DAYS=30` applies one global 30-day retention period to logs, metrics, and traces. OpenObserve's compactor removes older data asynchronously, so disk usage does not drop immediately after restart. Never delete files directly from `openobserve-data`; increasing the retention value later cannot restore data already deleted by the compactor.

## Configure Application Telemetry

In OpenObserve, create a dedicated ingestion-only identity for the Collector; do not reuse the root account. Put its OTLP base URL in `OPENOBSERVE_OTLP_ENDPOINT` and the base64 credential portion of the Basic authorization value in `OPENOBSERVE_AUTH_TOKEN`. The Collector sends `Authorization: Basic <token>` and `stream-name: default`; application telemetry configuration references only the internal base `http://otel-collector:4318` and does not consume OpenObserve credentials.

The Collector image is pinned to `otel/opentelemetry-collector-contrib:0.135.0`; this reviewed Contrib release includes the OTLP receiver/exporter and transform processor used by `otel-collector.yaml`. Its traces, logs, and metrics pipelines use bounded memory, batches, queues, timeouts, and retries; traces and logs also pass through signal-specific sanitization. OpenObserve remains `latest`, so before each pull record its current image ID and verify all three OTLP signals after the update:

```bash
docker image inspect public.ecr.aws/zinclabs/openobserve:latest --format '{{.Id}}'
docker compose config --quiet
docker compose up -d --no-build openobserve otel-collector
docker compose ps openobserve otel-collector
```

Enable application telemetry with `CNODE_OTEL_ENABLED=1`. `CNODE_OTEL_TRACES_ENABLED`, `CNODE_OTEL_LOGS_ENABLED`, and `CNODE_OTEL_METRICS_ENABLED` independently control each signal. `CNODE_OTEL_TRACE_SAMPLE_RATIO=0.1` samples ten percent of local root traces; logs and metrics are not sampled with traces. `0` and `1` are valid deterministic trace limits. Invalid signal configuration disables only that signal without blocking application startup, and diagnostics name only the invalid variable.

API and worker logs remain as structured JSON on stdout when OTLP logs are disabled or unavailable. Each API request creates one completion access log. Logs exclude request bodies, query values, user and mail data, SQL, credentials, and raw error details; metrics use route templates and finite outcomes rather than request or business identifiers.

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

## Stage Web Security Headers

The Web application is the sole owner of CSP because its SSR response generates a unique nonce for each document. The HTTPS entry proxy must forward `X-Forwarded-Proto: https` and must not add, replace, or relax CSP. It may terminate TLS, redirect HTTP, and forward the application headers unchanged. Before deployment, inspect the effective proxy configuration and remove any existing CSP or duplicate security-header directives.

Set `CNODE_WEB_CSP_MODE=report-only` for the first production release. The accepted values are `off`, `report-only`, and `enforce`; changing the value requires only editing the deployment dotenv file and restarting Web, not rebuilding its image. Keep `CNODE_WEB_HSTS_MAX_AGE=300` for the initial HTTPS release. Set it to `0` to stop emitting HSTS on new responses. Do not add `includeSubDomains` or `preload` without a separate review of every subdomain.

The same-origin `/__csp-report` resource accepts bounded browser violation reports. It records only a structured, query-free summary and applies a per-source limit controlled by `CNODE_CSP_REPORT_LIMIT_PER_MINUTE`. Web stdout must reach the existing log pipeline before Report-Only observation starts.

Remain in Report-Only for at least one normal traffic cycle that covers public pages, sign-in and sign-up, topic creation and detail, admin entry, Turnstile, API requests, user Markdown images, and avatars. Move to `enforce` only when targeted browser tests pass, no unexplained first-party violation remains, required origins have review evidence, and the final public response contains one CSP header generated by Web. Arbitrary HTTPS images remain allowed because existing user Markdown supports external secure images; executable scripts remain limited to same-origin, the response nonce, and Turnstile.

## Verify

```bash
docker compose ps api web worker postgres redis openobserve otel-collector
curl -fsS http://127.0.0.1:3001/health
CNODE_WEB_BASE_URL=https://web.example.com CNODE_WEB_CSP_MODE=report-only pnpm smoke:web-security
```

Run the public URL, API contract, authentication, and write smoke checks applicable to the release. Under `cnode-api`, confirm request traces, one completion access log for a test request, HTTP request/duration metrics, and Node.js runtime metrics. Under `cnode-moderation-worker`, confirm tick traces, completion logs, worker metrics, and runtime metrics. An `X-Request-ID` must locate its access log; only a sampled request is guaranteed to have a stored trace. Record only the commit, image identifiers, migration result, health result, and redacted smoke result.

For a Web security release, also use a browser to verify hydration, navigation, API requests, avatars, user-content images, and Turnstile on the representative routes from the Report-Only gate. Confirm the public 2xx and HTML 404 responses contain the expected CSP mode, one nonce shared by every script in that document, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and the configured short HSTS value. The smoke command reports only path, status, and pass/fail; do not record response bodies, cookies, CSP report payloads, or request headers.

If a signal is absent, confirm its signal switch, the two application service names, and the internal Collector base endpoint in the rendered Compose configuration, then inspect redacted API/worker and Collector status. Collector or OpenObserve failure must not change API responses or stop the worker; bounded queues may drop telemetry during a long outage. Do not print container environments or authentication headers while troubleshooting.

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

If enforced CSP blocks a required first-party behavior, set `CNODE_WEB_CSP_MODE=report-only` and restart only Web:

```bash
docker compose up -d --no-build --no-deps web
CNODE_WEB_BASE_URL=https://web.example.com CNODE_WEB_CSP_MODE=report-only pnpm smoke:web-security
```

If the HTTPS topology is not ready for HSTS, set `CNODE_WEB_HSTS_MAX_AGE=0` before restarting Web. A previously received HSTS value remains in browsers until its current `max-age` expires; lowering the value affects only subsequent responses. Record the change time, failed behavior, expected CSP mode, Web restart result, and redacted smoke result.

To stop logs or metrics ingestion independently, set its signal switch to `0` and restart API and worker. Other signals continue, and structured stdout logs remain available:

```bash
docker compose up -d --no-build --no-deps api worker
curl -fsS http://127.0.0.1:3001/health
```

To roll back all OTLP telemetry without changing the application image, set `CNODE_OTEL_ENABLED=0` in `.env`, restart API and worker, then stop the Collector:

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
