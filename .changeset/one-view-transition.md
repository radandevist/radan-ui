---
'@radandevist/radan-ui': patch
---

Fix: one view transition per navigation when the early skeleton is already shown. With a slow root `beforeLoad`, the 80 ms early offer starts the navigation's transition; the router's own pending offer, arriving while that transition's update callback is still deferred, started a second `document.startViewTransition` for the same navigation. It is now a plain update, like the commit. Covered by the real-router contract test with a deferred callback; the stale-offer, immediate-skeleton, exit-before-back-page, load-guard and online/visibility rules are unchanged.
