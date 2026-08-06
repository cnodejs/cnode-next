# Base Nova Realignment Baseline

## Rollback Baseline

- Code baseline: `b81d012 feat: complete web ui hardening`.
- The change must be implemented as phase commits. Roll back by reverting the affected phase commits; do not reset a shared branch.
- The change is Web-only. Reverting it does not require API, PostgreSQL, Redis, object storage, or data migration operations.
- Existing runtime/database work present after `b81d012` is unrelated and must not be modified by this change.

## Captured Visual Baseline

| Surface         | Viewport | Theme | File                             |
| --------------- | -------- | ----- | -------------------------------- |
| Feed/home       | 1280px   | light | `baseline-home-1280-light.png`   |
| Feed/home       | 1280px   | dark  | `baseline-home-1280-dark.png`    |
| Feed/home       | 375px    | light | `baseline-home-375-light.png`    |
| Feed/home       | 375px    | dark  | `baseline-home-375-dark.png`     |
| Account/sign-in | 1280px   | dark  | `baseline-account-1280-dark.png` |

Anonymous navigation to `/admin` redirects to `/signin`, so an authenticated admin visual baseline remains part of the final browser audit. No credentials or production session material may be added to the repository to bypass that boundary.

The historical authenticated admin screenshot for `b81d012` remains unavailable. Reconstructing it would require running the historical tree separately; this was explicitly excluded from the final audit. Current authenticated admin screenshots are acceptance evidence, not mislabeled historical baselines.

## Current Primitive Inventory

Current repository-owned primitives:

`alert-dialog`, `alert`, `avatar`, `badge`, `button`, `card`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `empty`, `field`, `input`, `input-group`, `item`, `label`, `native-select`, `pagination`, `radio-group`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `spinner`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`.

The former `components/ui/form.tsx` wrapper now lives at the application layer as `components/Form.tsx` and renders Base Nova Field composition. Data Table remains an application composition over Table rather than a second Table primitive.

## Blast Radius

| Primitive/system | Current direct reach                 | Main risk                                               |
| ---------------- | ------------------------------------ | ------------------------------------------------------- |
| Layout           | 49 route callers                     | Header, footer, navigation and shell regressions        |
| AdminLayout      | 25 route callers                     | Navigation, mobile behavior and admin width             |
| Button           | 83 callers                           | Base Nova size changes and removed `inverse` variant    |
| Card             | 49 callers                           | New spacing model and removal of page padding overrides |
| Input            | 38 callers                           | Base Nova control density and Field migration           |
| Table            | 12 callers                           | Admin density, row states and horizontal overflow       |
| Sheet            | 3 callers                            | Mobile navigation/filter/contact focus and safe-area    |
| MarkdownView     | 5 callers through topic/reply/editor | Typeset affects all rendered Markdown                   |

Literal audit found more than 100 displayed matches for raw `cnode-*`/`surface-*`/`brand-*` utilities and more than 100 displayed primitive `className` overrides before result truncation. These are migration inputs, not patterns to preserve. Remaining `space-y-*` form/layout composition is also a migration target.

## Route Archetype Map

| Archetype           | Routes/surfaces                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| feed                | `/`, `/search`, `/stars`, `/user/:name/topics`, `/user/:name/replies`, `/user/:name/collections`, `/my/messages`    |
| reading             | `/topic/:tid`                                                                                                       |
| compose             | `/topic/create`, `/topic/:tid/edit`, `/reply/:id/edit`                                                              |
| account             | `/signin`, `/signup`, `/setting`, `/search_pass`, `/reset_pass`, `/active_account`, GitHub auth result routes       |
| directory           | `/user/:name`, `/users/top100`, `/zone/jobs`                                                                        |
| content             | `/about`, `/api`, app download and shell footer content; implemented with the nearest public application blocks     |
| dashboard           | `/admin`                                                                                                            |
| data-list           | `/admin/users`, `/admin/bans`, `/admin/topics`, `/admin/tabs`, `/admin/zones`, `/admin/keywords`, `/admin/settings` |
| workflow            | `/admin/moderation`, `/admin/reports`, `/admin/audit`                                                               |
| non-visual resource | RSS, robots, sitemap, OAuth callback and redirect-only routes; no page primitive migration                          |

## Locked Registry Baseline

The workspace locks shadcn CLI `4.16.1` and `@base-ui/react` `1.6.0`. A clean Vite baseline was generated outside the workspace with:

```bash
shadcn init --template vite --base base --preset nova --name cnode-base-nova
shadcn add alert-dialog alert avatar badge card checkbox command dialog dropdown-menu empty field input input-group item label native-select pagination radio-group select separator sheet sidebar skeleton sonner spinner table tabs textarea toggle toggle-group tooltip
```

The resulting config is `style: "base-nova"`. Running `view base-nova/button` inside the current `new-york` project is invalid because the CLI scopes the request through the current style and constructs a nonexistent `new-york-v4/base-nova/button.json` path.

For each project component after `components.json` is realigned:

```bash
pnpm --filter @cnode/web exec shadcn add <component> --dry-run
pnpm --filter @cnode/web exec shadcn add <component> --diff <file>
```

## Allowed Source Differences

- Repository aliases use `~/` instead of the scratch project's `@/`.
- React Router links use Base UI `render`; no `asChild` or Radix Slot compatibility is allowed.
- React Router SSR does not use React Server Components, so generated `"use client"` directives are unnecessary where the component does not require that boundary.
- A documented, tested Base UI behavior fix may remain only when registry behavior is insufficient; brand color, spacing and radius are not valid exceptions.
- English registry accessibility labels must be localized where they are user-facing, without changing structure or styling.

## Base Nova Theme Facts

- Generated Nova radius: `0.625rem` with multiplicative derived radii.
- Generated theme includes complete core, `chart-1` through `chart-5`, and `sidebar-*` token families.
- Dark border/input use alpha foreground values.
- The generated neutral primary, monochrome chart palette and blue dark sidebar primary are structural seeds only; CNode maps those semantic roles to validated brand-coordinated OKLCH values.

## Public Shell Browser Audit

The migrated public shell was audited in light and dark mode at 375px, 768px, 1280px, and 1440px. Time-dependent animation was disabled before capture.

| Viewport | Result                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 375px    | Header, mobile navigation Sheet, CommandPalette, main and footer visible; Sheet occupies the viewport width and respects the bottom edge |
| 768px    | Desktop navigation replaces the mobile trigger; CommandPalette remains within the viewport                                               |
| 1280px   | Header, content measure, CommandPalette and footer remain bounded                                                                        |
| 1440px   | Content keeps its maximum measure and does not stretch to the viewport edge                                                              |

Every audited pair reported `documentElement.scrollWidth === clientWidth`. CommandPalette focused its search input after opening and closed with Escape. The 375px navigation Sheet opened and closed with Escape. No browser console errors remained after the final reload.

Evidence files follow `audit-public-shell-{375,768,1280,1440}-{light,dark}.png` in this change directory. These screenshots record the public shell audit separately from the deterministic eight-archetype suite below.

## Repeatable Playwright MCP Evidence

The final visual evidence was generated against `http://localhost:5173` with Playwright MCP only. No local Playwright dependency, browser test configuration, seed, migration, or data mutation was added.

