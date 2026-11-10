---
'@radandevist/radan-ui': patch
---

Fix the light-mode card text colour: the component knob `--radan-ui-card-foreground` shared the semantic token's name and pointed at itself (an invalid value in `:root`, so `text-card-foreground` was lost in light mode). The knob is now `--radan-ui-card-fg` (next to `--radan-ui-card-bg`); `--radan-ui-card-foreground` is the semantic token again. Not breaking: `--radan-ui-card-foreground` still exists (the semantic token) and `--radan-ui-card-fg` reads it, so an existing override of `--radan-ui-card-foreground` keeps working — and now actually applies in light mode.
