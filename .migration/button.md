# button

2026-08-02, engine strategy for legacy `new-york`; migrated to Base UI while preserving CNode classes and link semantics.

## Changed

`apps/web/app/components/ui/button.tsx`: replaced Radix Slot and `asChild` with `@base-ui/react/button` and its `render` contract. All Button link consumers now render one anchor without nested interactive elements. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for the wrapper and migrated Button consumers.

## Left alone

Sheet and DropdownMenu trigger/item composition remains on Radix for tasks 1.5 and 1.6. Their `asChild` sites are unrelated to Button's public API migration.

## Behavior changes

None. Rendered links retain link roles, destinations, and existing branded Button classes.

## Verify by hand

Open the header, footer, topic page, settings page, and admin lists. Tab to each Button-styled link, confirm the visible focus ring, activate it with Enter, and verify the expected destination with no nested button in the DOM.
