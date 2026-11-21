---
'@radandevist/radan-ui': minor
---

New: the TanStack Router adapter for the page transitions, `@radandevist/radan-ui/page-transition-tanstack-router` (web only; `@tanstack/react-router` is an optional peer, `>=1.170.45 <1.171.0`, tested on the exact 1.170.45), and the phone top bar block, `@radandevist/radan-ui/phone-top-bar`. ShopKartOS's behaviour, ported as it is.

- **`createPageTransitions(options)`** returns `{ routerOptions, install(router), health() }`. Spread `routerOptions` into `createRouter` (`defaultViewTransition`, `defaultPendingMs: 0`, `defaultPendingMinMs: 300`: they travel together) and call `install(router)` after it (browser only, idempotent per router, returns what undoes it). It gives one view transition per navigation (the skeleton's swap is the navigation's transition), the skeleton from the click below `md`, and the rule that a deferred skeleton is never painted once its page committed or a newer navigation took over. State is per router, not module-level. Options: `isTopLevel`, `screenParams` (search params that make one pathname several phone screens), `overlay`.
- **`health()`** (also on `window.__radanUiPageTransitions`): `earlyOffer` is `untested | ok | no-pending-component | shape-mismatch`. The early skeleton reads the router's private load transaction in one file, with runtime shape checks; an unexpected shape turns it off, reports `shape-mismatch` and warns once in development. A contract test runs against the real pinned router.
- **`shownPath` / `useShownPath`, `useGoBack(fallback)`, `usePageTitle(title)`**: the page on screen (never the navigation's target), the back arrow's handler, the title a page publishes to the bar.
- **`PhoneTopBar`** (`.Menu`, `.Back`, `.Title`, `.Actions`, `.Action`, `.Skeleton`, plus `PageTitleProvider`): ShopKartOS's phone header class for class (a parity test compares its DOM with the reference). Define `--header-title-width`. `react-dom` becomes an optional peer (the portalled action slot).

Migration: none for existing imports. To adopt, replace a hand-written adapter (see the README) with `createPageTransitions`.
