# Shared mobile page-transition system — design (phase 1 of the shared app blocks)

Status: DRAFT for owner review, 2026-11-21. Tracks [radan-ui#80](https://github.com/radandevist/radan-ui/issues/80).
Docs only: no product code in this branch. The companion lessons draft is [`../rules/navigation.md`](../rules/navigation.md).

Sources read for this spec (all read-only):

- ShopKartOS `origin/main` at `3c9e53d` (TanStack Start 1.169.3, `@tanstack/react-router` **1.170.45** exact, router-core 1.171.38): `lib/page-transitions.ts`,
  `pending-swap.ts`, `swap-offer.ts`, `view-transition-guard.ts`, `load-guard.ts`, `motion-duration.ts`, `page-back.ts`, `use-sheet-drag.ts`,
  `use-edge-swipe.ts`, `router.tsx`, `routes/__root.tsx`, `components/{app-shell,page-title}`, `styles/{page-transitions,motion}.css`,
  `scripts/{nav-stress,layout-check*}.ts`, `docs/guides/{nav-stress,layout-check,motion,verification}.md`, and the tests that guard them
  (`page-transitions`, `pending-swap`, `load-guard`, `topbar`, `motion-single-source`, `no-page-level-animation`).
  PRs [#241](https://github.com/radandevist/shopkart-os/pull/241), [#303](https://github.com/radandevist/shopkart-os/pull/303),
  [#306](https://github.com/radandevist/shopkart-os/pull/306), [#311](https://github.com/radandevist/shopkart-os/pull/311),
  [#315](https://github.com/radandevist/shopkart-os/pull/315), [#320](https://github.com/radandevist/shopkart-os/pull/320),
  [#321](https://github.com/radandevist/shopkart-os/pull/321).
- PublyApp `apps/front` (develop at read time; TanStack Start 1.169.4, react-router **1.170.46**, router-core 1.171.39, radan-ui **0.8.0**): `router.tsx`,
  `routes/__root.tsx`, `routes/authed/layout.tsx`, `components/app-shell/app-shell.tsx`, `lib/navigation/*`, `package.json`.
- radan-ui `origin/main` at `621f6cf` (0.13.0): `CONTRIBUTING.md`, `docs/DESIGN.md`, `docs/rules/*`, `package.json` exports, `tsdown.config.ts`,
  `scripts/components.ts`, `tests/components.test.ts`, and the **already shipped** `src/components/page-transition/` (see §1).
- The two installed routers' sources (`router-core` `router.js`, `load-client.d.ts`, react-router `Transitioner.js`), compared line by line for every
  private thing this spec relies on (§7).

Nothing here was run on a device. Claims about browsers come from reading the router source and the PRs' own measurements; the ones that need a
real check are marked **verify**.

---

## 1. The finding that changes the plan

**radan-ui already ships a page-transition module** (`@radandevist/radan-ui/page-transition`, [#52](https://github.com/radandevist/radan-ui/pull/52), 0.7.0): router-agnostic
core (`directionOf`, `beginPageTransition`, style storage, view-transition guard), the CSS, `PageBack` + `goBack` + tap guard, a README adapter snippet,
a binding rule ([`native-navigation.md`](../rules/native-navigation.md)), a catalog page and tests. It is a snapshot of ShopKartOS **as of 12/11**.
ShopKartOS never adopted it (it still runs its own copy and imports only `Button` from radan-ui); PublyApp is on 0.8.0 (the module is in it) and uses only
`theme.css`.

So phase 1 is **not an extraction**. It is a *catch-up merge* in both directions:

| | ShopKartOS today (21/11) | radan-ui 0.13 |
| --- | --- | --- |
| Screens by search param (`?section=`), [#303](https://github.com/radandevist/shopkart-os/pull/303) | yes (`SCREEN_PARAMS`, hard-coded) | no |
| iOS: section switch instant; Material: fade-through (90 + 210 ms, scale 0.92), [#311](https://github.com/radandevist/shopkart-os/pull/311) | yes | no (one 150 ms cross-fade, both styles) |
| `html[data-motion]` + pre-paint `MOTION_SCRIPT` + cross-tab follow, #311 | yes | no |
| One transition per navigation, skeleton swap inside the transition, [#315](https://github.com/radandevist/shopkart-os/pull/315) / [#321](https://github.com/radandevist/shopkart-os/pull/321) | yes (`pending-swap.ts`) | no |
| Stale deferred swap ignored, [#320](https://github.com/radandevist/shopkart-os/pull/320); load guard | yes | no |
| Skeleton from the click (`defaultPendingMs: 0`, early offer), #321 | yes | no |
| `shownPath` (header follows the page on screen), #315 | yes | no |
| TanStack adapter | yes, in-app, entangled with the above | README snippet only |
| **Marks hardened** (`appStarted` TTL + browser confirmation, `clearMarks`, async `goBack` with rollback, `beginPageTransition` as one call) | **no** (the older flags: a `back()` that never traverses leaves its mark armed) | **yes** |
| `isTopLevel` injectable | no (path segments ≤ 1, hard-coded) | yes |
| `PageBack` component + skeleton | local `BackLink` | yes |
| `ready`/`skipTransition`/`types` on the fallback transition object | no | yes |
| Listens `navigate` only when the Navigation API exists (no double count with popstate) | popstate always + `navigate` | yes |

**Consequence:** the starting point is radan-ui's core (better hardened, router-free), onto which the ShopKartOS-only behaviours are ported, with their
tests. "Copy ShopKartOS as it is" would *regress* the marks and re-introduce hard-coded app decisions. The owner asked to be corrected where the premise is
wrong: this is the first correction; §11 lists the rest.

## 2. Goals, non-goals, anti-goals

### Goals

1. One shared module gives every app below `md`: the per-device style (`auto | ios | material | none`), the direction logic, the CSS, the pre-paint
   `data-motion`, the back arrow — **identical behaviour** to ShopKartOS as of 21/11, except where §11 says it was wrong.
2. A TanStack Router adapter that carries the router-bound parts: one transition per navigation, the skeleton inside that transition, the skeleton from the
   click, the stale-offer rule, `shownPath`.
3. A never-infinite-skeleton guarantee that is **stated, bounded and tested** (§6).
4. The private router internals live in one file, are version-bounded, fail safe **and loudly in dev**, and are covered by a contract test against the real
   pinned router (§7).
5. `nav-stress` (and, second, `layout-check`) reusable by both apps, with the invariants defined once (§9).
6. PublyApp can adopt it from day one: its constraints (CSP nonce, no server functions, per-request router, custom "top-level" notion, client-only layout)
   are first-class options, proven by a PublyApp-shaped fixture in radan-ui's own tests (§13).
7. The lessons of the last two weeks are written down as a binding rule with enforcement, not as folklore ([`navigation.md`](../rules/navigation.md)).

### Non-goals (phase 1)

- Drawer / bottom-sheet / dialog / speed-dial components and their motion tokens (`--duration-drawer-*`, `--surface-ease-*`, …): they move with those blocks
  (§6.2 classifies every token).
- The app shell (top bar, rail, side panel), the error pages (404/403/500, the `ErrorCard` with « Réessayer »), empty states: the next blocks in the owner's
  order. The load guard only throws `load_timeout`; presenting it is the error block's job.
- The page-title slot (`PageTitleContext`, `usePageTitle`, `shownPageTitle`): app-shell block. Phase 1 ships `shownPath` / `useShownPath`, which is the
  rule's mechanism.
- Other routers (Next, React Router). The core is router-free so they can come later; no adapter is promised.
- React Native: native uses the platform stack navigator (unchanged, `web-only.json` entry stays).
- Browser Back animation on iOS (Safari's own edge-swipe): unchanged rule, the app adds no second one.

### Anti-goals (what would make this wrong)

- A framework: no config file, no plugin system, no codegen. Two functions and two components.
- Hiding the router's privates behind a "stable" facade that silently stops working. A broken internal must be **visible** (dev warning, `health()`).
- A global monkey patch the app cannot undo (`window.fetch`), or module-level singletons that two routers (tests, HMR) would share.
- Per-app decisions baked into the library: which params are screens, what is top level, which URL is a loader, what the overlay is.

---

## 3. Inventory: where every ShopKartOS piece goes

| ShopKartOS file (lines) | Destination | Notes |
| --- | --- | --- |
| `lib/page-transitions.ts` (263) — style storage, `platformStyle`, `appliedStyle`, `transitionFor`, `directionOf`, marks, `installPageTransitions` | **core** `page-transition` | merged onto radan-ui's hardened core; `Place.screen` and the iOS-fade rule added |
| same — `applyMotion`, `applyStoredMotion`, `MOTION_SCRIPT`, storage/matchMedia listeners | **core** | script derived from a function, not hand-duplicated (§8) |
| same — `placeOf`, `screenOf`, `SCREEN_PARAMS`, `pageViewTransition`, `swapState`, `swappedFor`, `decide` | **adapter** | `SCREEN_PARAMS` and `notifications === 1` become options |
| `lib/view-transition-guard.ts` (46) | **core** (already there as `guardViewTransitions`) | keep radan-ui's version (complete `ViewTransition` fallback object) |
| `lib/pending-swap.ts` (136) — `animatePendingSwap`, `earlyOffer`, `offerFromClick` | **adapter** | the ONE file reading `_tx`/`stores`; per-router state, not module state |
| `lib/swap-offer.ts` (15) — `staleOffer` | **adapter** | pure, only public `router.state` |
| `lib/load-guard.ts` (129) | **`load-guard`** (own subpath) | not transition-specific; PublyApp has no server functions (§5.4) |
| `lib/page-back.ts` — `goBack`, `createTapGuard` | **core** (already there) | SK's is the older, weaker copy: replaced |
| `components/page-title.ts` — `shownPath` | **adapter** | `usePageTitle`/`PageTitleContext` stay app-side until the shell block |
| `lib/motion-duration.ts` — `motionMs` | **stays** in the app, moves with Drawer/Sheet | generic, but nothing in phase 1 reads it |
| `styles/page-transitions.css` (115) | **`page-transition.css`** | byte-for-byte keyframes; fade rules replaced (§6.1) |
| `styles/motion.css` — `html[data-motion]` token blocks, the `none` 1 ms rule, `motion-*` utilities | **mostly stays** (§6.2) | only the page-transition part moves now |
| `scripts/nav-stress.ts` (164) | **`qa`** (§9) | generic loop + invariants move; server/seed/login stay |
| `scripts/layout-check*.ts` (~700) | **`qa`**, second PR | probe + runner generic; routes/seed/server stay |
| `tests/{page-transitions,pending-swap,load-guard,topbar(shownPath),motion-single-source}.test.ts` | **move first**, become the acceptance suite | ported unchanged where they test behaviour (§13) |
| `tests/no-page-level-animation.test.ts` | stays in the app now; candidate `house` lint rule later | (§13) |

---

## 4. Packages and repo conventions

radan-ui conventions that bind this design: one folder per `src/components/<name>/`, entry `<name>.web.tsx` → `dist/web/<name>.js` through the single
`./*` export pattern; files under 300 lines; no router in the library per `CONTRIBUTING.md` ("The library has no i18n, no router and no data fetching") —
**this spec deliberately amends that sentence for the adapter only** (the router is an *optional peer*, imported by one entry; the core and every other
entry stay router-free, enforced by a guard, §13).

### 4.1 New and changed subpaths

| Subpath | Status | Contents | Router import? |
| --- | --- | --- | --- |
| `@radandevist/radan-ui/page-transition` | **exists**, extended | core: style, direction, marks, guard, `data-motion`, `MotionScript`, `PageBack`, `goBack` | never |
| `@radandevist/radan-ui/page-transition.css` | **exists**, changed | the animations + page tokens | n/a |
| `@radandevist/radan-ui/page-transition-tanstack-router` | **new** | `createPageTransitions`, `shownPath`, `useShownPath`, `useGoBack` | `@tanstack/react-router` (optional peer) |
| `@radandevist/radan-ui/load-guard` | **new** | `watchLoad`, `withLoadTimeout`, `installLoadGuard`, `isServerFnGet`, constants | never |
| `@radandevist/radan-ui/qa` | **new**, Node-only | `runNavStress`, `restingProblems` (+ `runLayoutCheck`, `probe` in a second PR) | never (Playwright only as *types*) |

Why the flat name `page-transition-tanstack-router` and not the brief's `page-transitions/tanstack-router`: `./page-transition` has shipped since 0.7.0
(renaming it is a major for nothing), and `scripts/components.ts` + the single `./*` pattern only know flat folder names. A nested path would need a new
export-map convention and a new tsdown entry rule; a flat sibling folder needs neither. (Open question Q1.)

### 4.2 Guard changes (shared files: owner approval, as `CONTRIBUTING.md` requires)

- `src/components/headless.json` (new, same shape as `web-only.json`): folders that export no component (`page-transition-tanstack-router`, `load-guard`).
  `tests/components.test.ts` then requires only the web entry + a test for them (no contract/variants/skeleton/catalog page) — the `isBone` exception
  generalised instead of a second special case. `entryFile` accepts `.web.ts` as well as `.web.tsx` for them.
- `tests/components.test.ts`: a new guard — **no file under `page-transition/` or `load-guard/` imports `@tanstack/*`**; only `page-transition-tanstack-router/`
  may.
- `tsdown.config.ts`: add `src/qa/index.ts` as an entry of the Node-side config (next to `src/index.ts`); `package.json` `exports`: `"./qa"` explicit.
- `package.json`: `@tanstack/react-router` as an optional peer (§7.4) + exact dev dependency; `playwright-core` optional peer (types only).
- `.size-limit.json`: budgets for `dist/web/page-transition.js` (core, ≤ 5 kB), `dist/web/page-transition-tanstack-router.js` (≤ 5 kB),
  `dist/web/load-guard.js` (≤ 2 kB) — measured after the first build, set 10 % above.
- `scripts/build-theme.ts` already copies `page-transition.css`; unchanged.

### 4.3 Versioning

The shipped 0.x API changes are **breaking** (§5.1 lists them). Per `CONTRIBUTING.md` semver (0.x: breaking = minor, said so in the notes, with a migration
snippet and before/after captures from the catalog) this is **one minor** carrying: the core catch-up (R1), then the adapter (R2) as a second minor. No
deprecation window: the only known consumer is ShopKartOS's own copy, and nobody imports the 0.7–0.13 module (checked: SK imports only `Button`; PublyApp
only `theme.css`).

---

## 5. Public API (exact)

All code is `strict` TypeScript; names below are the contract. Anything not listed is internal.

### 5.1 Core — `@radandevist/radan-ui/page-transition`

Kept as shipped: `TRANSITION_STYLES`, `DEFAULT_STYLE`, `STORAGE_KEY` (`radan-ui:page-transition`, **unchanged** so a stored choice survives the migration),
`readStyle`, `platformStyle`, `appliedStyle`, `writeStyle`, `subscribeStyle`, `isIOS`, `skipsTraversal`, `transitionFor`, `guardViewTransitions`,
`beginPageTransition`, `markAppTraversal`, `markBackToParent`, `clearBackToParent`, `clearMarks`, `goBack`, `createTapGuard`, `PageBack`, and the types.

Changed (**breaking, one minor**):

```ts
export type Place = { path: string; index: number | undefined; overlay: boolean; screen?: string }; // + screen
// An opaque label for "same pathname, another phone screen" (the adapter builds it from the declared params).
export type TopLevel = (place: Pick<Place, 'path' | 'screen'>) => boolean;                           // was (path: string)
export const defaultIsTopLevel: TopLevel;                  // path has <= 1 segment AND no screen
export const directionOf: (from: Place | undefined, to: Place, via?: Via, isTopLevel?: TopLevel) => Direction | undefined;
export const beginPageTransition: (from: Place | undefined, to: Place, isTopLevel?: TopLevel) => Direction | undefined; // unchanged shape
export const writeStyle: (style: TransitionStyle, storage?: Pick<Storage, 'getItem' | 'setItem'>) => void;           // now also applyMotion(style)
export const installPageTransitions: () => void;           // now also: applyStoredMotion, 'storage' + reduced-motion listeners
```

Behaviour changes inside `directionOf` / `transitionFor`, each with the ported test:

1. Same path **and same `screen`** → overlay rule (open = push, close = back), else none (#303). `via.toParent` stays checked first (radan-ui's order).
2. A different `screen` on the same path is a screen change (index → section push, section → index back, section → section push, in-place replace none).
3. `transitionFor('fade', env)` is `undefined` when `env.style === 'ios'` (iPhone tab switches are instant, #311); Material keeps it.

New:

```ts
export const applyMotion: (style?: TransitionStyle, nav?: Nav) => void;  // <html data-motion> = reduced ? 'none' : appliedStyle(style ?? readStyle())
export const applyStoredMotion: () => void;                              // applyMotion(readStyle())
export const MOTION_SCRIPT: string;                                      // inline, pre-paint (§8)
export const MotionScript: (props: { nonce?: string }) => JSX.Element;   // <script nonce dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
export const useStoredMotion: () => void;                                // useLayoutEffect(applyStoredMotion, []): the document swap empties <html>'s attributes
export const supportsViewTransitionTypes: () => boolean;                 // CSS.supports('selector(:active-view-transition-type(a))')
```

`data-motion` contract (public, documented in `DESIGN.md` §8): `html[data-motion]` ∈ `ios | material | none` — `auto` resolved by platform, reduced motion
resolved to `none` — and it is the **only** source any shared or app surface may read to decide how it moves. radan-ui owns the attribute; nobody else
writes it.

### 5.2 Adapter — `@radandevist/radan-ui/page-transition-tanstack-router`

```ts
import type { AnyRouter } from '@tanstack/react-router';
import type { Place, TopLevel } from '@radandevist/radan-ui/page-transition';

export type PageTransitionsOptions = {
	/** What a top-level screen is (a menu section). Default: the core's `defaultIsTopLevel`. */
	isTopLevel?: TopLevel;
	/** Search params that make one pathname several phone screens, e.g. `['section']`. Default `[]`. */
	screenParams?: readonly string[];
	/** Whether this search has a full-screen overlay open (the notification sheet). Default: never. */
	overlay?: (search: Record<string, unknown>) => boolean;
	/** The desktop layout, where nothing animates and the router's usual skeleton wait applies. Default `'(min-width: 48rem)'`. */
	desktopQuery?: string;
	/** Skeleton timing. `fromClickMs` 80 (below the desktop query), `desktopDelayMs` 150 (from it, counted from the navigation's start). */
	skeleton?: { fromClickMs?: number; desktopDelayMs?: number };
};

export type PageTransitions = {
	/** Spread into `createRouter`: `{ defaultViewTransition, defaultPendingMs: 0, defaultPendingMinMs: 300 }` (these three travel together, §6.3). */
	routerOptions: { defaultViewTransition: { types: (info: { fromLocation?: unknown; toLocation: unknown }) => string[] | false } | undefined; defaultPendingMs: 0; defaultPendingMinMs: number };
	/** After `createRouter`. Browser only (a no-op on the server). Idempotent per router. Returns what undoes it (HMR, tests). */
	install: (router: AnyRouter) => () => void;
	/** The state of the private-internals contract (§7): `ok`, or why the early skeleton is unavailable. Also warned once in dev. */
	health: () => { earlyOffer: 'ok' | 'unavailable'; reason?: string };
};
export const createPageTransitions: (options?: PageTransitionsOptions) => PageTransitions;

/** The path of the page the router renders right now (never `state.location`, which already holds the next page's path while it loads). */
export const shownPath: (state: ShownState) => string;
export const useShownPath: () => string;                          // useRouterState({ select: shownPath })
/** The back arrow's handler: `goBack` fed by `useCanGoBack`, `router.history.back`, and `navigate({ to: fallback, replace: true })`. */
export const useGoBack: (fallback: ToOptions['to']) => () => Promise<void>;
```

`defaultViewTransition` is `undefined` when the browser lacks view-transition *types* (§7.3): the router would otherwise start a default UA cross-fade
with no attributes set. `install` does, in order: the core's `installPageTransitions()`; the pending swap (one-transition rule + stale-offer rule); the
early skeleton; a dev-only check that `router.options.defaultPendingMs === 0` (warn loudly otherwise: that option is half of the contract).

Wiring, the whole of it (this replaces ~140 lines of ShopKartOS `router.tsx` and `pending-swap.ts` glue):

```ts
const pageTransitions = createPageTransitions({ screenParams: ['section'], overlay: (s) => s.notifications === 1 });
export const getRouter = () => {
	const router = createRouter({ routeTree, ...pageTransitions.routerOptions /* , … */ });
	pageTransitions.install(router);
	return router;
};
```

### 5.3 Core component wiring in the document

```tsx
<html suppressHydrationWarning>        {/* the script writes data-motion before hydration */}
	<head><MotionScript nonce={cspNonce} />…</head>
```

and `useStoredMotion()` once in the root component (re-applies after the root error page replaces the document, #311).

### 5.4 Load guard — `@radandevist/radan-ui/load-guard`

```ts
export const PENDING_LIMIT_MS = 15_000;
export const FETCH_LIMIT_MS = 20_000;
export const LOAD_TIMEOUT = 'load_timeout';               // the Error message the app maps to its error screen
export const NO_LOAD_TIMEOUT = 'x-no-load-timeout';       // header: a GET that is an action (CSV export) opts out
export type Guarded = { state: { status: string; matches: readonly { status: string }[] }; invalidate: () => Promise<void> };

export const watchLoad: (router: Guarded, options?: { pendingLimitMs?: number; pollMs?: number; onStuck?: () => void; now?: () => number }) => () => void;
export const withLoadTimeout: (inner: typeof fetch, options?: { limitMs?: number; isLoaderCall?: (input: RequestInfo | URL, init?: RequestInit) => boolean }) => typeof fetch;
export const isServerFnGet: (input: RequestInfo | URL, init?: RequestInit) => boolean;   // TanStack Start: GET to /_serverFn/, no opt-out header — the default isLoaderCall
export const installLoadGuard: (router: Guarded, options?: Parameters<typeof watchLoad>[1]) => () => void;   // = watchLoad; browser only
```

Differences from ShopKartOS (each a §11 item): no `window.fetch` patch (the app passes `withLoadTimeout(fetch)` to
`createStart({ serverFns: { fetch } })`, a documented Start seam), no `import.meta.hot` in library code (the app does
`import.meta.hot?.dispose(uninstall)`), `isLoaderCall` injectable, and the `onStuck` escalation (§6.4).

### 5.5 What apps import (summary, ten lines)

`createPageTransitions` · `PageTransitions.routerOptions` · `.install(router)` · `MotionScript` · `useStoredMotion` · `shownPath` / `useShownPath` ·
`PageBack` + `useGoBack` · `readStyle` / `writeStyle` / `subscribeStyle` / `TRANSITION_STYLES` (the settings screen, labels app-side) ·
`watchLoad` + `withLoadTimeout` · `runNavStress`.

---

## 6. Behaviour

### 6.1 Direction table and CSS

`native-navigation.md` stays the source for the table. Amendments (from ShopKartOS, #311): **a top-level → top-level change is a fade on Material and
nothing on iOS**; the Material fade is the M3 fade-through, not the 150 ms cross-fade. `page-transition.css` becomes ShopKartOS's `page-transitions.css`
verbatim (iOS push/back 350 ms `cubic-bezier(0.32, 0.72, 0, 1)`; Material shared-axis X 300 ms with 90/210 ms fades; Material fade-through 90 ms out,
210 ms in with `scale 0.92 → 1`), minus nothing, plus the token layer below. No media query inside it: reduced motion, `md+`, style `none` and a missing API
never start a transition, so there is nothing to switch off in CSS.

Page tokens (new, defined inside `page-transition.css` on `:root`, so the file stays self-contained as `build-theme.ts` documents; fixed `--radan-ui-`
prefix because a static file cannot follow `generateThemeCss({ prefix })`):

```
--radan-ui-page-ios-duration: 350ms;          --radan-ui-page-ios-ease: cubic-bezier(0.32, 0.72, 0, 1);
--radan-ui-page-material-duration: 300ms;     --radan-ui-page-material-ease-in: cubic-bezier(0.05, 0.7, 0.1, 1);
--radan-ui-page-material-ease-out: cubic-bezier(0.3, 0, 0.8, 0.15);
--radan-ui-page-fade-out: 90ms;               --radan-ui-page-fade-in: 210ms;
```

Pixel-identity is a hard requirement of the ShopKartOS migration: the defaults equal today's literals, and a one-off comparison of the normalised CSS
(comments and whitespace stripped, literals substituted) is part of that PR's evidence (§12.1).

### 6.2 Motion tokens: what moves now

ShopKartOS `motion.css` carries four kinds of thing. Phase 1 moves only the first.

| Kind | Examples | Phase 1 |
| --- | --- | --- |
| Page transition | the durations/curves in `page-transitions.css` | **moves** (tokens above) |
| The `data-motion` mechanism | attribute, script, resolution (auto→platform, reduced→none), cross-tab follow | **moves** (core §5.1) |
| Surface tokens per style | `--duration-drawer-*`, `--duration-sheet-*`, `--duration-nav-*`, `--duration-snap`, `--duration-dial-*`, `--level-*`, `--surface-ease-*` | **stay in SK**: no radan-ui component reads them; they move with Drawer/Sheet/SpeedDial, renamed once then. The *names of the three values and the rule "read `html[data-motion]` only"* are documented now so that rename is the only change later. |
| App rules | the global `html[data-motion='none'] *` 1 ms rule with its class-name exemptions (`animate-spin`, `motion-rise`, `navigation-progress`, `pending-reveal`…), `motion-rise/pop/fade` utilities, collapse/estimation/loading motion | **stay in SK**: the exemption list is ShopKartOS vocabulary (§11.9) |

`none` means **1 ms, not 0** wherever something waits for `transitionend` (`<Collapse>`'s close, #311): documented in `navigation.md`, enforced by the
test that moves with the surface tokens.

### 6.3 One transition per navigation, skeleton from the click

The router offers a slow page's skeleton outside any view transition and only after the root `beforeLoad` and `pendingMs`. Hence the three behaviours the
adapter owns, **as shipped in ShopKartOS and kept** (timings are product decisions, measured on a real phone in #321):

1. **The swap is the navigation's transition** (#315): the skeleton's `startTransition` is wrapped in `router.startViewTransition`, flagged so `types` runs
   once for that navigation; the commit that follows, for the *same location object*, is a plain update (`swappedFor`). A navigation with
   `viewTransition: false` never has its flag spent by the swap.
2. **One decision per navigation** (#321): a skeleton waiting its turn is dropped if a commit's `startTransition` **or** a commit's view transition has
   started — the second one would lose the flags the first consumed and play the wrong animation. Counter, checked before *and inside* the browser's deferred
   callback.
3. **Skeleton from the click below `md`** (#321): `defaultPendingMs: 0` (the router offers the skeleton as soon as the page's load starts), the swap waits
   one task (a cached page commits within it and shows none) — and `fromClickMs` (80 ms) after the click an *early offer* is built from the router's loading
   transaction when the root `beforeLoad` is slow. From `md`: no transition carries it, so 150 ms **from the navigation's start** (not from when the
   router asks).

State is **per router instance** (a closure created by `install`), not module-level as today.

### 6.4 The never-infinite-skeleton guarantee (stated, bounded, tested)

Nets, in the order a stuck page meets them:

| # | Net | Fires when | Result | Tested by |
| --- | --- | --- | --- | --- |
| 1 | Stale-offer rule (`staleOffer` + commit counter) | the browser runs the deferred swap callback after the page committed / after a newer navigation | the snapshot is never applied | pending-swap tests (3, ported), nav-stress |
| 2 | `watchLoad` | router `pending` ≥ 15 s, or router `idle` with a `pending` match (the corrupt state #320 produced); rechecked on tab visible / network back | one soft `invalidate()` | load-guard tests (ported), nav-stress |
| 3 | `withLoadTimeout` | a loader's GET gets no answer in 20 s | `Error('load_timeout')` → the page's error component | load-guard tests (ported) |
| 4 | **`onStuck` (new)** | still `pending` another `pendingLimitMs` after net 2's revalidation | app callback; recommended: reload once, guarded by a `sessionStorage` flag so it can never loop | new test |

**The guarantee, precisely:** *a page never rests on its skeleton for more than `PENDING_LIMIT_MS × 2` plus one poll, **for every load the router
considers a loader of that page**; and never at all past the router going idle.* Net 3 covers only what `isLoaderCall` matches (ShopKartOS: TanStack Start
GET server functions). A loader that hangs on anything else is covered by nets 2 and 4 only. Today (ShopKartOS) net 2 revalidates **once** and then
stays silent: a loader that hangs again leaves the skeleton for good. Net 4 closes that; it is new behaviour and goes in a separate PR after the parity
migration (§12.1) so the before/after `nav-stress` stays clean.

### 6.5 Everything is browser-only (SSR)

`install` is a no-op where `document` is undefined; `routerOptions.defaultViewTransition.types` returns `false` on the server (the router already skips
transitions server-side — kept as belt and braces); `MotionScript` renders on the server and sets `data-motion` before first paint; with no attribute yet
the CSS falls back to the neutral values, so the pre-script frame is never wrong, only un-styled. `getRouter` is per-request on PublyApp: `createPageTransitions()`
is created once at module level (cheap and stateless until `install`), `install` runs only on the client.

---

## 7. The router's private internals

### 7.1 Inventory — everything the adapter touches that is not documented API

Checked identical in the two installed routers (`router-core` 1.171.38 and 1.171.39: `router.js` lines 75, 102, 387–434, 491–510 and `load-client.d.ts`
`LoadTransaction`).

| # | What | Used by | Why it is needed | Declared in the `.d.ts`? | Fallback if the shape differs |
| --- | --- | --- | --- | --- | --- |
| 1 | `router._tx[3]` — the loading matches, a **positional tuple** `[controller, redirects, location, matches, startedAt, done, refresh?]` | `earlyOffer` | build the next page's skeleton before the root `beforeLoad` answers | yes (`_tx?: LoadTransaction`, labelled tuple) | no early offer; router's own offer after the root `beforeLoad` |
| 2 | `router.stores.{matches,status}.get()`, `stores.setMatches()` | `earlyOffer` | read the shown matches, show the offer | yes (`stores: RouterStores`) | same |
| 3 | `router.startTransition` reassigned by React's `Transitioner` on every render (`Transitioner.js:16`) → we install an **accessor** | swap | wrap the skeleton's render in a view transition | field is public; the reassign-every-render behaviour is not | no swap: skeleton appears outside a transition (the #314 look) |
| 4 | `router.startViewTransition` overridden | swap | count commits' transitions (rule 6.3-2) | public field | rule 2 lost: wrong animation possible on fast taps |
| 5 | `router.shouldViewTransition === false` read, and consumed by the router after one `startViewTransition` | swap | respect `navigate({ viewTransition: false })`; `invalidate()` sets it `false` too | public field | swap ignores the flag |
| 6 | `defaultViewTransition.types` is called **only if** `CSS.supports('selector(:active-view-transition-type(a))')`, and then **before** each transition (`router.js:496–500`) | `types` | our decision point | documented option, undocumented condition | see §7.3 |
| 7 | `location.state.__TSR_index` | `placeOf` | history position → direction | history state key, used by the router's own `useCanGoBack` | no direction (no transition) |
| 8 | `router.subscribe('onBeforeLoad', { pathChanged })`, `router.state.{status,matches,location.href}`, `router.invalidate()`, `routesById[…].options.pendingComponent`, `options.defaultPendingComponent` | skeleton, guard | | documented | — |
| 9 | `window.__TSR_ROUTER__` | `nav-stress` only | drive navigations from outside | set at `router.js:641` client-side | the tool exits 2 (fails loudly) |

Items 1–5 are the risk surface. Everything in rows 1–2 sits in **one file**, `page-transition-tanstack-router/internals.ts` (`earlyOffer` and nothing
else); rows 3–5 in `swap.ts`. No other file in the package reads `_`-prefixed or positional router state.

### 7.2 Isolation and testing against the exact version

1. **Typed access, no `any`**: `internals.ts` reads `router._tx` through `AnyRouter` so a reordered tuple or renamed field is a **compile error** after a
   bump; one extra compile-time assertion pins index 3 to `Array<AnyRouteMatch>`.
2. **Runtime shape check** before each use (array, expected length, `status`/`routeId` present); on mismatch → `undefined` (never throws) **and** a one-time
   `console.warn` in development with the router version, and `health().earlyOffer === 'unavailable'` with the reason. ShopKartOS today fails *silently*: a degraded
   experience nobody is told about (§11.5).
3. **Contract test against the real router** (the part ShopKartOS lacks — its swap tests use a hand-made fake router, so an upgrade that changes internals
   passes them): `page-transition-tanstack-router.contract.test.tsx` builds a real `createRouter` with `createMemoryHistory`, a route with a slow loader and
   a `pendingComponent`, installs the adapter, navigates, and asserts: the early offer is produced and shown; a cached page shows **no** skeleton (the
   "one task" assumption of §6.3-3); one `startViewTransition` per navigation; `navigate({ viewTransition: false })` stays unspent; a stale deferred swap
   is ignored. It runs in `pnpm test`, hence in CI on every PR **and** on Renovate's TanStack bumps — which matters because `renovate.json` automerges
   minor/patch **dev** dependencies when CI is green: the contract test is what makes that safe.
4. **Exact dev pin**: `@tanstack/react-router` pinned exact in `package.json` (as ShopKartOS does since [#321](https://github.com/radandevist/shopkart-os/pull/321)); bumping it
   is a deliberate PR whose diff is the contract test's result.
5. **A Renovate group** `tanstack` (react-router, router-core, start, history) so they move together.

### 7.3 A gap in today's ShopKartOS code: browsers without view-transition types (verify)

`router.js:496–506`: when `CSS.supports('selector(:active-view-transition-type(a))')` is false (Chrome 111–124, Safari 18.0–18.1, per the spec's
`types` support), the router skips our `types` callback **but still calls `document.startViewTransition(fn)`** because `defaultViewTransition` is set. The
UA's default 250 ms cross-fade then plays on **every** navigation — including from `md`, with style `none` and with reduced motion — and the pending
marks (`traversal`, `appStarted`…) are never consumed. ShopKartOS gates `supported` on `'startViewTransition' in document` only. The adapter returns
`defaultViewTransition: undefined` when `supportsViewTransitionTypes()` is false, so those browsers navigate instantly, which matches the documented "no
animation rather than a broken one" degradation. **verify** on a real old Chrome / iOS 18.0 (the catalog + `nav-stress` with a stubbed `CSS.supports` is
the cheap proxy; the real device settles it).

### 7.4 Peer-dependency ranges

| Package | Peer range | Optional | Why |
| --- | --- | --- | --- |
| `react` | `>=19` (as today) | yes | unchanged |
| `@tanstack/react-router` | `>=1.170.45 <1.171.0` | **yes** (only `page-transition-tanstack-router` needs it) | the tested window: ShopKartOS 1.170.45, PublyApp 1.170.46. react-router depends on an **exact** router-core (1.170.45→1.171.38, 1.170.46→1.171.39), so its patch range is the proxy for router-core's; widening the upper bound is a PR that re-runs the contract test and `nav-stress`. |
| `playwright-core` | `>=1.60` | yes | `qa` only, **types only** (`import type`); the app passes `launch` |
| `@tanstack/react-start` | none | — | the guard takes a `fetch`, it does not import Start |

Both apps pin everything exact (PublyApp's `assert-pinned` preinstall guard enforces it), so the range is documentation + a warning for a third app, not a
resolution constraint.

---

## 8. The pre-paint script, CSP and hydration

- **One source of truth.** `MOTION_SCRIPT` today is a hand-copied minified duplicate of `appliedStyle` (the theme script next to it is correctly derived
  with `fn.toString()`). The shared version is `(${resolveMotion.toString()})(KEY)` from a **self-contained** function (no module references, as `THEME_SCRIPT`
  does), and a test evaluates the **built `dist` script** in jsdom across a user-agent × stored-value × reduced-motion matrix and compares it with
  `appliedStyle`. (A minifier can break `toString()` only if it injects helpers: the test runs on the build output, so it would fail.)
- **CSP.** PublyApp mints a per-request nonce and every inline script carries it (`csp.spec.ts` guards it). `MotionScript` takes `nonce`; an inline script
  without it is blocked and `data-motion` would never be set (silent, as the CSS neutral fallback hides it). Acceptance test: render `MotionScript` with a
  nonce, assert the attribute on the `<script>`.
- **Hydration.** The script writes `data-motion` before React hydrates: `<html suppressHydrationWarning>` is required (both apps already have it for the
  theme). A document swap (root error page replacing the app) empties `<html>`'s attributes: `useStoredMotion()` re-applies it in a layout effect.
- **Cross-tab:** `installPageTransitions` re-applies on the `storage` event and on the reduced-motion media change.

---

## 9. `nav-stress` and `layout-check` as reusable tools

### 9.1 Decision

**A programmatic API in a Node-only subpath, `@radandevist/radan-ui/qa`; the app keeps a ~25-line script that calls it. Not a package bin, not a docs
recipe.**

- *Not a docs recipe*: a recipe is copy-paste, and copies drift — the exact failure radan-ui exists to prevent. The value of these tools is the
  **invariants** (what a resting app must never show; which layout defects are defects). Those must be one versioned definition both apps run.
- *Not a bin (yet)*: 70 % of each script is app-specific and **cannot** be configured away without a config-file loader: starting a throwaway server,
  seeding a database, logging in per role, listing routes (with seeded detail ids), the URL pattern to delay (`**/_serverFn/**` is a TanStack Start
  server-function URL; PublyApp's API is not). A bin needs a config format, a TypeScript loader and an error model for all of that. A function taking
  `launch`, `login`, `routes` has none of it, is trivially typed, and a bin can wrap it later without breaking anything.
- *No Playwright dependency*: the app passes `launch: () => chromium.launch(...)`; the library imports Playwright **types only**.

### 9.2 `runNavStress` (phase 1)

```ts
import type { Browser, Page } from 'playwright-core';
export type NavStressConfig = {
	baseUrl: string;
	launch: () => Promise<Browser>;
	login: (page: Page) => Promise<void>;
	routes: readonly string[];                         // top-level pages + one detail page of each kind (the app seeds the ids)
	delayedRequests: string | RegExp;                  // routes to hold back, e.g. '**/_serverFn/**'
	width?: number;                                    // 390 (touch + mobile emulation below 600)
	rounds?: number; seeds?: readonly number[];        // 25; [1, 2, 3] — a seed replays the same taps
	cpu?: number; delayMs?: 'rand' | number;           // 4; 'rand' = 0–900 ms
	ua?: 'android' | 'ios'; gapMs?: number; restMs?: number;   // 'android'; 40; 4000
	busySelector?: string; ignoreSelector?: string;    // '[aria-busy="true"]:not(a)'; e.g. '[data-restore-skeleton]'
	cdpUrl?: string;                                   // drive a real Android Chrome (as layout-check --cdp does)
	screenshotDir?: string;
};
export type NavStressRun = { seed: number; rounds: number; stuck: { round: number; problems: string[]; shot: string }[] };
export const runNavStress: (config: NavStressConfig) => Promise<NavStressRun[]>;
export const restingProblems: (page: Page, options?: Pick<NavStressConfig, 'busySelector' | 'ignoreSelector'>) => Promise<string[]>;
```

Invariants, unchanged from ShopKartOS (`restingProblems`): visible busy region outside the ignore selector; router `idle` with a `pending` match;
`data-page-direction` / `data-page-transition` left on `<html>`; `document.activeViewTransition` alive. **Self-checks kept and extended:** fail with exit
class 2 (the *run* could not be made) when `window.__TSR_ROUTER__` is missing ([#320](https://github.com/radandevist/shopkart-os/pull/320) review: a stress test that taps nothing passes
for nothing) **and** when the adapter's `health()` reports `unavailable` at the start of the run (a canary for §7: the early offer silently not working
is a failure of the tool's premise). The app script maps results to exit 0 / 1 / 2.

### 9.3 `layout-check` (second PR, same entry)

`probe(input)` (the serialised in-page function: `covered`, `clearance`, `h-scroll`, `outside`, `bar-moved`) and a runner over viewports × themes × scroll
phases. App-specific today and to be parameterised: `document.querySelector('header')` as the bar, `main` as the scroller, the `[data-restore-skeleton]`
exclusion, `MIN_GAP = 8`. They become `selectors: { bar, scroller, ignore }`, `minGap`. Routes, roles, seed and server stay in the app. It ships **after**
`nav-stress` because it is independent of transitions (it guards the 1 px overflow that aborts view transitions, #241, but is not part of the system) and
because PublyApp's bar (`.app-shell-topbar`, breadcrumbs) needs the selector contract proven first.

### 9.4 radan-ui's own end-to-end run

The catalog gets a tiny real TanStack Router app (three routes with delayed loaders and pending components) and CI runs `runNavStress` against it, so the
tool and the adapter are tested **in radan-ui, with the real router, not only through the apps**. Adds `@tanstack/react-router` as a catalog devDependency
(catalog is private, outside the published package). Runs in the existing `visual` job's Chromium.

---

## 10. What stays app-side

- The route tables and **which params are screens** (`screenParams`), **what is top level** (`isTopLevel`), **what the overlay is** (`overlay`).
  PublyApp is the proof the default is not enough: its top-level pages are `/staff/dashboard`, `/staff/tenants`, … (two segments), so a segment count is wrong
  there; it will derive `isTopLevel` from its `route-metadata` rail items.
- Translations, the settings screen that calls `writeStyle`, the labels.
- The shell: top bar, `usePageTitle`/`PageTitleContext`, `Page`, the menu, `PullToRefresh`.
- The loader transport: ShopKartOS uses server functions; PublyApp a typed API client. `isLoaderCall` and where the timeout is wired are the app's.
- The error screen that renders `load_timeout`, and « Réessayer ».
- Surface (drawer/sheet) motion and the global `none` rule (§6.2).
- Server, seed and login for `nav-stress` / `layout-check`.

---

## 11. What in ShopKartOS should NOT be copied as it is

The owner asked to be corrected where "ShopKartOS as it is today" is the wrong reference. In decreasing weight:

1. **The marks (older copy).** `pending.appStarted` is armed by `markAppTraversal()` and cleared only by the next `take()`; a `history.back()` that produces
   no traversal leaves it armed, and a later Safari edge-swipe traversal then reads as app-started (double animation). radan-ui's version (TTL 1.5 s
   unconfirmed / 15 s confirmed, `clearMarks`, `goBack` rolling back on failure) is the one to keep. Likewise SK's `goBack` is synchronous and leaks `toParent`
   on a failed `navigate`.
2. **App decisions hard-coded in the module.** `SCREEN_PARAMS = ['section']`, the `notifications === 1` overlay, `isTopLevel` = ≤ 1 path segment. → options.
3. **Module-level singletons**: `pending`, `swapState`, `swappedFor`, `commits`, `navStartedAt`, `installed`. Two routers (tests, HMR, a second app on the page)
   share them. → per-router closure; only the browser-event marks stay document-wide (one document, one history), with a test reset.
4. **No `types`-support gate** (§7.3): default UA cross-fade on browsers without view-transition types.
5. **Silent failure of the early offer** (`earlyOffer` returns `undefined` with no trace). A bump that breaks the tuple silently degrades UX and nothing
   tells anyone. → dev warning + `health()` + a contract test on the real router.
6. **`installLoadGuard` patches `window.fetch` globally and puts `import.meta.hot` in library code.** Another wrapper (analytics, MSW, an error tracker)
   composes by accident in whichever order; Vite's HMR API is not a library's to call. → Start's `createStart({ serverFns: { fetch } })` seam (**verify**:
   the URL still matches `/_serverFn/` inside a `CustomFetch`; note the documented precedence — a call-site or middleware `fetch` overrides it, while the
   `x-no-load-timeout` header opt-out still works through headers).
7. **The load guard stops after one revalidation.** A loader that hangs twice leaves the skeleton forever. → `onStuck` (§6.4). The 20 s timeout also only
   covers `/_serverFn/` GETs; a non-Start app gets **no** net 3 unless it injects `isLoaderCall` (PublyApp must).
8. **`MOTION_SCRIPT` hand-duplicates `appliedStyle`** (§8).
9. **The global `none` 1 ms rule and its exemption list** are ShopKartOS vocabulary (`pending-reveal`, `navigation-progress`, `motion-rise`…) and apply to `*`.
   Putting it in a shared stylesheet would restyle PublyApp's Base UI surfaces behind its back. Stays app-side; the shared module only sets the attribute.
10. **`48rem` written four times** (`MD` in `pending-swap.ts`, `browserEnvironment`, the CSS `@media`, Tailwind `md`). → one `desktopQuery` option, documented to
    equal the app's `md`.
11. **The early-offer timer is not cancelled or keyed to its navigation**: each click schedules a timer that reads the *newest* load transaction, so under
    taps faster than 80 ms the newest navigation can be offered a skeleton earlier than 80 ms after *its own* start (a cached page could flash). Low impact;
    key the timer to the navigation in the port.
12. **The direction is computed from the router's `resolvedLocation`** (what last committed), not from the page on screen: under chained fast navigations the
    two differ. `nav-stress` checks the resting state only, never the direction. Not changed in this phase; a known gap, listed under risks.
13. **`nav-stress` specifics**: the delayed-request pattern, the Android UA default and the router-`navigate`/`goBack` taps only (no tap on the real arrow or
    menu) are SK-shaped; the shared version exposes the first two and adds the real arrow as a tap target in a later iteration.
14. **Not wrong, but a product decision the rule document disagrees with:** iOS top-level switches are instant, Material fades through (#311).
    `native-navigation.md` today says "fade, both styles, 150 ms". It is amended (§14); say so if that decision was not meant to be shared with PublyApp.

---

## 12. Migration

### 12.1 ShopKartOS — pixel- and behaviour-identical

Order matters: **tests move first, then code**.

0. **Baseline** (before any change), on `main` at the pinned SHA: `pnpm build && pnpm check:nav-stress` (390 px, seeds 1,2,3 × 25, CPU 4×, Android UA) **and**
   `--ua ios`, plus `pnpm check:layout`; filmstrips (a frame every 100 ms, 390 px) of push, back, fade for ios / material / none and of the
   skeleton-from-click case — the same capture method as [#315](https://github.com/radandevist/shopkart-os/pull/315)/[#321](https://github.com/radandevist/shopkart-os/pull/321). Store the outputs with the PR.
1. **radan-ui R1 (core catch-up)**: port `page-transitions.test.ts` (screens, iOS fade, `data-motion`, storage) and `motion-single-source`'s CSS/`applyMotion`
   parts **first**, red against the 0.13 core; then make them green. Replace the fade CSS; add the token layer. Evidence: normalised-CSS comparison with SK's file.
2. **R2 (adapter + swap + early offer + `shownPath`)**: port `pending-swap.test.ts` (all 17) and the `shownPath` part of `topbar.test.ts` unchanged, then add the
   real-router contract test (§7.2-3).
3. **R3 (`load-guard`)** with the ported `load-guard.test.ts` (10) **plus** the new `onStuck` and `isLoaderCall` tests — but `onStuck` defaults to *off* so ShopKartOS stays
   identical in the parity PR.
4. **R4 (`qa`: `runNavStress`)** + catalog route + CI run; ShopKartOS's script becomes a call.
5. **ShopKartOS S1 — one PR, "refactor, no visible change"**: bump radan-ui (exact pin), delete `lib/{page-transitions,pending-swap,swap-offer,view-transition-guard,load-guard}.ts`
   and `styles/page-transitions.css`, import the shared ones, `router.tsx` → §5.2 wiring, `__root.tsx` → `MotionScript`/`useStoredMotion`, `shownPath` from the adapter,
   `BackLink` onto `PageBack`/`useGoBack`, `nav-stress` → `runNavStress`. The ported tests now live in radan-ui; SK keeps thin integration tests (router wiring, the
   app guards `no-page-level-animation` and the surface parts of `motion-single-source`).
   **Gate:** nav-stress before/after equal (0 stuck, both UAs), layout-check unchanged, filmstrips frame-by-frame compared, then **the real phone** (§13).
6. **S2 (separate PR, behaviour change, announced): the robustness items of §11** that change behaviour: `createStart` fetch seam, `onStuck`, types-support gate.
   Its own nav-stress before/after.

### 12.2 PublyApp — what it needs (read from its current setup)

State today: no view transitions, no `data-motion`, no `pendingComponent` below the layout, `defaultPendingMs` at the router default, radan-ui **0.8.0**
(only `theme.css` imported), per-request `getRouter` with a CSP nonce, `ssr: false` on `_authed-layout`, a desktop-first shell (rail + secondary panel;
below `md` a menu button and **breadcrumbs**, no per-screen title, no back arrow), router `1.170.46`, everything pinned exact.

| # | Need | Detail |
| --- | --- | --- |
| P0 | **radan-ui bump 0.8.0 → the release** | A prerequisite, separate PR. Blast radius is the **tokens** it consumes (0.9–0.13 changed field/card tokens and added `card-body-radius`; the breaking Input/skeleton/Card changes affect components PublyApp does not import). Run its design guards and visual diff. |
| P1 | `isTopLevel` from route metadata | top-level pages are two segments (`/staff/dashboard`); the default is wrong for it. Source: the rail items of `lib/navigation/route-metadata`. |
| P2 | `<MotionScript nonce>` in `RootDocument` next to the theme script | CSP: inline scripts need the per-request nonce (`router.options.ssr?.nonce`). `csp.spec.ts` must stay green. `useStoredMotion()` in the root. |
| P3 | `createPageTransitions()` in `router.tsx` | module-level instance; `install` is client-only so the per-request server router is untouched. `defaultPendingMs: 0` arrives with `routerOptions` — check the layout-level `AuthedRoutePendingSkeleton` does not flash for cached routes. |
| P4 | `pendingComponent` on leaf routes | Only the layout route has one. Without leaf `pendingComponent`s the early skeleton finds nothing to offer (`health()` says why) — the transitions still work. Staged: transitions first, skeletons per route family later. |
| P5 | `isLoaderCall` for its API client | PublyApp has no `/_serverFn/` GETs: net 3 does nothing by default. Either its API client takes `withLoadTimeout`, or it relies on nets 2 and 4 plus its own query timeouts. |
| P6 | A mobile top bar with **title + `PageBack`** | The rule is "a screen is the whole viewport, top bar included; every screen below the top level owns its bar". PublyApp's breadcrumb bar does not match; animating it works but does not *look native*. This is the app-shell block, and is where "PublyApp must match ShopKartOS" is actually decided (Q4). |
| P7 | Preload interplay | `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0`: preloads do not start view transitions; the contract test covers `status !== 'pending'` for them. |
| P8 | `nav-stress` | needs `window.__TSR_ROUTER__` (client router: fine), its own login and a delay pattern for its API base; it already has Playwright (1.64.1) and a proofs system to hang it on. |

"From day one" is satisfied by **capability**, not by turning it on: the §13 PublyApp-shaped fixture (nonce, two-segment top level, non-server-function
loader, per-request server router, client-only layout) must pass in radan-ui before R2 is released.

---

## 13. Test strategy

| Layer | What | Where / how |
| --- | --- | --- |
| Unit (ported) | direction table, screens, style/platform, marks, guard, swap (fake router), early offer, `shownPath`, load guard | `src/components/*/**.test.ts`, the ShopKartOS tests moved **unchanged first** |
| Contract (new) | the adapter on the **real pinned** `createRouter` + `createMemoryHistory`: early offer, no flash for a cached page, one view transition per navigation, `viewTransition: false` unspent, stale swap ignored, `types` support gate | `page-transition-tanstack-router.contract.test.tsx`; in `pnpm test`, so on every Renovate bump |
| PublyApp-shaped fixture (new) | nonce on the script; custom two-segment `isTopLevel`; `isLoaderCall` ≠ server function; server-side `createPageTransitions` + `install` no-op; per-request router twice in one process | same file |
| CSS conformance (new) | every style × direction has both pseudo-elements; no `@media`; tokens' defaults equal the literals; `none`/reduced never reach a keyframe | `page-transition.css.test.ts` |
| Script equivalence (new) | the built `MOTION_SCRIPT` equals `appliedStyle` over a UA × stored × reduced matrix | runs on `dist` (`tests/package.test.ts` already builds) |
| Package guards | export map, platform imports, **no `@tanstack/*` outside the adapter folder**, publint/attw, size budgets | `tests/components.test.ts`, `pnpm check` |
| End to end, fast | `runNavStress` against the catalog's real-router demo, 3 seeds × 25, Android + iOS UA | CI `visual` job |
| End to end, apps | `nav-stress` + `layout-check` on the built app before/after every migration PR | per §12 |
| Real phone | on a real Android Chrome (`--cdp` through `adb`, as `layout-check` already supports) and, when available, an iPhone: push/back/fade by arrow, by system back, by menu; slow-network skeleton; a style switch from another tab. **Mandatory** before S1 is merged and before any change to the swap or the early offer: the stuck-skeleton bug ([#320](https://github.com/radandevist/shopkart-os/pull/320)) was *proven in desktop Chromium and not yet replayed on the phone* at merge. |
| Visual | the catalog page (`page-transition.page.tsx`) gets the Material fade-through frame; baselines from CI only (`CONTRIBUTING.md`) |

---

## 14. Documents that change with this

- `docs/rules/navigation.md` (new, **draft in this branch**): the lessons, each with rule, why (bug, PR), enforcement. Added to `docs/rules/README.md` in the
  PR that activates it (the README demands the line and the file land together).
- `docs/rules/native-navigation.md`: the Fade section (iOS none / Material fade-through), the "Implementation" section (adapter subpath, `data-motion`,
  `MotionScript`), "Until it ships, enforced by review" → enforced by the tests above.
- `docs/rules/motion.md` and `DESIGN.md` §8: the `html[data-motion]` contract and "page transitions are the one exception" pointer.
- `README.md`: the adapter snippet becomes `createPageTransitions` (the ten-line hand-written adapter disappears).
- `CONTRIBUTING.md`: the "no router" sentence amended for the optional adapter.

---

## 15. Risks

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| A TanStack patch changes `_tx` / `stores` / the `Transitioner` reassign | medium / high (silent UX regression, then possibly a stuck page) | §7.2: typed access, dev warning, `health()`, contract test in CI, exact pin, Renovate group, peer window |
| Pixel/behaviour drift in the ShopKartOS migration | medium / high | tests-first port, normalised-CSS comparison, filmstrips, nav-stress before/after, real phone gate |
| Review regression: re-introducing SK's older marks by merging the wrong side | medium / medium | radan-ui's core is the base; the marks tests (`marks`, `popstate`) are kept and must stay green |
| `createStart` fetch seam does not carry the loader calls, or call-site `fetch` overrides it | low–medium / medium | **verify** in a spike before S2; header opt-out unaffected; fallback: keep the explicit `window.fetch` wrapper behind an option, undoable |
| Breaking the shipped 0.x API | low / low | no known consumer; minor + migration note per `CONTRIBUTING.md` |
| PublyApp enables transitions on a breadcrumb shell and it "looks odd" | high if enabled early / medium | Q4: enable with its mobile top bar |
| Hung loader on a non-Start app outlives nets 1–3 | medium / medium | net 4 + `isLoaderCall` injection; documented limit in §6.4 |
| Direction under chained fast navigations (resolved vs shown location) | unknown / low | not changed; **verify** with a filmstrip of A→B→C taps; candidate follow-up |
| Browsers without view-transition types | low / low | §7.3 gate; **verify** on an old device |
| The shipped spec ends up in the npm tarball (`docs/` is copied by `prepack`) | certain / negligible | same as the other specs; trivial to move |

---

## 16. Rollout summary

radan-ui: **R0** this docs branch → **R1** core catch-up → **R2** adapter → **R3** load-guard → **R4** `qa` (+ catalog real-router demo + CI run) → **R5** layout-check.
ShopKartOS: baseline → **S1** parity migration → **S2** robustness. PublyApp: **P0** radan-ui bump → **P1–P5** transitions without a skeleton change → **P6** with its
mobile top bar. Each radan-ui PR carries its changeset, its catalog captures (CI baselines) and `Closes`/`Refs #80`.

## 17. Open questions for the owner

1. **Subpath names** — keep the shipped `page-transition` and add `page-transition-tanstack-router` + `load-guard` + `qa` (flat, no new export convention), instead of the plural
   nested `page-transitions/tanstack-router`. *Recommended: yes.*
2. **Breaking the shipped 0.x module** — one minor that changes `Place`/`TopLevel`/the fade CSS/`writeStyle`, and amends `native-navigation.md` so iOS top-level
   switches are instant and Material fades through (ShopKartOS #311). *Recommended: yes — it is the reference you named, and nobody imports the old one.*
3. **Robustness changes to ShopKartOS** (`createStart` fetch seam instead of patching `window.fetch`, `onStuck` after the single revalidation, the types-support gate) — in a
   second PR (S2) **after** the pixel-identical parity PR (S1). *Recommended: yes, separate, so before/after `nav-stress` stays clean.*
4. **PublyApp "match ShopKartOS"** — transitions animate the whole viewport *including the top bar*; PublyApp's phone bar is a breadcrumb bar without title or back arrow. Enable the
   transitions in PublyApp together with its mobile top bar (the app-shell block), not before; phase 1 only guarantees it *can* (fixture) and that its radan-ui is bumped from 0.8.0.
   *Recommended: yes.*
5. **QA tools** — programmatic `@radandevist/radan-ui/qa` (apps inject `launch`/`login`/`routes`), `nav-stress` first, `layout-check` second; plus a real-router demo in the catalog
   so radan-ui's CI runs `nav-stress` itself (adds `@tanstack/react-router` to the private catalog). *Recommended: yes; a CLI bin only when a third app needs it.*
