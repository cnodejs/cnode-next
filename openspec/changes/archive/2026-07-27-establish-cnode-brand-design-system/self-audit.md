# Self Audit

## Scope

- Desktop viewport: 1280x900.
- Mobile viewport: 390x844.
- Public/content/auth/search routes: `/`, `/search`, `/signin`, `/signup`, `/about`, `/faq`, `/getstart`, `/api`.
- Topic/user/message routes: `/topic/1`, `/topic/create`, `/user/admin`, `/my/messages`.
- Admin routes with authenticated `admin` seed cookie: `/admin`, `/admin/topics`, `/admin/users`, `/admin/bans`, `/admin/reports`, `/admin/keywords`, `/admin/audit`, `/admin/settings`.

## Commands

- `pnpm --filter @cnode/web typecheck`
- `pnpm --filter @cnode/web build`

## Results

- No horizontal overflow detected in audited desktop or mobile routes.
- No unexpected browser console errors after Vite dependency optimization/HMR settled.
- No broken images detected on topic and user routes; avatar fallback rendered for missing seed avatars.
- Command/search palette opens with `Meta+K` and exposes search/quick navigation actions.
- Auth-gated create, message, and admin routes redirect to the branded login flow when unauthenticated.
- Authenticated admin routes share the admin shell, active navigation model, CNode surfaces, table/panel hierarchy, and mobile horizontal admin navigation.
- Icon-only and checkbox controls in audited routes have accessible labels after fixes.

## Verified Behaviors

- `reply2` message creation only notifies the parent reply author when that author is neither the replier nor the topic author, avoiding duplicate topic-author notifications.
- Visible enabled controls audited include publish/login navigation, message entry, command/search, footer links, topic reply actions, admin nav, admin tabs, admin filters, and admin table actions.
- Representative hover, selected, disabled, loading/empty, and focus-visible states use CNode brand tokens through shared UI primitives.

## Residual Risks

- Browser login button interaction caused the Playwright target page to close twice, so authenticated admin audit used the API-issued seed cookie directly.
- React Router dev server logs expected future flag warnings and a `/favicon.ico` 404; these were not caused by this change.
