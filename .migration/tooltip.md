# tooltip

2026-08-02, engine strategy for legacy `new-york`; migrated to Base UI Tooltip while preserving CNode styling.

## Changed

`apps/web/app/components/ui/tooltip.tsx`: replaced Radix Tooltip with `@base-ui/react/tooltip`, rebuilt content as Portal > Positioner > Popup, forwarded alignment and offset props, and mapped lifecycle styling to Base UI starting/ending attributes. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for this component.

## Left alone

No application Tooltip consumers currently exist, so no call sites required migration.

## Behavior changes

The provider uses Base UI's `delay` contract and the root uses `disableHoverablePopup`; there were no consumers of the former Radix-only names.

## Verify by hand

Add or open a Tooltip example, focus and hover its trigger, confirm delayed display, Escape dismissal, readable positioning on each side, and focus retention on the trigger.
