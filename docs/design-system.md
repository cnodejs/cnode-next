# Web Design System

## Baseline

The Web UI uses shadcn `base-nova` with Base UI. `apps/web/components.json` and repository-owned source under `apps/web/app/components/ui/` are the primitive baseline. CNode branding is a semantic theme, not a second component style.

Use the pinned workspace CLI and review one component at a time:

```bash
pnpm --filter @cnode/web exec shadcn add <component> --dry-run
pnpm --filter @cnode/web exec shadcn add <component> --diff <file>
```

Allowed local primitive differences are limited to `~/` aliases, React Router `render` composition, localized accessibility labels, and tested Base UI behavior fixes such as final focus or safe-area containment. Do not add domain state, CNode colors, project variants, Radix compatibility, or route-specific patches.

## Semantic Theme

Routes and application blocks consume standard core, sidebar, and chart roles from `app/styles/global.css`:

- `primary`: primary action and selected emphasis.
- `accent`: hover or selected surface.
- `secondary`: secondary state and low-emphasis controls.
- `muted`: quiet surfaces and supporting content.
- `foreground` and `muted-foreground`: readable text hierarchy.
- `destructive`: dangerous actions and errors.
- `sidebar-*`: admin navigation only.
- `chart-1` through `chart-5`: distinguishable real data series only.

`brand`, `brand-foreground`, and `brand-accent` are exceptional roles for the logo and true marketing blocks. Raw `cnode-*`, `surface-*`, literal palette utilities, custom shadow tokens, and route `dark:` color pairs are prohibited.

Theme values use OKLCH. Base Nova radius is `0.625rem`; consumers use standard radius utilities rather than defining route-specific radius scales.

## Composition

- Consumers select primitive appearance through standard props and variants.
- Consumer `className` is limited to layout, width, overflow, anchor offset, and responsive visibility.
- Use `Card size="sm"` for compact cards. Do not set Card/Header/Content padding, colors, radius, or shadows.
- Use `CardAction` for header actions and `CardDescription` for supporting copy.
- Use `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` for forms. Set `data-invalid` on Field and `aria-invalid` on the control.
- Use `Item` for responsive records, Table for column comparison, Badge for status, Alert for feedback, Empty for no results, and Separator for structural division.
- Non-home lists use the shared numbered `Pagination`: previous, up to five consecutive pages, boundary pages/ellipses when needed, and next. Preserve active filter query parameters. The home feed alone may use the simple previous/next variant.
- Icons inside Button and Badge use `data-icon`; consumers do not size them.
- Use `gap-*`, never `space-x-*` or `space-y-*`.

## Page Archetypes

| Archetype | Purpose                                  | Representative routes           |
| --------- | ---------------------------------------- | ------------------------------- |
| feed      | filters, feed, optional rail, pagination | `/`, search, stars, collections |
| reading   | readable content, context, replies       | topic detail                    |
| compose   | fields, editor, action footer            | topic/reply create and edit     |
| account   | constrained identity and settings forms  | sign-in, sign-up, settings      |
| directory | responsive people/resource records       | profiles, top users, jobs       |
| dashboard | real summaries and recent records        | `/admin`                        |
| data-list | filters, comparison records, pagination  | admin users/topics/config lists |
| workflow  | queues and actionable event records      | moderation, reports, audit      |

Public entry and explanatory pages use the larger marketing `PageHeader`. Task-oriented pages use the compact variant with breadcrumbs above the title surface. Both variants share the same brand surface, title hierarchy, description treatment, radius, and action alignment; scale and surrounding context distinguish a Hero from an application header.

The home rail supplements rather than repeats the Hero. Its cooperation card links to the About cooperation policy; live sections order latest replies, leaderboard, then unanswered topics. Third-party client references belong in About with an explicit maintenance boundary, not in a hidden redirect route.

Topic reading uses a content-specific Card header instead of the application `PageHeader`: breadcrumb, title, status and an inset `Separator` stay inside the topic Card. Admin routes preserve the established full-width top bar and contained desktop navigation Card; mobile navigation uses Sheet. The desktop navigation Card and complete PageHeader share one top baseline; do not add a left-column label solely to mimic breadcrumb height. Both admin navigation surfaces consume one permission-aware model.

## Responsive Rules

Review representative pages at 375px, 768px, 1280px, and 1440px in light and dark themes. Main navigation, title, primary actions, forms, overlays, and content must remain reachable. Only explicit Table, code, and Typeset table wrappers may scroll horizontally.

Admin data that requires column comparison remains one scrollable Table. Task-oriented records use responsive Item composition. Do not maintain separate mobile and desktop behavior trees.

| Admin route                | Narrow-screen decision          | Priority                                  |
| -------------------------- | ------------------------------- | ----------------------------------------- |
| users, bans                | scrollable Table                | identity/rule, status, action             |
| topics                     | scrollable Table                | selection, title, status, metrics, action |
| tabs, zones, keywords      | scrollable inline-edit Table    | key fields and save/delete action         |
| reports, audit, moderation | responsive Item/workflow record | status, target, reason/detail, action     |
| dashboard                  | Item summaries                  | identity/title and timestamp              |
| settings                   | constrained FieldSet            | label, control, validation, save action   |

## Markdown

All rendered Markdown passes through `MarkdownView` and uses `typeset typeset-docs`. The locked upstream stylesheet is `app/styles/typeset.css`; project rhythm is defined only by `.typeset-docs` variables:

- Roboto Variable for body, heading, and mono.
- `14px` base size.
- `1.75` leading.
- `1.25em` flow.

Topic content, replies, and editor preview share this preset. Wide tables use `.typeset-scroll`; code scrolls inside its own block. Embedded interactive UI must opt out with `not-typeset` or `data-not-typeset`.

## Verification

`DesignSystemGovernance.test.ts` guards the registry baseline, primitive source, semantic route tokens, spacing, radius, and primitive visual overrides. Behavior tests cover ARIA, keyboard, invalid/disabled states, final focus, SSR, Markdown structure, and URL/mutation behavior. Browser acceptance covers the four viewports, both themes, long content, overlay, error, empty, pending, focus, and selected states.
