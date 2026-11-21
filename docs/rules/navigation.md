# Navigation lessons: moving between screens without lying to the user (HARD, DRAFT)

> **Status: DRAFT v2** (2026-11-21, after independent review), written with [`../specs/2026-11-21-page-transitions-design.md`](../specs/2026-11-21-page-transitions-design.md)
> ([radan-ui#80](https://github.com/radandevist/radan-ui/issues/80)). It becomes binding, and gets its line in [`README.md`](./README.md), in the
> PR that ships the shared system. Until then the enforcement column names where each check lives **today** (ShopKartOS tests) and where it lands.

Complements [`native-navigation.md`](./native-navigation.md) (what the user sees) with **what the code must guarantee**. Every lesson below is a bug
that reached a real phone or a review; each has a rule, the reason, and the thing that fails when someone breaks it. A rule without an enforcement is a
wish: if you add a lesson, add its check in the same PR.

PR links point at the ShopKartOS repository where the bug was found and fixed.

## 1. One navigation, one transition

**Rule.** A navigation plays at most **one** view transition. The skeleton's swap and the commit that follows are the same transition; a second one is
never started while the first is in flight.

**Why.** The router draws a slow page's skeleton outside any view transition, then commits inside one: two animations, and the second consumed flags (back
arrow, swipe-back) the first had already used, so the **wrong direction** played ([#315](https://github.com/radandevist/shopkart-os/pull/315)). It came back one level down: a skeleton waiting its turn started a second transition while the commit's was
still in flight ([#321](https://github.com/radandevist/shopkart-os/pull/321)).

**Enforced by.** `pending-swap` tests "plays exactly one transition for a slow page" and "starts no second view transition while the commit one is in flight"
(ported to the adapter's tests); the contract test counts `startViewTransition` calls on the real router; `nav-stress` ("a view transition never finished").

## 2. The header follows the page on screen, never `location`

**Rule.** Anything in the shell that **names the page** (title, page name, actions, the drawer's content) reads `shownPath` / `useShownPath()` (the rendered matches), never
`useLocation()` / `state.location`. Nothing that names the page may change before the body changes with it. **Exception, deliberate:** instant click feedback — the rail's active item and
the side panels — follows the *intent* (`useLocation`): it must answer the tap at once ([#315](https://github.com/radandevist/shopkart-os/pull/315), "voulu"). The line is: feedback to a tap may lead; a *name* may not.

**Why.** `location` already holds the next page's path while it loads and the old page is still drawn. The bar announced the next title ~700 ms before its
page ([#315](https://github.com/radandevist/shopkart-os/pull/315)).

**Enforced by.** `shownPath` unit tests (old page while the successor loads; follows the matches once the skeleton is rendered; 404 falls back to the
location). Not by lint: a `house` rule flagging `useLocation` would have to exempt the intent-following rail and panels (an allow-list of named components), so it is parked until the shell block exists.

## 3. The skeleton enters inside the navigation's transition

**Rule.** The pending UI (the next page's skeleton) is swapped in **inside** the navigation's view transition, so the title, the actions and the body
change together. A navigation made with `viewTransition: false` stays without animation, skeleton included, and its flag is never spent by the swap.

**Why.** Header early, body jumping to the skeleton with no animation, then fading to the content ([#315](https://github.com/radandevist/shopkart-os/pull/315)).

**Enforced by.** "draws the skeleton inside the navigation view transition", "keeps `navigate({ viewTransition: false })` for the commit".

## 4. A deferred callback re-checks its premise (the stuck skeleton)

**Rule.** A browser defers a view transition's update callback (1.6 s measured under fast taps). Whatever it applies must be **re-validated when it
runs**: the router still `pending`, the same location, the matches it was built from still the current ones. A stale offer is dropped, before **and**
inside the deferred callback. The check is true from the commit itself, not from the router going idle one transition later.

**Why.** After fast navigation below `md` the page loaded and committed, then the late callback painted a stale « pending » snapshot over it: router idle
with a `pending` match, nothing left to correct it, only a browser reload fixed it ([#320](https://github.com/radandevist/shopkart-os/pull/320)). It was found by a hand-made torture run, not by a test.

**Enforced by.** `pending-swap` tests (callback after commit, after a superseding navigation, in the gap between commit and idle, the normal case);
`nav-stress` invariants "router idle with a page still pending" and "skeleton(s) still on screen".

## 5. Never an infinite skeleton

**Rule.** A page never rests on its skeleton. Three nets sit under the router: a loader call with no answer after 20 s fails with `load_timeout` (the page's
error screen, with a retry); a load pending for 15 s, or a router idle with a page still pending, is revalidated once; the check also runs when the tab becomes
visible and when the network returns. State the limits honestly: the timeout covers only the calls the app declares as loaders (`isLoaderCall`, **no default** — an
app whose root `beforeLoad` is a GET server function must decide whether that read is a loader), and the revalidation happens **once** (a fourth net is a parked issue). The timeout chains the caller's abort
signal by hand (no `AbortSignal.any`: Safari < 17.4, old WebViews), keeps a caller's own abort error, lets an action that is a GET opt out with a header, and a query layer must not retry a `load_timeout`
(`isLoadTimeout`) ([#320](https://github.com/radandevist/shopkart-os/pull/320)).

**Why.** After the fix of lesson 4 there was still no net at all: a server that stopped answering meant a skeleton for good ([#320](https://github.com/radandevist/shopkart-os/pull/320)). The nets recognise one transport only, hence the injectable `isLoaderCall`.

**Enforced by.** `load-guard` tests (limits, once-only, visibility/online, hung call, caller's own abort kept, opt-out header, mutations untouched);
`nav-stress` at rest. The error screen that renders `load_timeout` is the app's (or the error block's).

## 6. The next page's skeleton shows from the click, not after the session read (for a page that is not cached)

**Rule.** Below `md`, from the click: the router offers the skeleton as soon as the page's load starts (`defaultPendingMs: 0`); the swap waits one task so a
**cached page shows no skeleton at all**; if the root `beforeLoad` is slow, an early offer is built at ~80 ms. From `md`, 150 ms **counted from the
navigation's start**. `defaultPendingMs: 0` and the swap are one contract: setting one without the other is a bug.

**Why.** The router only offers a skeleton after the root route's `beforeLoad` (a network call on every navigation) and `pendingMs`: the old page stayed
frozen 0.8–1 s on a slow link (3 s+ in dev), and the first fix flashed skeletons on cached pages ([#321](https://github.com/radandevist/shopkart-os/pull/321)).

**Known limit.** A page that is **already cached** still freezes during the root `beforeLoad` (session read on every navigation): ~0.7 s at 600 ms latency ([#321](https://github.com/radandevist/shopkart-os/pull/321) limits). Fixing it means caching that read client-side, which changes how a session expiry is detected: a separate product decision, not part of this rule.

**Enforced by.** `pending-swap` tests ("offers the next page skeleton 80 ms after the click, below md", "leaves md and wider to the router", "shows no
skeleton for a page that commits within the same task", "from md keeps a 150 ms wait"); the **real-router** contract test (the fake-router tests cannot
catch an upgrade that adds a tick); `install` warns in dev when `defaultPendingMs !== 0`.

## 7. Private router internals live in one file, pinned, and fail loudly

**Rule.** Whatever reads a router's non-public state (`_tx`, positional tuples, the `Transitioner`'s reassignment of `startTransition`) lives in **one**
file, with typed access, a runtime shape check, a version-bounded peer range and an exact dev pin. A shape mismatch never throws, **never degrades
silently** (dev warning + a `health()` the tools read), and is covered by a test on the **real** pinned router.

**Why.** The early skeleton reads the router's load transaction; an upgrade that reorders it must not ship a quietly worse app ([#321](https://github.com/radandevist/shopkart-os/pull/321), which pinned the
router exactly and isolated the read in `earlyOffer`). ShopKartOS's version fails safe but silently.

**Enforced by.** The adapter's contract test (runs in `pnpm test`, so on every dependency bump, Renovate's included) — **with its limits**: it stubs `startViewTransition` and `CSS.supports` (jsdom has neither) and so proves the
private-shape and call-count contract, **including that the swap's and the commit's `types` calls receive the same location object**; the browser's *deferred* callback is reproduced only by a deliberate deferring stub, so
the staleness rules rest on `nav-stress` in real Chromium. Also: the compile-time tuple assertion; each app's test that its router satisfies radan-ui's peer window; `nav-stress` fails on a `shape-mismatch` published by the
adapter on `window.__radanUiPageTransitions`.

## 8. A page never animates itself; a screen is declared

**Rule.** A page or screen enter/exit animation is **never written per page**. The shared transition is the only place; a route whose search param opens a
phone screen (Settings `?section=`) declares it (`screenParams`) and is then treated like a change of page.

**Why.** The shared transition only recognised a new page when the pathname changed, so Settings sections (same pathname) got a hand-made slide
([#300](https://github.com/radandevist/shopkart-os/pull/300)) that pushed content 12 px off-screen, widened the document, detached the top bar and ignored the user's transition style ([#303](https://github.com/radandevist/shopkart-os/pull/303)).

**Enforced by.** `no-page-level-animation` (a test scanning styles and components for page/screen/section/route + enter/exit keyframes, with a message that
points here; a `house` lint rule is the planned home); the direction tests for screens (index → section push, section → index back, section → section push,
in-place replace none).

## 9. Transition marks live exactly as long as the transition

**Rule.** The attributes the CSS reads (`data-page-transition`, `data-page-direction`) exist from just before the transition to its settle (finished, skipped
or aborted); the newest transition owns them; a throwing `startViewTransition` falls back to a plain update with the marks cleared. The two marks the app
arms itself (back arrow traversal, fallback to the parent) **expire or roll back**: a navigation that failed, or a `back()` that never traversed, leaves
nothing for the next one.

**Why.** Marks left on `<html>` restyle later transitions; an armed mark outliving its navigation made a later system gesture look app-started (double animation on iOS) ([#241](https://github.com/radandevist/shopkart-os/pull/241), then
the review round that made the arrow "never stay dead").

**Status.** The expiring/rolling-back marks are the **target** (radan-ui's 0.7 core has them); the shared system first adopts ShopKartOS's simpler flags unchanged (S1) and brings the hardening back as an explicit, separately tested change (S2).

**Enforced by.** guard tests (finish, abort, throw, older settling under a newer transition), marks tests on both the Navigation-API and the popstate-only paths; the transition walk; `nav-stress`
("view transition marks left on <html>").

## 10. One motion setting, one source: `html[data-motion]`

**Rule.** The user's style (`auto | ios | material | none`) resolves **once** to `html[data-motion]` (`auto` by platform, reduced motion → `none`); every surface
(page, drawer, sheet, sub-menu, swipe-dismiss, speed dial) and every JS timer reads it, never its own duration or curve. It is set **before the first paint**
(inline script, with the CSP nonce), re-applied after the document is swapped, and followed from another tab. `none` is **1 ms, not 0** wherever
something waits for `transitionend`.

**Why.** The setting only applied to pushed pages; drawers, sheets and the speed dial ignored it, a drawer opened by a row click had no entry animation at
all, and the first paint had no attribute ([#311](https://github.com/radandevist/shopkart-os/pull/311)).

**Scope.** The per-style duration/curve tokens apply **below `md`**; the `none` rule and reduced motion apply at **every width** ([#311](https://github.com/radandevist/shopkart-os/pull/311)).

**Enforced by.** `motion-single-source` (every surface file free of hard-coded durations/curves, every style sets every shared duration, `none` is 1 ms);
the script-equivalence test (built script vs `appliedStyle` over a user-agent × stored × reduced matrix).

## 11. iPhone tab switches are instant; Material fades through

**Rule.** A top-level → top-level change is a **fade-through on Material** and **nothing on iOS** (a native tab bar switches instantly). Never a generic
cross-fade.

**Why.** Product decision, ShopKartOS [#311](https://github.com/radandevist/shopkart-os/pull/311); the earlier 150 ms cross-fade for both styles was a guess. (`native-navigation.md` is amended to match.)

**Enforced by.** `transitionFor('fade', …)` tests per style; the CSS conformance test.

## 12. The back arrow never stays dead and never goes twice

**Rule.** A tap on the arrow is ignored for a short window (one navigation per tap), no state outlives the window, and a failed navigation clears its marks.
With no earlier entry of the **app's own** history (`__TSR_index`, never `history.length`) it **replaces** with the parent.

**Why.** A second tap went back twice; a failed `navigate` left the arrow dead or a mark armed ([#241](https://github.com/radandevist/shopkart-os/pull/241), review rounds).

**Enforced by.** `createTapGuard` and `goBack` tests (guard window, rollback on failure, parent fallback).

## 13. Nothing may make the document wider than the viewport

**Rule.** No page is wider than the viewport, at any width, even by 1 px, even mid-animation. It is fixed in the shared template, not page by page, and the
layout check (`h-scroll`, `outside`, `covered`, `clearance`, `bar-moved`) runs at 390 (touch) / 1024 / 1440, light and dark, scrolled to top/middle/bottom.

**Why.** A 1 px overflow aborted view transitions (« viewport size changed ») ([#241](https://github.com/radandevist/shopkart-os/pull/241)); a hand-written 12 px slide did the same on Settings ([#303](https://github.com/radandevist/shopkart-os/pull/303)); content glued to the
top bar was found by the owner, not by a test ([#306](https://github.com/radandevist/shopkart-os/pull/306)).

**Enforced by.** `layout-check` (`@radandevist/radan-ui/qa`, second PR); a route added without being listed fails the app's route-coverage test.

## 14. A tool that can pass by doing nothing is not a tool

**Rule.** A stress or layout harness **fails loudly** when its premise is missing (no router handle, adapter unavailable, no seeded data): a distinct exit
code (2), never a green run. It reports the failing round's screenshot, the seed that replays it, and one line per defect with route, rule, element and
rectangle.

**Why.** The first `nav-stress` would have tapped nothing and passed without `window.__TSR_ROUTER__` ([#320](https://github.com/radandevist/shopkart-os/pull/320) review).

**Enforced by.** `runNavStress` pre-flight (router handle) and post-check of the adapter's published state — the tool runs in Node against a **built** app, so the state is exposed on `window.__radanUiPageTransitions` (an in-app `health()` or a dev warning would be unreachable and the canary would never fire); exit 0 = clean, 1 = a defect, 2 = the run could not be made.

## 15. Any change to transitions, the swap or pending handling is replayed through `nav-stress`

**Rule.** Fast taps (2–6 navigations 0–120 ms apart, router navigate and history Back), **every loader delayed** 0–900 ms, **CPU throttled 4×**, 4 s of
rest, then assert: no visible skeleton, no `pending` match on an idle router, no transition marks, no live view transition. Seeds replay. Before/after
numbers go in the PR. It is also run on a real phone before any change to the swap or the early offer.

**Why.** [#320](https://github.com/radandevist/shopkart-os/pull/320) found 3 of 3 runs stuck on `main` and 0 after the fix; [#321](https://github.com/radandevist/shopkart-os/pull/321) re-ran it (0 stuck) after moving the logic. The bug had been **proven in desktop Chromium and not yet
replayed on the phone** at merge.

`nav-stress` asserts the **resting** state only: a change to a *direction* passes it. The transition walk (startViewTransition count + direction + style per navigation kind, old vs new build byte-identical) is the companion check for any refactor that must not change behaviour.

**Enforced by.** The tools themselves (a short smoke in CI on every PR, the full run nightly and on adapter/core PRs — a full run is slow and timing-flaky as a required check); the migration gates in the design spec.

## 16. A fix lands with the test that fails without it

**Rule.** Every navigation fix ships a test that **fails on the previous code**, stated in the PR ("fails on `main`: functions absent" / "deferred callback after
commit"). A fix that only passes is a guess.

**Why.** [#315](https://github.com/radandevist/shopkart-os/pull/315) and [#320](https://github.com/radandevist/shopkart-os/pull/320) both listed their tests as red on `main`; the bugs they fix are the ones that came back one level down.

**Enforced by.** Review (the PR template's gate); nothing automatic.

## Constraints that came from reading the apps, not from a bug

- **Inline scripts carry the CSP nonce.** An app with a per-request nonce blocks a nonce-less inline script, and `data-motion` is then never set, silently
  (the CSS neutral fallback hides it). `MotionScript` takes `nonce`.
- **"Top level" and "screen" are app decisions.** A path-segment count is wrong for an app whose top-level pages are two segments; the app supplies
  `isTopLevel` (from its route metadata) and `screenParams`.
- **"A loader" is app-specific.** The 20 s timeout recognises only the calls the app says are loaders (`isLoaderCall`); an app with no server functions gets
  no net from the default.
- **The library never patches a global it cannot undo** (`window.fetch`) and never calls a bundler's HMR API.

Related: [native-navigation.md](./native-navigation.md), [skeletons.md](./skeletons.md), [motion.md](./motion.md), [mobile-native.md](./mobile-native.md).
