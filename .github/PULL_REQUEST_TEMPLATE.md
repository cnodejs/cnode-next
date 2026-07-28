## Summary

<!-- What does this PR change and why? -->

## OpenSpec

- [ ] This PR implements an OpenSpec change: `<!-- change name -->`
- [ ] No OpenSpec change is needed (small doc/fix, no shipped behavior change).

## Verification

- [ ] `pnpm verify` passed.
- [ ] A subset was run instead: `<!-- commands -->` because `<!-- reason -->`.

## Impact Checklist

- [ ] App code (`apps/`, `packages/`)
- [ ] API behavior / OpenAPI contract (`apps/api/src/routes/*.ts` zod-openapi declarations, `api/openapi.json` via `pnpm gen:openapi`)
- [ ] Database schema or migration (`packages/db`)
- [ ] Deployment (`deployment/`)
- [ ] Documentation (`README.md`, `docs/`, `wiki/`)
- [ ] CI / scripts (`.github/workflows/`, `scripts/`, `package.json`)
- [ ] Secret handling: no real `.env`, tokens, cookies, private keys, database URLs, or user data committed.

## Migration / Deployment Notes

<!-- If this PR affects schema, data migration, or production deployment, describe the runbook steps. Otherwise write "None". -->
