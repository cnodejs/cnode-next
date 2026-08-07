---
name: cnode-web-design
description: Apply the cnode-next Web design system. Always load this skill before changing Web layouts, route composition, UI components, themes, responsive behavior, Markdown presentation, shadcn primitives, or reviewing CNode UI implementation.
---

# CNode Web Design

Preserve one component baseline and one visual language across public and admin routes.

## Baseline

- Use the pinned shadcn `base-nova` registry on Base UI.
- Treat `apps/web/components.json` and `apps/web/app/components/ui/` as the primitive baseline.
- Review one primitive at a time:

```bash
pnpm --filter @cnode/web exec shadcn add <component> --dry-run
pnpm --filter @cnode/web exec shadcn add <component> --diff
```

Inspect registry dependencies, API, ARIA, focus behavior, and callers. Never bulk overwrite primitives or reintroduce Radix compatibility.

## Primitive Ownership

Primitive source may differ from upstream only for repository aliases, React Router composition, localized accessibility labels, and tested Base UI behavior fixes. Keep domain state, route behavior, CNode colors, and project-specific variants outside primitives.

Consumers select appearance through standard props and variants. Limit consumer `className` to layout, width, overflow, anchor offset, and responsive visibility. Do not override primitive color, height, padding, radius, shadow, typography, or icon size.

## Theme

Use semantic roles from `apps/web/app/styles/global.css`: `primary`, `accent`, `secondary`, `muted`, `foreground`, `destructive`, `sidebar-*`, and `chart-*`. Reserve `brand`, `brand-foreground`, and `brand-accent` for the logo and genuine marketing surfaces.

Do not use raw CNode palette utilities, literal route color pairs, custom route shadow systems, or route-specific primitive styling. Use standard radius utilities and `gap-*`, not `space-x-*` or `space-y-*`.

## Composition

- Use shared page shells and application blocks rather than rebuilding panels per route.
- Use `Card size="sm"` for compact cards and standard Card subcomponents for actions and descriptions.
- Use Field composition for forms, with `data-invalid` and `aria-invalid` where applicable.
- Use Item for responsive records, Table for real column comparison, Badge for state, Alert for feedback, Empty for no results, and Separator for structure.
- Use shared pagination and preserve active filter parameters.

Map routes to the established archetypes: feed, reading, compose, account, directory, dashboard, data-list, or workflow. Same-archetype routes share width, header, spacing, and responsive composition.

## Responsive And Accessible Behavior

Review representative pages at 375px, 768px, 1280px, and 1440px in light and dark themes. Navigation, titles, primary actions, forms, overlays, focus, and content must remain reachable. Only explicit Table, code, and Typeset table wrappers may scroll horizontally.

Preserve one behavior tree across breakpoints. Verify keyboard interaction, labels, invalid and disabled states, final focus, empty/error/pending states, and long content.

## Markdown

Render user Markdown through `MarkdownView` with the repository Typeset preset. Keep topic content, replies, and preview consistent. Wrap wide tables and code intentionally; interactive content must opt out of Typeset.

## Validation

- Run the narrowest affected Web tests first.
- Run `pnpm --filter @cnode/web test`, `pnpm --filter @cnode/web typecheck`, and `pnpm --filter @cnode/web build` when applicable.
- Run the design-system governance test for primitive, token, spacing, radius, and consumer override changes.
- For UI audits, also load the generic `web-design-guidelines` skill; CNode-specific rules in this skill take precedence.
