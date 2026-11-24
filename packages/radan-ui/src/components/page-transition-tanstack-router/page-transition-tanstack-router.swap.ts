import type { ReportEarlyOffer } from './page-transition-tanstack-router.contract';
import { earlyOffer, transitionLocations, type EarlyRouter } from './page-transition-tanstack-router.internals';
import { staleOffer } from './page-transition-tanstack-router.offer';
import { MD, type Matches, type SwapRouter, type SwapState } from './page-transition-tanstack-router.state';

const DESKTOP_SKELETON_DELAY_MS = 150;
/**
 * The router offers a page's skeleton only once the root route's `beforeLoad` (the session, a network call on every
 * navigation) is done and the page's own starts: on a slow link the old page stays still until then. Below md the
 * skeleton is therefore offered from here after this wait, the way the router offers it itself; a faster root
 * `beforeLoad` makes the router's own offer come first and this one a no-op. `pendingMinMs` (300 ms): the router's own
 * offer always follows (the page's `beforeLoad` starts right after the root's) and, finding this skeleton presented,
 * starts the minimum from then, so an early skeleton is held like any other.
 */
const EARLY_SKELETON_MS = 80;

/** Below md, from each navigation's start: the next page's skeleton after `EARLY_SKELETON_MS` if nothing has shown yet. */
export const offerFromClick = (router: EarlyRouter, state: SwapState, report?: ReportEarlyOffer) =>
	router.subscribe('onBeforeLoad', ({ pathChanged }) => {
		state.navStartedAt = Date.now();
		if (pathChanged && globalThis.matchMedia && !globalThis.matchMedia(MD).matches) {
			setTimeout(() => {
				const offer = earlyOffer(router, report);
				if (offer) {
					void router.startTransition(offer.show, offer.matches);
				}
			}, EARLY_SKELETON_MS);
		}
	});

/**
 * The router swaps a slow page's skeleton in outside any view transition (header early, body jumped). This wraps
 * that swap in the navigation's view transition; the React adapter reassigns `router.startTransition` on every render (an
 * accessor keeps the wrap). A deferred swap NEVER applies once its load committed or was superseded (`staleOffer`,
 * and the commit counter), checked before and inside the browser's deferred callback. Returns what undoes it.
 *
 * The router offers that skeleton as soon as the page's load starts (`defaultPendingMs: 0`); this waits one task
 * below md (a page whose data is cached commits within it and never shows a skeleton), `DESKTOP_SKELETON_DELAY_MS` from md.
 */
export const animatePendingSwap = (router: SwapRouter, state: SwapState) => {
	let inner = router.startTransition;
	const innerVt = router.startViewTransition;
	router.startViewTransition = (...args) => {
		// The router's own (commit) view transition; the skeleton's swap raises `state.toPending` around its call.
		if (!state.toPending) {
			state.commits++;
		}
		// Every path traverses here, so the one-transition guard runs even where the router never calls `types` (no
		// view-transition types: Safari 18.0/18.1, Chrome 111–124). Only decide when the router will actually start one:
		// `viewTransition: false` and a router created without `routerOptions` must stay unmarked.
		if (state.decide && (router.shouldViewTransition ?? router.options.defaultViewTransition)) {
			const { from, to } = transitionLocations(router);
			const direction = state.decide(from, to);
			if (direction === undefined) {
				// An offer already played this navigation's transition (or none is wanted): a plain update, never a second one.
				router.shouldViewTransition = undefined;
				return args[0]();
			}
		}
		return innerVt.apply(router, args);
	};
	const swap = (fn: () => void, expected: Matches, stale: () => boolean) => {
		// `navigate({ viewTransition: false })`: the router forgets it after one call, so the swap must not spend it.
		if (router.shouldViewTransition === false) {
			return inner(fn, expected);
		}
		let rendered = false;
		state.toPending = true;
		try {
			// The wrapper's decision runs synchronously inside this call, before the flag drops.
			const done = router.startViewTransition(async () => {
				rendered = !stale() && (await inner(fn, expected));
			});
			return Promise.resolve(done).then(() => rendered);
		} finally {
			state.toPending = false;
		}
	};
	Object.defineProperty(router, 'startTransition', {
		configurable: true,
		get: () => (fn: () => void, expected: Matches) => {
			if (!expected.some((match) => match.status === 'pending')) {
				state.commits++;
				return inner(fn, expected);
			}
			const seen = state.commits;
			const offerStale = staleOffer(router);
			const stale = () => state.commits !== seen || offerStale();
			// From md: 150 ms counted from the navigation's start, as the router's own `pendingMs` did.
			const wait = globalThis.matchMedia?.(MD).matches
				? Math.max(0, DESKTOP_SKELETON_DELAY_MS - (Date.now() - (state.navStartedAt ?? Date.now())))
				: 0;
			return new Promise<void>((resolve) => setTimeout(resolve, wait)).then(() =>
				stale() ? false : swap(fn, expected, stale),
			);
		},
		set: (next: SwapRouter['startTransition']) => {
			inner = next;
		},
	});
	return () => {
		router.startViewTransition = innerVt;
		// Back to the plain field the router's React adapter keeps reassigning.
		Object.defineProperty(router, 'startTransition', { configurable: true, writable: true, value: inner });
	};
};
