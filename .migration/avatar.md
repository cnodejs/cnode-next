# avatar

2026-08-02, engine strategy for legacy `new-york`; migrated the unchanged anatomy to Base UI.

## Changed

`apps/web/app/components/ui/avatar.tsx`: replaced Radix Root, Image, and Fallback with `@base-ui/react/avatar` while retaining all CNode classes and public wrapper names. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for this component.

## Left alone

Avatar consumers and image URL helpers required no API changes. Their profile and identity rendering remains domain-owned.

## Behavior changes

None. Image loading and fallback rendering retain the same observable behavior.

## Verify by hand

Open the header user menu, a topic author card, and a profile with both valid and missing avatar URLs. Confirm images fill the circle and initials appear after failures.
