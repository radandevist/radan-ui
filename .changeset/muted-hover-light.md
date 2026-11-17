---
'@radandevist/radan-ui': patch
---

Fix the invisible hover in light theme: `muted` is now `#e8e8e8` (was `#f7f7f7`, equal to `background`), so the hover of outline/ghost `Button` and `PageBack` shows on the page and on cards; `muted-foreground` goes to `#64646c` to keep 4.5:1 on it.
