# Forms in a drawer, never a modal (HARD)

Every create/edit form opens in a right drawer from `md` and a bottom sheet below `md`, with its action footer stuck
to the bottom — modals are only for confirmations.

- **The surface is the form panel** (`<FormPanel open onClose title busy footer>`): a right drawer from `md` (title,
  close, cancel + submit in the footer), a bottom sheet below `md` (no visible ✕, 44px fields, stacked actions).
- **The fields scroll, the footer stays stuck** to the bottom; a submit button reaches the form through `form={id}`
  (the submit lives outside the `<form>` element's scroll area).
- **Nothing closes while `busy`**: the panel dims what it opens over, and ignores close/backdrop/Escape until the
  mutation settles.
- **Modals are for confirmations only** (delete, cancel, reset, discard-changes…) — a short message and two buttons.
  The image lightbox is a dialog too: a viewer, not a form.
- **A new modal must be a confirmation like these; anything with fields is the form panel.**
- Field errors render inline next to their field, exhaustively; a handled validation response never also fires a
  duplicate toast.

Related: [mobile-native.md](./mobile-native.md), [composition.md](./composition.md).