The capture protocol is:

1. Keep the API and Web development servers on the documented local origins and use the same read-only route records for every run.
2. Install the browser clock at `2026-08-02T12:00:00Z` before navigation.
3. Set `localStorage.theme` to the versioned `light` or `dark` value before reload.
4. Set the viewport to 375, 768, 1280, or 1440 pixels and use a stable 900/1000 pixel viewport height.
5. Disable animations, transitions, and caret painting before capture; screenshot the full page after the route finishes loading.
6. Record document width, visible primary actions, headings, accessible names, focus behavior, and console output alongside the image.

Existing topic `47408` is the fixed long-content reading fixture. The latest reading recapture confirmed three semantic heading IDs (`创建数据库`, `编写接口`, `描述后台界面`), matching TOC targets, no duplicate IDs, and `scrollWidth === innerWidth` at the sampled mobile and desktop endpoints.

## Archetype Matrix

Each matrix cell is stored as `acceptance-{archetype}-{viewport}-{theme}.png` for all four viewports and both themes.

| Archetype | Representative route | Design reason                                                                  | Result |
| --------- | -------------------- | ------------------------------------------------------------------------------ | ------ |
| feed      | `/`                  | Samples public header, filters, topic Items, rail and pagination               | Pass   |
| reading   | `/topic/47408`       | Samples long Markdown, code, images, TOC, context and replies                  | Pass   |
| compose   | `/topic/create`      | Samples Field composition, editor mode switching, Turnstile and action footer  | Pass   |
| account   | `/signin`            | Samples constrained account measure, autocomplete fields and helper navigation | Pass   |
| directory | `/users/top100`      | Samples responsive identity Items and directory density                        | Pass   |
| dashboard | `/admin`             | Samples authenticated Sidebar shell and real summary/list content              | Pass   |
| data-list | `/admin/topics`      | Samples dense filters, explicit table scrolling, status and actions            | Pass   |
| workflow  | `/admin/reports`     | Samples queue summary and vertically readable actionable records               | Pass   |

