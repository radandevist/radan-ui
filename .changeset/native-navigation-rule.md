---
'@radandevist/radan-ui': patch
---

New binding rule `docs/rules/native-navigation.md`: below `md`, a page change on the mobile web is a screen change of the whole viewport (top bar included), with push / back / fade / none. On back the leaving screen animates out over the previous screen, already shown with its content. The back arrow sits in the top bar. The style is iPhone or Material 3 by platform, and the user can override it. Exceptions are spelled out in the rule: a deep link's fallback to a never-visited parent may show its skeleton; switching between top-level sections is a fade when the app runs the navigation; on iOS a traversal the app did not start (Safari's swipe) gets no app transition.

The rules index (`docs/rules/README.md`) now says to link it once from an app's `AGENTS.md` instead of each rule: an app that linked rule files one by one replaces those lines with the single index line, after which new rules arrive with the dependency bump.
