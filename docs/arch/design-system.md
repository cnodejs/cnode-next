# Web Design System

The Web app uses shadcn `base-nova` on Base UI as its primitive baseline. Repository-owned primitives live in `apps/web/app/components/ui/`; CNode branding is expressed through semantic theme roles rather than a second component style.

## Ownership

- Primitives own structure, standard variants, states, density, radius, and accessibility behavior.
- Application blocks own reusable CNode composition.
- Routes own data and page-specific layout, not primitive appearance.
- `apps/web/app/styles/global.css` owns semantic theme values.

Consumers use standard component props and limit classes to layout and responsive behavior. Brand roles are reserved for the logo and genuine marketing surfaces; routes must not introduce raw CNode palette utilities or parallel shadow, radius, and color systems.

## Page Model

| Archetype | Typical content |
| --- | --- |
| feed | filters, feed, optional rail, pagination |
| reading | topic content, context, replies |
| compose | editor or structured form and actions |
| account | identity and settings forms |
| directory | people or resource records |
| dashboard | summaries and recent records |
| data-list | filters, comparison records, pagination |
| workflow | moderation and other actionable queues |

Same-archetype routes share width, header hierarchy, spacing, and responsive composition. Tables are for real column comparison; task records use responsive Item composition.

## Responsive And Markdown Principles

Navigation, titles, primary actions, forms, overlays, and content remain reachable from narrow mobile to wide desktop in light and dark themes. Keep one behavior tree across breakpoints; horizontal scrolling is limited to explicit tables and code.

User Markdown renders through the shared `MarkdownView` and Typeset preset so topics, replies, and editor preview use one safe presentation boundary.

Detailed Agent execution and verification rules live in the project `cnode-web-design` Skill. Sources: `apps/web/components.json`, `apps/web/app/components/ui/`, `apps/web/app/components/PageShell.tsx`, and `apps/web/app/styles/`.
