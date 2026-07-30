# CNode.js Next

CNode.js Next powers cnodejs.org, the Node.js Chinese developer community. It is a modern rewrite of the original nodeclub application, built as an open-source TypeScript monorepo.

CNode（cnodejs.org）是 Node.js 中文专业社区，起源于 nodeclub。本项目是 CNode 的现代化重写，保持 API 和业务行为兼容，运行时数据库迁移到 PostgreSQL。

## Features

| Area | Capabilities |
| ---- | ------------- |
| Web | React Router v7 SSR, Vite, Tailwind CSS v4, shadcn/ui |
| API | Hono on Node.js, cookie auth, GitHub OAuth, legacy `accesstoken` compatibility |
| Data | PostgreSQL-only Drizzle schema and Mongo-to-PostgreSQL migration tools |
| Moderation | Keyword rules, scan jobs, audit-oriented admin workflows |
| Delivery | Docker Compose production runbook and GHCR image workflow documentation |
| Safety | Secret handling guidance, Gitleaks scan command, security reporting entry |

Shared TypeScript and Zod contracts span Web and API. pnpm workspace manages the monorepo.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm db:push:pg
pnpm dev
```

Local endpoints:

| Service | URL |
| ------- | --- |
| Web | `http://localhost:5173` |
| API | `http://localhost:3001` |

Root `.env` is the single default local environment source. Do not commit real `.env` files or secrets. See [docs/conventions.md](docs/conventions.md) for documentation, development, and secret handling conventions.

## Documentation

| Need | Start here |
| ---- | ---------- |
| Documentation and contribution conventions | [docs/conventions.md](docs/conventions.md) |
| Architecture and runtime boundaries | [docs/architecture.md](docs/architecture.md) |
| Local development and verification | [docs/development.md](docs/development.md) |
| Production deployment | [deployment/README.md](deployment/README.md) |
| PostgreSQL schema and migration rules | [docs/database.md](docs/database.md) |
| Mongo-to-PostgreSQL migration | [docs/migration-runbook.md](docs/migration-runbook.md) |
| API reference | [api/openapi.json](api/openapi.json) (auto-generated, view at `/api` page) |
| Content moderation | [docs/content-moderation.md](docs/content-moderation.md) |
| Historical context and legacy behavior notes | [wiki/README.md](wiki/README.md) |
| Security practices | [docs/security.md](docs/security.md), [SECURITY.md](SECURITY.md) |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR. Behavior, product, API, migration, release, or architecture changes should use OpenSpec; small documentation corrections can be submitted directly when they do not change shipped behavior. We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Report vulnerabilities through a private maintainer-approved channel when possible. Do not paste secrets, tokens, cookies, private keys, database URLs, or user data into public issues. See [SECURITY.md](SECURITY.md).

## License

CNode.js Next is released under the [MIT License](LICENSE). Legacy reference code outside this repository is not covered by this license.
