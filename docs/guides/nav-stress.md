# Running `nav-stress` and the transition walk in an app

`@radandevist/radan-ui/qa` is a Node-only subpath: two functions the app calls from a ~25-line script. The tool owns the **invariants** (what a resting app must never show); the app owns what cannot be configured away (starting its server, seeding data, logging in, its routes, which requests are loaders). Spec: [`../specs/2026-11-21-page-transitions-design.md`](../specs/2026-11-21-page-transitions-design.md) §9; the lessons it enforces: [`../rules/navigation.md`](../rules/navigation.md) 14 and 15.

Playwright is **not** a dependency of radan-ui. `playwright-core` is an optional peer (`>=1.60`), imported as types only; the app passes `launch`. Install it (or `@playwright/test`) in the app, and never import `@radandevist/radan-ui/qa` from web code.

## `runNavStress`

Taps through the app as fast as a thumb can (router `navigate` and history Back, 2 to 6 taps a round), every loader delayed, the CPU throttled 4x, then rests 4 s and asserts `restingProblems`: no visible `[aria-busy="true"]` region, no router `idle` with a `pending` match, no `data-page-direction` / `data-page-transition` left on `<html>`, no live `document.activeViewTransition`.

```ts
import { chromium } from '@playwright/test';
import { runNavStress, QaSetupError } from '@radandevist/radan-ui/qa';

try {
	const runs = await runNavStress({
		baseUrl,                                  // a running, BUILT app
		launch: () => chromium.launch(),
		login: async (page) => { /* sign in; the page is already on baseUrl */ },
		routes: ['/', '/pickups', '/pickups/P-1'], // top-level pages + one detail page of each kind (you seed the ids)
		delayedRequests: '**/_serverFn/**',        // your loaders
	});
	process.exitCode = runs.every((r) => r.stuck.length === 0) ? 0 : 1;
} catch (cause) {
	process.exitCode = cause instanceof QaSetupError ? 2 : 3;
}
```

Knobs: `seeds` (default `[1, 2, 3]`: a seed replays the same taps, not the timings), `rounds` (25), `ignoreSelector` (a skeleton the app keeps on purpose, e.g. `[data-restore-skeleton]`), `ua` (`'android'` default, or `'ios'`), `taps` (`'awaited'` by default, ShopKartOS's behaviour: a tap waits for its page's load; `'fire'`: it does not, so the next tap interrupts a load in flight), `delayMs` (`'rand'`, 0 to 900 ms per request, or a number: a fixed delay makes the run replay exactly), `screenshotDir`. Everything else (390 px touch, CPU 4x, 40 ms gap, 4 s rest) is a constant until a third app asks.

**Exit codes** (your script maps them): 0 clean, 1 a stuck page (each `stuck` entry has the round, one line per problem and a screenshot), **2 the run could not be made**. `QaSetupError` is thrown when the page exposes no `window.__TSR_ROUTER__` (a run that taps nothing passes for nothing) and when the page transitions adapter reports `shape-mismatch` on `window.__radanUiPageTransitions` (the router's private state moved: lesson 7). `no-pending-component` is legitimate (a route family without skeleton yet): it is returned as `earlyOffer`, not failed by `runNavStress`; an app whose setup guarantees the early skeleton (the catalog demo does) asserts `earlyOffer === 'ok'` in its own script, as `apps/catalog/scripts/nav-stress.ts` does. A demo or app whose root `beforeLoad` is slow and whose leaves have a `pendingComponent` reports `ok`: the canary that the early skeleton really ran.

Run it against the **built** app, never in CI as the only full check: a full run (3 seeds x 25 rounds) is about ten minutes and its timings are not replayable, so a required check on it would be flaky. radan-ui runs a short fixed smoke (`seeds: [1], rounds: 5, delayMs: 300, taps: 'fire'`) on PRs and main pushes that touch the paths of `.github/workflows/nav-stress-pr.yml`, and the full run nightly, awaited then fire (`.github/workflows/nav-stress-nightly.yml`).

## `runTransitionWalk`

`nav-stress` asserts the resting state: a refactor that changes a *direction* passes it. The walk records, for each scripted navigation, what the app did: the `document.startViewTransition` call count, `<html data-page-direction>` and `data-page-transition` at each call.

```ts
const steps: WalkStep[] = [
	{ name: 'rail link', run: (page) => page.getByRole('link', { name: 'Pickups' }).click() },
	{ name: 'back arrow, with history', run: (page) => page.locator('[data-page-back]').click() },
	// … one step per navigation kind
];
const records = await runTransitionWalk({ baseUrl, launch, login, delayedRequests, steps });
```

The app lists its kinds (rail, drawer, back arrow with and without history, history back and forward, a notification sheet closing, `viewTransition: false`, a section param, a first load…). Steps run in order on one page per variant, each after the router is idle; each leaves the next one's starting point. Every step runs over the matrix **Android and iOS user agent x Navigation API present and removed (`delete window.navigation` before the page loads: the popstate-only path) x loader delay 0 and 600 ms** (fixed far from the 80/150 ms timers: the plain-commit path and the swap path); a config value (`ua`, `navigationApi`, `delayMs`) narrows the matrix to one. A record is `{ variant, step, startViewTransition, direction, style }`; `direction` and `style` join the values at each call with `,`.

To prove a refactor changes nothing observable:

1. Check the step list in **once**; never edit it between the old and the new build.
2. Run the walk **twice on the old build** and require `old == old` (`diff`). A walk that is not deterministic proves nothing: fix the steps (a wait), not the comparison.
3. Run it on the new build and `diff` the JSON: byte-identical. A difference is investigated, never retried away.

The same list is the regression test for a deliberate change: it may alter exactly the records it claims to. It needs `document.startViewTransition`: Chromium. Playwright's WebKit on Linux has none (and no Navigation API), so it throws `QaSetupError` there; treat WebKit as best-effort at most, never a gate. The iOS code paths are covered by the iOS user agent and the popstate-only variants in Chromium, not by Safari's own edge swipe.

## The recipe in this repo

`apps/catalog/router-demo/` is a real TanStack Router app (the R2 adapter, the load guard, the phone top bar) and `apps/catalog/scripts/` is the recipe above: `demo.ts` (serve + launch), `nav-stress.ts`, `walk-steps.ts`, `walk.ts` (`--check` against the checked-in `walk.expected.json`, `--update` to rewrite it). After `pnpm catalog:build`:

```sh
pnpm --filter catalog qa:nav-stress --smoke   # the PR smoke
pnpm --filter catalog qa:nav-stress           # the full run
pnpm --filter catalog qa:walk --check
```

Set `CHROME_PATH` to use an already installed Chromium instead of Playwright's own.

## What the end-to-end run does not prove

`nav-stress` asserts the resting state of a headless Chromium on small pages. It does **not** reproduce the browser holding a view transition's update callback past the commit (1.6 s measured on a phone, #320), which is how the stale skeleton happened: in this repo's demo, reverting the stale-offer check (`staleOffer` always false, and also the commit counter) left the smoke and the full run at 0 stuck, in both tap modes. That rule is proved by the adapter's unit and contract tests (reverting `staleOffer` alone fails 3 of them, both nets 5) and, per lesson 15, by a replay on a real phone before any change to the swap or the early offer.
