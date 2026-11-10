---
'@radandevist/radan-ui': patch
---

Accessibility: the text/surface pairs the library actually draws now meet WCAG AA (4.5:1 text, 3:1 focus ring), pinned by an explicit pair list in `tests/contrast.test.ts` (both themes). Changed colours (ratio before -> after):

- `muted-foreground` and `sidebar-foreground`: light `#71717a` -> `#6b6b73`, dark `#7f7f7f` -> `#898989` (4.32:1 on the light card, 4.1:1 on the dark card -> above 4.5:1).
- `status-success` light `#15803d` -> `#157f3d` (4.48:1 -> 4.54:1 on the light card/popover).
- `status-warning` light `#b45309` -> `#b35309` (4.49:1 -> 4.51:1 on the light card/popover).
- `input` (field text) dark `#646a7a` -> `#808697` (3.04:1 on the card, 3.28:1 on the background -> 4.52:1 / 4.87:1).
- `accent-foreground` dark `paper` -> `ink` (1.79:1 on the cyan accent -> 9.88:1).
