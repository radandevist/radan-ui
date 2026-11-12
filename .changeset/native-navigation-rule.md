---
'@radandevist/radan-ui': patch
---

New binding rule `docs/rules/native-navigation.md`: below `md`, a page change on the mobile web is a screen change of the whole viewport (top bar included), with push / back / fade / none, on back the leaving screen animating out over the previous screen, already shown with its content (never its skeleton), the back arrow in the top bar, and an iPhone or Material 3 style by platform that the user can override. Apps linking the rules index (`docs/rules/README.md`) get it with no edit; the index now says to link it once.
