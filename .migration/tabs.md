# tabs

2026-08-02, engine strategy for legacy `new-york`; migrated to Base UI while explicitly retaining automatic activation.

## Changed

`apps/web/app/components/ui/tabs.tsx`: replaced Radix Trigger and Content with Base UI Tab and Panel, mapped active styles to `data-active`, and set `TabsList.activateOnFocus` to `true` by default. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for this component.

## Left alone

Existing admin tab consumers required no prop changes and retain their route/local state ownership.

## Behavior changes

None by design. Base UI defaults to manual activation, but this wrapper explicitly enables `activateOnFocus` to preserve Radix's existing arrow-key automatic activation.

## Verify by hand

Focus the first tab in admin settings and bans, press Left/Right, and confirm focus, selected state, and visible panel move together. Click each tab and verify the active styling.
