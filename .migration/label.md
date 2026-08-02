# label

2026-08-02, engine strategy for legacy `new-york`; replaced the Radix primitive with native label semantics.

## Changed

`apps/web/app/components/ui/label.tsx`: now renders a native `<label>` while preserving all existing classes and ref/HTML prop support. `apps/web/app/components/ui/form.tsx` now types FormLabel against the native element. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for both files.

## Left alone

Route-level label text and field ownership remain in their existing forms; broader autocomplete and field audit work belongs to task 3.4.

## Behavior changes

None. `htmlFor` and click-to-focus behavior remain native and unchanged.

## Verify by hand

Open sign-in, sign-up, and settings forms. Click each visible label and confirm focus moves to the associated input, textarea, or checkbox.
