import type { Direction } from '../page-transition/page-transition.contract';
import { beginPageTransition } from '../page-transition/page-transition.core';
import type { PageTransitionsOptions } from './page-transition-tanstack-router.contract';
import { placeOf, type Loc } from './page-transition-tanstack-router.place';
import type { SwapState } from './page-transition-tanstack-router.state';

type Change = { fromLocation?: Loc; toLocation: Loc };

/**
 * The router's `defaultViewTransition` for one router. One navigation, ONE transition: the skeleton's swap plays it
 * (`state.toPending`); once it has, the router's own pending offer and the commit for the same location object are plain
 * updates — otherwise the router's pending offer is that transition. The decision runs in the `startViewTransition`
 * wrapper (every path traverses it, including browsers that never call `types`); `types` only hands it back.
 */
export const createViewTransition = (state: SwapState, options: PageTransitionsOptions) => {
	const decide = ({ fromLocation, toLocation }: Change): Direction | undefined => {
		if (!globalThis.document) {
			return undefined;
		}
		if (state.swappedFor === toLocation) {
			// The skeleton's swap already played this navigation's transition. The router's own pending offer (slow root
			// `beforeLoad`, the early transition's update callback still deferred) is the same navigation: plain update.
			// The commit after it clears the mark.
			if (!state.toPending) {
				state.swappedFor = undefined;
			}
			return undefined;
		}
		const direction = beginPageTransition(
			placeOf(fromLocation, options),
			placeOf(toLocation, options)!,
			options.isTopLevel,
		);
		state.swappedFor = state.toPending ? toLocation : undefined;
		return direction;
	};
	state.decide = (fromLocation, toLocation) => {
		const direction = decide({ fromLocation, toLocation });
		state.decidedFor = { to: toLocation, direction };
		return direction;
	};
	return {
		types: ({ fromLocation, toLocation }: Change) => {
			const decided = state.decidedFor?.to === toLocation ? state.decidedFor : undefined;
			state.decidedFor = undefined;
			// Called standalone (a unit test, an app): decide now, exactly as the wrapper does for every call.
			const direction = decided ? decided.direction : decide({ fromLocation, toLocation });
			return direction ? [direction] : (false as const);
		},
	};
};
