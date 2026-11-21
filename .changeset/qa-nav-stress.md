---
'@radandevist/radan-ui': minor
---

New: the QA tools, `@radandevist/radan-ui/qa` (Node only, never imported by web code). ShopKartOS's `nav-stress`, reusable, and the transition walk that makes a "no behaviour change" refactor provable. How to wire them in an app: `docs/guides/nav-stress.md`.

- **`runNavStress(config)`**: fast taps (router navigate and history Back), every loader delayed, CPU 4x, then asserts what a resting app must never show: a visible skeleton, a router `idle` with a `pending` match, view-transition marks left on `<html>`, a live view transition. Config: `baseUrl`, `launch`, `login`, `routes`, `delayedRequests`, and a few knobs (`seeds`, `rounds`, `ignoreSelector`, `ua`, `taps`, `delayMs`, `screenshotDir`). Returns the runs (`stuck` rounds with a screenshot, the adapter's `earlyOffer` state); an app script maps them to exit 0 (clean) or 1 (stuck).
- **`QaSetupError`** (exit class 2: the run could not be made, never a green run): thrown when the page exposes no `window.__TSR_ROUTER__`, or when the page transitions adapter reports `shape-mismatch` on `window.__radanUiPageTransitions`.
- **`runTransitionWalk(config)`**: per scripted navigation (the app's `steps`), the `startViewTransition` count, direction and style, over Android/iOS user agent x Navigation API present/removed x loader delay 0/600 ms. Run it twice on the old build (identical), then on the new one (byte-identical).
- **`restingProblems(page, { ignoreSelector })`**: the invariants alone.

`playwright-core` (`>=1.60`) is an **optional peer**, imported as types only: the app passes `launch: () => chromium.launch()`. No new runtime dependency.

The catalog gets a real-router demo (`router-demo.html`: TanStack Router, the adapter, the load guard, the phone top bar); radan-ui's CI runs a short fixed smoke and the walk on every PR, the full run nightly and on adapter/core PRs.

Migration: none (new subpath).
