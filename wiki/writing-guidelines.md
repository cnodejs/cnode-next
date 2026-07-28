# Wiki Writing Guidelines

Every wiki page must make sources and uncertainty visible. Do not expand historical or business context without support.

## Required Sections

Use these sections for new wiki pages:

```markdown
# Page Title

## Sources

- Source name or path, with date if relevant.

## Scope

What this page covers and what it does not cover.

## Facts

- Verified statements directly supported by sources.

## Inferences

- Reasoned conclusions based on facts. Explain why they follow.

## To Confirm

- Unknowns, missing sources, or statements needing maintainer review.

## Review Status

- Draft, reviewed, or stale.
```

## Rules

- Cite repository paths, OpenSpec files, runbooks, or external sources for factual claims.
- Separate facts from inferences.
- Mark missing source material as `To Confirm` instead of filling gaps.
- Do not turn AI guesses into facts.
- Do not add community history, production details, user data, database names, hostnames, tokens, or secret values unless they are already safe public facts and relevant.
- Keep pages concise and update the review status when facts change.