The baseline update is intentional: primitives now match Base Nova, brand color is supplied by semantic tokens, routes share named application shells, and Markdown uses one Typeset preset. The screenshots must not be bulk-accepted for unrelated spacing, color, or hierarchy changes.

## State Evidence

| State                    | Evidence                                                                           | Check                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| default and long content | archetype matrix                                                                   | Shell, content rhythm, responsive density and bounded measure            |
| focus                    | `acceptance-state-focus.png`                                                       | 3px semantic focus ring and focused Command input                        |
| selected and disabled    | `acceptance-state-selected-disabled-375.png`                                       | State remains distinguishable without raw brand classes                  |
| pending                  | `acceptance-state-pending-375.png`                                                 | Pending control remains named and unavailable for repeat submission      |
| error                    | `acceptance-state-error-375.png`                                                   | Alert/Field error composition remains readable on mobile                 |
| empty                    | `acceptance-state-empty-375.png`                                                   | Empty composition retains title, description and recovery action         |
| overlay                  | `acceptance-state-admin-sidebar-375.png`, `acceptance-state-admin-command-375.png` | Sheet/Dialog remain within safe-area and return final focus after Escape |

## Overflow And Accessibility Audit

- Public and admin shells were sampled at all four standard viewports. No document-level horizontal overflow remained.
- `/admin/topics` measured 375/375, 768/768, 1280/1280 and 1440/1440 for document/viewport width. Its comparison table scrolls only inside the declared table container; key status and actions remain reachable there.
- Markdown tables and code scroll only inside `.typeset-scroll` or their code container. The reading fixture does not expand the viewport.
- Representative pages retain one `h1`, named navigation landmarks, named visible buttons, reachable primary actions, and keyboard-visible focus.
- The mobile admin Sheet is named `后台导航`, respects safe-area insets, closes with Escape, and returns focus to `切换后台导航`.
- CommandPalette focuses `搜索命令` on open, closes with Escape, and returns focus to its opener after the closing animation.

## Smoke And Residual Risks

The real-browser smoke covered the route matrix above in light/dark themes and all standard viewports. Authentication was exercised with the existing local admin session; no credentials or session material were written to the repository.

The only recurring console failure is Cloudflare Turnstile challenge traffic returning HTTP 400 on localhost. It is external challenge verification behavior in the local environment, not a React, hydration, route, API contract, or layout failure. Turnstile-dependent submission itself was not exercised because the acceptance run is read-only. Visual evidence can still vary if the selected local records are changed outside this audit; route IDs and the fixed browser clock must therefore remain part of future comparisons.

## Corrective Visual Review

The first matrix pass was insufficient because it treated no document overflow and primitive conformance as visual acceptance. A subsequent route-by-route review corrected the following composition failures:

- Public entry/explanatory pages use the marketing PageHeader; compact task pages use breadcrumb plus the same brand surface at a smaller scale.
- Home tabs now live inside the feed Card. The track fills the Card content width while naturally sized tabs remain left aligned.
- About uses one navigable community-manual structure instead of repeated PageHeaders and unrelated Card grids.
- Job NativeSelect controls fill their grid columns; Footer primary/secondary actions retain contrast on the brand surface.
- Settings notification checkboxes use horizontal Field orientation instead of inheriting full-width direct-child rules.
- Admin restores the established full-width top bar and contained navigation Card. The navigation Card and complete PageHeader share one top baseline without a compensating left-column label row.
- Audit long target IDs and details wrap or scroll inside their own content; ItemGroup and every Item report `scrollWidth === clientWidth` at 375px and 1440px.
- Topic title remains in its reading Card. Its Separator spans the padded content width with 16px insets, and metadata is split into author/time on the left and icon-only reply/view/collection counts on the right.
- Reply cards use standard CardHeader/CardContent spacing. Author/floor/time are grouped left, actions right on desktop and stacked on mobile; body content no longer uses a manual avatar spacer.

The corrective browser checks sampled 375px and 1440px directly and confirmed no document overflow. The home 375px tabs track measured 311px with the first naturally sized trigger starting 3px from the left edge. Settings horizontal Fields measured 19px high rather than the previous 250px failure. Audit had zero oversized Items at both sampled endpoints.
