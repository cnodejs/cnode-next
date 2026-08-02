# form

2026-08-02, engine strategy for legacy `new-york`; migrated FormControl composition from Radix Slot to Base UI `useRender`.

## Changed

`apps/web/app/components/ui/form.tsx`: FormControl now merges field IDs, descriptions, and invalid state through the Base UI `render` contract. Sign-in, sign-up, and settings consumers pass their actual controls through `render`. The leftover scan `grep -n "radix-ui\|@radix-ui"` is clean for the wrapper and migrated consumers.

## Left alone

React Hook Form remains the form-state owner. Checkbox itself remains Radix until task 1.4, but FormControl already composes it without Slot.

## Behavior changes

None. Existing IDs, label associations, `aria-describedby`, and `aria-invalid` values are applied to the actual form control.

## Verify by hand

Submit invalid sign-in and sign-up forms, inspect the focused field and its accessible description, then edit settings inputs and checkboxes to confirm labels and validation remain connected.
