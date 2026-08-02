# sheet

2026-08-02, engine strategy for legacy `new-york`; migrated the Dialog-derived Sheet to Base UI.

## Changed

`apps/web/app/components/ui/sheet.tsx`: rebuilt Sheet with Base UI Portal, Backdrop, Viewport, and Popup while preserving side variants and public names. Added `100dvh`, internal scrolling, overscroll containment, safe-area padding, Base open/closed state selectors, and Popup `finalFocus` forwarding. `apps/web/app/components/JobFilterBar.tsx` and `apps/web/app/components/Layout.tsx` now use Trigger `render`; `JobMetaCard` supplies an explicit final-focus target. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for Sheet files.

## Left alone

Route-owned mobile navigation links and job filtering state were not redesigned. Their existing actions and URLs remain unchanged.

## Behavior changes

Sheet content now scrolls within a Base UI modal viewport with background scroll locking and safe-area spacing. Existing side placement and close controls remain available.

## Verify by hand

At 375px width, open public navigation and job filters, scroll to the final item, confirm the page behind does not move, close with button and Escape, and verify focus returns to the trigger.
