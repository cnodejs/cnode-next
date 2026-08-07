# CNode.js Next

CNode.js Next powers [cnodejs.org](https://cnodejs.org), the Node.js Chinese developer community. It is an open-source TypeScript monorepo that preserves CNode's public API and core community behavior while running on PostgreSQL.

## Stack

- React Router SSR Web app with Tailwind CSS and shadcn/ui
- Hono API on Node.js with session, GitHub OAuth, and legacy access-token support
- PostgreSQL with Drizzle ORM; Redis for sessions and runtime coordination
- Shared TypeScript and Zod contracts across Web and API

## Quick Start

Requires Node.js 24+, pnpm, PostgreSQL, and Redis.

```bash
pnpm install
cp .env.example .env
pnpm db:push:pg
pnpm dev
```

Web runs at `http://localhost:5173`; API runs at `http://localhost:3001`. Root `.env` is the default local environment source and must never be committed.

See [apps/web/README.md](apps/web/README.md) and [apps/api/README.md](apps/api/README.md) for app-specific commands. Architecture is documented in [docs/arch/architecture.md](docs/arch/architecture.md), the Web app renders the generated API reference at `/api`, and the deployment example is in [docs/deployment/deployment.md](docs/deployment/deployment.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Community participation follows the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities according to [SECURITY.md](SECURITY.md).

## License

Released under the [MIT License](LICENSE). Legacy reference code outside this repository is not covered by this license.
