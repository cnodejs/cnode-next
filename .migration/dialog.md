# dialog

2026-08-02, engine strategy for legacy `new-york`; migrated Dialog and all controlled consumers to Base UI.

## Changed

`apps/web/app/components/ui/dialog.tsx`: replaced Radix Overlay/Content with Base UI Backdrop/Viewport/Popup, preserved CNode styling, exposed Popup `initialFocus`/`finalFocus`, and added configurable viewport positioning. Controlled consumers in public, topic, user, settings, command, and admin surfaces now return focus to their actual opener and call `eventDetails.cancel()` when a pending request denies closing. `apps/web/tests/PrimitiveMigrationBaseline.test.tsx` verifies trigger focus return and pending Escape cancellation. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for Dialog files.

## Left alone

Destructive confirmations remain general Dialogs until the dedicated AlertDialog tasks. Tooltip and DropdownMenu remain in their own migration batch.

## Behavior changes

Overlay DOM now uses Base UI's Backdrop, Viewport, and Popup. CommandPalette positioning is owned by the Viewport rather than absolute Popup offsets. Business actions, routes, and permissions are unchanged.

## Verify by hand

Open CommandPalette by button and Ctrl/Cmd+K, close with Escape, and confirm focus returns to the opener. Start a destructive request, attempt Escape/outside close while pending, then cancel after completion and verify focus restoration.
