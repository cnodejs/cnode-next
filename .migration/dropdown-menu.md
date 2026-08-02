# dropdown-menu

2026-08-02, engine strategy for legacy `new-york`; migrated all menu wrappers and consumers to Base UI Menu.

## Changed

`apps/web/app/components/ui/dropdown-menu.tsx`: replaced Radix DropdownMenu with Base UI Menu, rebuilt popup positioning with Portal > Positioner > Popup, migrated submenu, group labels, indicators and state attributes, and added `DropdownMenuLinkItem`. `apps/web/app/components/Layout.tsx`, `apps/web/app/routes/user.$name.tsx`, and `apps/web/app/routes/admin/users.tsx` now use `render`, LinkItem and `onClick`. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for all migrated files.

## Left alone

Menu-owned role and governance actions retain their existing API calls and confirmation dialogs. Sonner remains an intentional non-Radix feedback dependency.

## Behavior changes

Base UI Menu is configured with `loopFocus={false}` and explicit `closeOnClick` for links, checkbox items and radio items to preserve observed Radix behavior.

## Verify by hand

Open the header and user-management menus by pointer and keyboard. Navigate with arrows, activate links and actions with Enter/Space, confirm disabled items do nothing, submenu focus moves correctly, and focus returns to the trigger after close.
