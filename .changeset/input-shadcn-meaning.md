---
'@radandevist/radan-ui': minor
---

**Breaking**: the `input` semantic token now has the common shadcn/Tailwind meaning, the field outline/fill (`#e4e4e7` light, `#27272a` dark), so `border-input` and `bg-input/50` behave like shadcn. The pale outline is the deliberate default (no 3:1 raise). The old field text colour (`#414141` light, `#808697` dark) moves to the new bridged token `input-foreground`. `--radan-ui-input-border` still works: it is now a component token pointing at `input`. Owner decision, issue #17.

Migration:

- `text-input` -> `text-input-foreground`
- `border-input` used as the dark outline -> `border-input-foreground`
- `border-[color:var(--radan-ui-input-border)]` -> `border-input` (the old variable still works; keep the arbitrary value if you override `--radan-ui-input-border`)
