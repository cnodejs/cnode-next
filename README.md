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

See the [Web development guide](apps/web/README.md) and [API development guide](apps/api/README.md) for app-specific commands. The [architecture overview](docs/arch/architecture.md) documents system boundaries, the Web app renders the generated API reference at `/api`, and the [deployment guide](docs/deployment/deployment.md) provides the public deployment example.

## Contributing

Read the [contribution guide](CONTRIBUTING.md) before opening a pull request. Community participation follows the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities according to the [security policy](SECURITY.md).

## License

Released under the [MIT License](LICENSE). Legacy reference code outside this repository is not covered by this license.
