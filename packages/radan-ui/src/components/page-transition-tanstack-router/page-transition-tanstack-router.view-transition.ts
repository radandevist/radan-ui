import { beginPageTransition } from '../page-transition/page-transition.core';
import type { PageTransitionsOptions } from './page-transition-tanstack-router.contract';
import { placeOf, type Loc } from './page-transition-tanstack-router.place';
import type { SwapState } from './page-transition-tanstack-router.state';

/**
 * The router's `defaultViewTransition` for one router: it runs for every navigation, the popstate ones (the phone's
 * back button) included. One navigation, ONE transition: the skeleton's swap plays it (`state.toPending`); the router's
 * own pending offer and the commit after it, for the same location object, are plain updates. A later navigation has its
 * own location object, so it never reads a stale mark.
 */
export const createViewTransition = (state: SwapState, options: PageTransitionsOptions) => ({
	types: ({ fromLocation, toLocation }: { fromLocation?: Loc; toLocation: Loc }) => {
		if (!globalThis.document) {
			return false as const;
		}
		if (state.swappedFor === toLocation) {
			// The skeleton's swap already played this navigation's transition. The router's own pending offer (slow root
			// `beforeLoad`, the early transition's update callback still deferred) is the same navigation: plain update.
			// The commit after it clears the mark.
			if (!state.toPending) {
				state.swappedFor = undefined;
			}
			return false as const;
		}
		const direction = beginPageTransition(
			placeOf(fromLocation, options),
			placeOf(toLocation, options)!,
			options.isTopLevel,
		);
		state.swappedFor = state.toPending ? toLocation : undefined;
		return direction ? [direction] : (false as const);
	},
});
