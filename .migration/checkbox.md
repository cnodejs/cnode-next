# checkbox

2026-08-02, engine strategy for legacy `new-york`; migrated to Base UI and mapped checked state attributes.

## Changed

`apps/web/app/components/ui/checkbox.tsx`: replaced Radix Root and Indicator with `@base-ui/react/checkbox`; mapped `data-state=checked` styles to `data-checked` and disabled styles to `data-disabled`. Existing controlled consumers and FormControl composition remain source-compatible. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for this component.

## Left alone

No consumer currently uses an indeterminate state, so no synthetic compatibility mapping was added.

## Behavior changes

The visible control is now Base UI's span-based checkbox with a hidden native input rather than Radix's button-based root. Accessible checkbox semantics and native form submission are preserved.

## Verify by hand

Toggle notification preferences and admin table selections with pointer and Space. Submit a named checkbox in a form and confirm only its checked value is included.
