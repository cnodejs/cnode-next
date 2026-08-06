# Wiki

The wiki is the business knowledge base for CNode. It stores sourced background that is useful for maintainers but is not the main path for development tasks or production deployment.

## Pages

| Page                                               | Content                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| [writing-guidelines.md](writing-guidelines.md)     | Required wiki writing standard and template.                                  |
| [business-rules.md](business-rules.md)             | Scoring, topic/reply/collection/message rules, rate limiting, user status.    |
| [migration-background.md](migration-background.md) | Mongo-to-PostgreSQL field mapping, ID strategy, skip logic, report structure. |
| [legacy-behavior.md](legacy-behavior.md)           | Legacy behavior notes that inform compatibility decisions.                    |
| [community-rules.md](community-rules.md)           | Content moderation rules, sensitive words, scan jobs, reports, audit.         |

## Boundary

- `docs/` explains current development, architecture, API, database, moderation, and security tasks.
- `deployment/` contains the production runbook and deployment assets.
- `wiki/` preserves business knowledge, migration background, legacy behavior, and sourced context.
- AI-generated wiki updates must mark missing sources or uncertain statements as `To confirm`.
