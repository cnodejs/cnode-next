# Web

`apps/web` is the React Router SSR application. It owns public and admin routes, browser interactions, runtime public configuration, and the `/api` Swagger UI page.

## Commands

```bash
pnpm --filter @cnode/web dev
pnpm --filter @cnode/web test
pnpm --filter @cnode/web typecheck
pnpm --filter @cnode/web build
```

The app loads the root `.env` by default. Browser API calls use runtime public configuration; SSR loaders use the internal API base. UI work follows the repository shadcn/Base UI design system and must preserve SSR, accessibility, responsive behavior, and the generated `public/openapi.json` asset.
